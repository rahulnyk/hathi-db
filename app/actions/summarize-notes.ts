"use server";

import { fetchNotesByIds } from "@/app/actions/notes";
import type { Note } from "@/store/notesSlice";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Schema for AI-generated summary structure
 */
const summarySchema = z.object({
    overview: z.string().describe("Brief overview of the notes"),
    keyThemes: z
        .array(z.string())
        .describe("Main themes and topics found in the notes"),
    actionItems: z
        .array(z.string())
        .describe("Action items, todos, and tasks identified"),
    insights: z.array(z.string()).describe("Key insights and important points"),
    contexts: z
        .array(z.string())
        .describe("Main contexts or categories mentioned"),
});

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

        // Prepare notes content for AI analysis
        const notesContent = notes
            .map((note, index) => {
                let content = `Note ${index + 1}`;
                if (includeMetadata) {
                    content += ` (${note.note_type || "note"})`;
                    if (note.contexts?.length) {
                        content += ` [Contexts: ${note.contexts.join(", ")}]`;
                    }
                    content += ` (${new Date(
                        note.created_at
                    ).toLocaleDateString()})`;
                }
                content += `:\n${note.content}\n\n`;
                return content;
            })
            .join("");

        // Generate AI summary
        const { object: aiSummary } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: summarySchema,
            prompt: `Summarize the following ${notes.length} notes. Focus on:
- Important insights and takeaways
- Action items, todos, and tasks
- Main contexts and categories
Always provide a clear, concise summary that helps the user quickly understand the main points and actionable items from their notes. Always respond with markdown formatting.
Notes to summarize:
${notesContent}

Please provide a clear, concise summary that helps the user quickly understand the main points and actionable items from their notes.`,
        });

        // Build markdown summary from AI analysis
        let summary = `# Notes Summary\n\n`;

        if (includeMetadata) {
            const dateRange = getDateRange(notes);
            summary += `📊 **Overview:** ${notes.length} notes${
                dateRange ? ` spanning ${dateRange}` : ""
            }\n\n`;
        }

        // AI-generated overview
        if (aiSummary.overview) {
            summary += `## 📝 Overview\n\n${aiSummary.overview}\n\n`;
        }

        // Key themes
        if (aiSummary.keyThemes.length > 0) {
            summary += `## 🎯 Key Themes\n\n`;
            aiSummary.keyThemes.forEach((theme) => {
                summary += `• ${theme}\n`;
            });
            summary += `\n`;
        }

        // Action items
        if (aiSummary.actionItems.length > 0) {
            summary += `## ✅ Action Items\n\n`;
            aiSummary.actionItems.forEach((item) => {
                summary += `• ${item}\n`;
            });
            summary += `\n`;
        }

        // Key insights
        if (aiSummary.insights.length > 0) {
            summary += `## � Key Insights\n\n`;
            aiSummary.insights.forEach((insight) => {
                summary += `• ${insight}\n`;
            });
            summary += `\n`;
        }

        // Contexts (if different from what we show in metadata)
        if (
            aiSummary.contexts.length > 0 &&
            (!includeMetadata || aiSummary.contexts.length > 5)
        ) {
            summary += `## 🏷️ Main Contexts\n\n`;
            aiSummary.contexts.forEach((context) => {
                summary += `• ${context}\n`;
            });
            summary += `\n`;
        }

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

// Helper function for date range calculation
function getDateRange(notes: Note[]): string | null {
    if (notes.length === 0) return null;

    const dates = notes
        .map((note) => new Date(note.created_at))
        .sort((a, b) => a.getTime() - b.getTime());
    const earliest = dates[0];
    const latest = dates[dates.length - 1];

    if (earliest.toDateString() === latest.toDateString()) {
        return earliest.toLocaleDateString();
    }

    const diffTime = Math.abs(latest.getTime() - earliest.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffDays <= 30) {
        const weeks = Math.ceil(diffDays / 7);
        return `${weeks} week${weeks > 1 ? "s" : ""}`;
    } else {
        return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
    }
}
