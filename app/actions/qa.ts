"use server";

import { createClient } from "@/lib/supabase/server";
import { aiProvider } from "@/lib/ai";
import { formatNotesForContext } from "@/lib/prompts/qa-prompts";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

// Types for database responses
interface NoteWithSimilarity {
    id: string;
    content: string;
    contexts?: string[];
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
                p_similarity_threshold: 0.7, // Adjust threshold as needed
                p_limit: 10 // Limit results to most relevant notes
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
                    p_similarity_threshold: 0.5, // Lower threshold
                    p_limit: 15
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
    // Extract keywords from question for basic search
    const keywords = question.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'not', 'had'].includes(word));
    
    if (keywords.length === 0) {
        // If no good keywords, fetch recent notes
        const { data: recentNotes } = await supabase
            .from("notes")
            .select("id, content, contexts, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);
            
        return await generateAnswer(question, (recentNotes as NoteWithSimilarity[]) || [], userId, supabase);
    }

    // Build search query using keywords
    const searchTerm = keywords.join(' | '); // OR search
    
    const { data: keywordNotes } = await supabase
        .from("notes")
        .select("id, content, contexts, created_at")
        .eq("user_id", userId)
        .textSearch('content', searchTerm, { type: 'websearch' })
        .limit(15);

    return await generateAnswer(question, (keywordNotes as NoteWithSimilarity[]) || [], userId, supabase);
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
