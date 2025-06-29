"use server";

import { createClient } from "@/lib/supabase/server";
import { aiProvider } from "@/lib/ai";
import { formatNotesForContext } from "@/lib/prompts/qa-prompts";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QA_SEARCH_LIMITS, DEFAULT_SEARCH_LIMIT } from "@/lib/constants/qa";

// Types for database responses
interface NoteWithSimilarity {
    id: string;
    content: string;
    key_context?: string;
    contexts?: string[];
    tags?: string[];
    note_type?: string;
    suggested_contexts?: string[];
    created_at: string;
    similarity?: number;
}

interface ContextStat {
    context: string;
    count: number;
    lastUsed: string;
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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            redirect("/auth/login");
        }

        // Generate embedding for the question
        let questionEmbedding;
        try {
            questionEmbedding = await aiProvider.generateEmbedding({
                content: question
            });
        } catch (embeddingError) {
            console.error("Error generating embedding:", embeddingError);
            // Fallback to basic search if embedding generation fails
            return await fallbackToBasicSearch(question, user.id, supabase);
        }

        // Use semantic search to find relevant notes
        const { data: relevantNotes, error: searchError } = await supabase.rpc(
            'search_notes_by_similarity',
            {
                p_user_id: user.id,
                p_query_embedding: questionEmbedding.embedding,
                p_similarity_threshold: QA_SEARCH_LIMITS.HIGH_SIMILARITY_THRESHOLD,
                p_limit: DEFAULT_SEARCH_LIMIT
            }
        );

        if (searchError) {
            console.error("Error in semantic search:", searchError);
            // Fallback to basic search if semantic search fails
            return await fallbackToBasicSearch(question, user.id, supabase);
        }

        if (!relevantNotes || relevantNotes.length === 0) {
            // Try with lower threshold if no results
            const { data: fallbackNotes } = await supabase.rpc(
                'search_notes_by_similarity',
                {
                    p_user_id: user.id,
                    p_query_embedding: questionEmbedding.embedding,
                    p_similarity_threshold: QA_SEARCH_LIMITS.LOW_SIMILARITY_THRESHOLD,
                    p_limit: DEFAULT_SEARCH_LIMIT
                }
            );

            if (!fallbackNotes || fallbackNotes.length === 0) {
                return await fallbackToBasicSearch(question, user.id, supabase);
            }
            
            return await generateAnswer(question, (fallbackNotes as NoteWithSimilarity[]) || [], user.id, supabase);
        }

        return await generateAnswer(question, (relevantNotes as NoteWithSimilarity[]) || [], user.id, supabase);

    } catch (error) {
        console.error("Error in answerQuestion:", error);
        return {
            answer: "Sorry, I encountered an error while trying to answer your question. Please try again.",
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Fallback to basic keyword search when semantic search fails or returns no results
 */
async function fallbackToBasicSearch(question: string, userId: string, supabase: SupabaseClient): Promise<QAResult> {
    // First, try to get ANY notes for this user to see if they exist
    const { data: allNotes, error: notesError } = await supabase
        .from("notes")
        .select("id, content, key_context, contexts, tags, note_type, suggested_contexts, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(QA_SEARCH_LIMITS.MAX_USER_NOTES);
    
    if (notesError) {
        console.error("Error fetching notes:", notesError);
    }

    if (!allNotes || allNotes.length === 0) {
        return {
            answer: "I don't see any notes in your knowledge base yet. Try adding some notes first!",
            relevantSources: []
        };
    }

    // Extract keywords from question for basic search
    const keywords = question.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'not', 'had'].includes(word));
    
    if (keywords.length === 0) {
        return await generateAnswer(question, (allNotes.slice(0, DEFAULT_SEARCH_LIMIT) as NoteWithSimilarity[]) || [], userId, supabase);
    }

    // Try simple content matching first (case-insensitive) - now includes metadata
    const matchingNotes = allNotes.filter(note => {
        const content = note.content.toLowerCase();
        const keyContext = note.key_context?.toLowerCase() || '';
        const contexts = note.contexts?.join(' ').toLowerCase() || '';
        const tags = note.tags?.join(' ').toLowerCase() || '';
        const suggestedContexts = note.suggested_contexts?.join(' ').toLowerCase() || '';
        const allText = `${content} ${keyContext} ${contexts} ${tags} ${suggestedContexts}`;
        
        return keywords.some(keyword => allText.includes(keyword));
    });

    if (matchingNotes.length > 0) {
        return await generateAnswer(question, (matchingNotes.slice(0, DEFAULT_SEARCH_LIMIT) as NoteWithSimilarity[]) || [], userId, supabase);
    }

    // If no keyword matches, try PostgreSQL text search as last resort
    try {
        const searchTerm = keywords.join(' | '); // OR search
        
        const { data: keywordNotes } = await supabase
            .from("notes")
            .select("id, content, key_context, contexts, tags, note_type, suggested_contexts, created_at")
            .eq("user_id", userId)
            .textSearch('content', searchTerm, { type: 'websearch' })
            .limit(DEFAULT_SEARCH_LIMIT);
        
        if (keywordNotes && keywordNotes.length > 0) {
            return await generateAnswer(question, (keywordNotes as NoteWithSimilarity[]) || [], userId, supabase);
        }
    } catch (searchError) {
        console.error("PostgreSQL text search failed:", searchError);
    }

    // Final fallback: use most recent notes
    return await generateAnswer(question, (allNotes.slice(0, DEFAULT_SEARCH_LIMIT) as NoteWithSimilarity[]) || [], userId, supabase);
}

/**
 * Generate answer using AI with the retrieved notes
 */
async function generateAnswer(question: string, notes: NoteWithSimilarity[], userId: string, supabase: SupabaseClient): Promise<QAResult> {
    if (notes.length === 0) {
        return {
            answer: "I don't see any relevant notes in your knowledge base for this question. Try adding some notes first or asking about something else!",
            relevantSources: []
        };
    }

    // Get user's contexts for better AI understanding
    const { data: contextStats } = await supabase
        .rpc("get_user_context_stats", { p_user_id: userId });
    
    const userContexts = ((contextStats as ContextStat[]) || []).map(stat => stat.context);

    // Format notes for AI context
    const notesContext = formatNotesForContext(notes);

    // Call AI to answer the question
    const response = await aiProvider.answerQuestion({
        question,
        context: notesContext,
        userContexts
    });

    return {
        answer: response.answer,
        relevantSources: notes.map(note => note.id)
    };
}
