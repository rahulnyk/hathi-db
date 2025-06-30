"use server";

import { createClient } from "@/lib/supabase/server";
import { aiProvider } from "@/lib/ai";
import { formatNotesForContext } from "@/lib/prompts/qa-prompts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QA_SEARCH_LIMITS, DEFAULT_SEARCH_LIMIT } from "@/lib/constants/qa";
import { AI_ANSWERS_ENABLED } from "@/lib/constants/ai-config";
import type { Note } from "@/store/notesSlice";
import { fetchContextStats } from "./contexts";
import { getAuthUser } from "./get-auth-user";
// Types for database responses
interface NoteWithSimilarity
    extends Pick<
        Note,
        | "id"
        | "content"
        | "key_context"
        | "contexts"
        | "tags"
        | "note_type"
        | "suggested_contexts"
        | "created_at"
    > {
    similarity?: number;
}

export interface QAResult {
    answer: string;
    relevantSources?: string[];
    error?: string;
}

/**
 * Server action to answer a question based on user's notes using semantic search
 */
export async function answerQuestion(question: string): Promise<QAResult> {
    try {
        const supabase = await createClient();

        // Check authentication
        const user = await getAuthUser(supabase);

        // Generate embedding for the question
        let questionEmbedding;
        try {
            questionEmbedding = await aiProvider.generateEmbedding({
                content: question,
            });
        } catch (embeddingError) {
            console.error("Error generating embedding:", embeddingError);
            // Fallback to basic search if embedding generation fails
            return await fallbackToBasicSearch(question, supabase);
        }

        // Use semantic search to find relevant notes
        const { data: relevantNotes, error: searchError } = await supabase.rpc(
            "search_notes_by_similarity",
            {
                p_user_id: user.id,
                p_query_embedding: questionEmbedding.embedding,
                p_similarity_threshold:
                    QA_SEARCH_LIMITS.HIGH_SIMILARITY_THRESHOLD,
                p_limit: DEFAULT_SEARCH_LIMIT,
            }
        );

        if (searchError) {
            console.error("Error in semantic search:", searchError);
            // Fallback to basic search if semantic search fails
            return await fallbackToBasicSearch(question, supabase);
        }

        if (!relevantNotes || relevantNotes.length === 0) {
            // Try with lower threshold if no results
            const { data: fallbackNotes } = await supabase.rpc(
                "search_notes_by_similarity",
                {
                    p_user_id: user.id,
                    p_query_embedding: questionEmbedding.embedding,
                    p_similarity_threshold:
                        QA_SEARCH_LIMITS.LOW_SIMILARITY_THRESHOLD,
                    p_limit: DEFAULT_SEARCH_LIMIT,
                }
            );

            if (!fallbackNotes || fallbackNotes.length === 0) {
                return await fallbackToBasicSearch(question, supabase);
            }

            return await generateAnswer(
                question,
                (fallbackNotes as NoteWithSimilarity[]) || []
            );
        }

        return await generateAnswer(
            question,
            (relevantNotes as NoteWithSimilarity[]) || []
        );
    } catch (error) {
        console.error("Error in answerQuestion:", error);
        return {
            answer: "Sorry, I encountered an error while trying to answer your question. Please try again.",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Fallback to basic keyword search when semantic search fails or returns no results
 */
async function fallbackToBasicSearch(
    question: string,
    supabase: SupabaseClient
): Promise<QAResult> {
    // First, try to get ANY notes for this user to see if they exist
    const { id: userId } = await getAuthUser(supabase);

    const { data: allNotes, error: notesError } = await supabase
        .from("notes")
        .select(
            "id, content, key_context, contexts, tags, note_type, suggested_contexts, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(QA_SEARCH_LIMITS.MAX_USER_NOTES);

    if (notesError) {
        console.error("Error fetching notes:", notesError);
    }

    if (!allNotes || allNotes.length === 0) {
        return {
            answer: "I don't see any notes in your knowledge base yet. Try adding some notes first!",
            relevantSources: [],
        };
    }

    // Extract keywords from question for basic search
    const keywords = question
        .toLowerCase()
        .split(/\s+/)
        .filter(
            (word) =>
                word.length > 2 &&
                ![
                    "the",
                    "and",
                    "for",
                    "are",
                    "but",
                    "not",
                    "you",
                    "all",
                    "can",
                    "had",
                    "her",
                    "was",
                    "one",
                    "our",
                    "out",
                    "day",
                    "get",
                    "has",
                    "him",
                    "his",
                    "how",
                    "its",
                    "may",
                    "new",
                    "now",
                    "old",
                    "see",
                    "two",
                    "way",
                    "who",
                    "boy",
                    "did",
                    "not",
                    "had",
                ].includes(word)
        );

    if (keywords.length === 0) {
        return await generateAnswer(
            question,
            (allNotes.slice(0, DEFAULT_SEARCH_LIMIT) as NoteWithSimilarity[]) ||
                []
        );
    }

    // Try simple content matching first (case-insensitive) - now includes metadata
    const matchingNotes = allNotes.filter((note) => {
        const content = note.content.toLowerCase();
        const keyContext = note.key_context?.toLowerCase() || "";
        const contexts = note.contexts?.join(" ").toLowerCase() || "";
        const tags = note.tags?.join(" ").toLowerCase() || "";
        const suggestedContexts =
            note.suggested_contexts?.join(" ").toLowerCase() || "";
        const allText = `${content} ${keyContext} ${contexts} ${tags} ${suggestedContexts}`;

        return keywords.some((keyword) => allText.includes(keyword));
    });

    if (matchingNotes.length > 0) {
        return await generateAnswer(
            question,
            (matchingNotes.slice(
                0,
                DEFAULT_SEARCH_LIMIT
            ) as NoteWithSimilarity[]) || []
        );
    }

    // If no keyword matches, try PostgreSQL text search as last resort
    try {
        const searchTerm = keywords.join(" | "); // OR search

        const { data: keywordNotes } = await supabase
            .from("notes")
            .select(
                "id, content, key_context, contexts, tags, note_type, suggested_contexts, created_at"
            )
            .eq("user_id", userId)
            .textSearch("content", searchTerm, { type: "websearch" })
            .limit(DEFAULT_SEARCH_LIMIT);

        if (keywordNotes && keywordNotes.length > 0) {
            return await generateAnswer(
                question,
                (keywordNotes as NoteWithSimilarity[]) || []
            );
        }
    } catch (searchError) {
        console.error("PostgreSQL text search failed:", searchError);
    }

    // Final fallback: use most recent notes
    return await generateAnswer(
        question,
        (allNotes.slice(0, DEFAULT_SEARCH_LIMIT) as NoteWithSimilarity[]) || []
    );
}

/**
 * Generate answer using AI with the retrieved notes, or show sources directly
 */
async function generateAnswer(
    question: string,
    notes: NoteWithSimilarity[]
): Promise<QAResult> {
    if (notes.length === 0) {
        return {
            answer: "I don't see any relevant notes in your knowledge base for this question. Try adding some notes first or asking about something else!",
            relevantSources: [],
        };
    }

    // Check if AI answers are enabled
    if (!AI_ANSWERS_ENABLED) {
        // Return a simple message and let the source notes do the talking
        return {
            answer: `Found ${notes.length} relevant note${
                notes.length === 1 ? "" : "s"
            } for: "${question}"`,
            relevantSources: notes.map((note) => note.id),
        };
    }

    const contextStats = await fetchContextStats();

    const userContexts = (contextStats || []).map((stat) => stat.context);

    // Format notes for AI context
    const notesContext = formatNotesForContext(notes);

    // Call AI to answer the question
    const response = await aiProvider.answerQuestion({
        question,
        context: notesContext,
        userContexts,
    });

    return {
        answer: response.answer,
        relevantSources: notes.map((note) => note.id),
    };
}
