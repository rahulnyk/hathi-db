"use server";

import { fetchNotesByIds } from "@/app/actions/notes";
import { generateText } from "ai";
import { gemini } from "@/lib/ai";
import { summarizeNotesPrompt } from "@/lib/prompts/summarize-notes-prompt";

/**
 * Parameters for summarizing notes
 */
export interface SummarizeNotesParams {
    /** Array of note IDs to summarize */
    noteIds: string[];
    /** Whether to include metadata like creation date and contexts */
    includeMetadata?: boolean;
}

/**
 * Result interface for the summarizeNotes function
 */
export interface SummarizeNotesResult {
    success: boolean;
    summary: string;
    noteCount: number;
    message: string;
    error?: string;
}

/**
 * Generate a clear, succinct, and itemized summary of provided notes in markdown format
 *
 * @param params - Parameters for summarizing notes
 * @returns Promise that resolves to summary result
 */
export async function summarizeNotes(
    params: SummarizeNotesParams
): Promise<SummarizeNotesResult> {
    try {
        const { noteIds, includeMetadata = true } = params;

        // Get the notes by their IDs
        const notes = await fetchNotesByIds(noteIds);

        if (!notes.length) {
            return {
                success: false,
                summary: "",
                noteCount: 0,
                message: "No notes found with the provided IDs.",
            };
        }

        // Generate AI summary using generateText
        const { text: summary } = await generateText({
            model: gemini("gemini-2.5-flash"),
            prompt: summarizeNotesPrompt(notes, includeMetadata),
        });

        return {
            success: true,
            summary,
            noteCount: notes.length,
            message: `Generated AI-powered summary for ${notes.length} notes with intelligent analysis.`,
        };
    } catch (error) {
        console.error("Error generating AI summary:", error);
        return {
            success: false,
            summary: "",
            noteCount: 0,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            message: "Failed to generate AI summary. Please try again.",
        };
    }
}
