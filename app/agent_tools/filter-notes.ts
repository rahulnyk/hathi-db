"use server";

import { createDb } from "@/db/connection";
import { notes } from "@/db/schema";
import { measureExecutionTime } from "@/lib/performance";
import type { Note } from "@/store/notesSlice";
import { TodoStatus } from "@/store/notesSlice";
import type { SearchResultNote } from "./types";
import { and, gte, lte, eq, desc, arrayContains, count } from "drizzle-orm";

/**
 * Filters interface for the filterNotes function
 */
export interface NotesFilter {
    /** Filter by creation date - notes created after this date */
    createdAfter?: string; // ISO date string
    /** Filter by creation date - notes created before this date */
    createdBefore?: string; // ISO date string
    /** Filter by contexts - notes containing any of these contexts */
    contexts?: string[];
    /** Filter by hashtags/tags - notes containing any of these tags */
    hashtags?: string[];
    /** Filter by note type */
    noteType?: string;
    /** Filter by deadline - notes with deadline after this date */
    deadlineAfter?: string; // ISO date string
    /** Filter by deadline - notes with deadline before this date */
    deadlineBefore?: string; // ISO date string
    /** Filter by deadline - notes with deadline on this specific date */
    deadlineOn?: string; // ISO date string (YYYY-MM-DD format)
    /** Filter by TODO status */
    status?: TodoStatus;
    /** Search in note content (case-insensitive partial match) */
    // searchTerm?: string;
    /** Maximum number of notes to return (default: 20) */
    limit?: number;
}

/**
 * Result interface for the filterNotes function
 */
export interface FilterNotesResult {
    notes: SearchResultNote[];
    totalCount: number;
    appliedFilters: {
        createdAfter?: string;
        createdBefore?: string;
        contexts?: string[];
        // hashtags?: string[];
        noteType?: string;
        deadlineAfter?: string;
        deadlineBefore?: string;
        deadlineOn?: string;
        status?: TodoStatus;
        // searchTerm?: string;
        limit: number;
    };
}

/**
 * Filters and retrieves notes based on given parameters
 * Returns max 20 notes by default, can be configured up to 50
 *
 * @param filters - Filter parameters for notes
 * @returns Promise that resolves to filtered notes with metadata
 */
export async function filterNotes(
    filters: NotesFilter = {}
): Promise<FilterNotesResult> {
    return measureExecutionTime("filterNotes", async () => {
        console.log("Filtering notes with filters:", filters);

        const db = createDb();
        try {
            await db.$client.connect();

            // Set default and maximum limits
            const limit = Math.min(filters.limit || 20, 50);

            // Build the query conditions
            const conditions = [];

            // Apply date filters
            if (filters.createdAfter) {
                conditions.push(
                    gte(notes.created_at, new Date(filters.createdAfter))
                );
            }
            if (filters.createdBefore) {
                conditions.push(
                    lte(notes.created_at, new Date(filters.createdBefore))
                );
            }

            // Apply context filters
            if (filters.contexts && filters.contexts.length > 0) {
                // Filter notes that contain ALL of the specified contexts
                for (const context of filters.contexts) {
                    conditions.push(arrayContains(notes.contexts, [context]));
                }
            }

            // Apply note type filter
            if (filters.noteType) {
                conditions.push(eq(notes.note_type, filters.noteType));
            }

            // Apply deadline filters
            if (filters.deadlineAfter) {
                conditions.push(
                    gte(notes.deadline, new Date(filters.deadlineAfter))
                );
            }
            if (filters.deadlineBefore) {
                conditions.push(
                    lte(notes.deadline, new Date(filters.deadlineBefore))
                );
            }
            if (filters.deadlineOn) {
                // Filter for notes with deadline on a specific date
                const startOfDay = new Date(
                    `${filters.deadlineOn}T00:00:00.000Z`
                );
                const endOfDay = new Date(
                    `${filters.deadlineOn}T23:59:59.999Z`
                );
                conditions.push(
                    and(
                        gte(notes.deadline, startOfDay),
                        lte(notes.deadline, endOfDay)
                    )
                );
            }

            // Apply status filter
            if (filters.status) {
                conditions.push(eq(notes.status, filters.status));
            }

            // Get the total count
            const countQuery = db
                .select({ count: count() })
                .from(notes)
                .where(conditions.length > 0 ? and(...conditions) : undefined);

            const countResult = await countQuery;
            const totalCount = countResult[0]?.count || 0;

            // Get the filtered notes
            const query = db
                .select()
                .from(notes)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(desc(notes.created_at))
                .limit(limit);

            const data = await query;

            // Prepare applied filters for response
            const appliedFilters = {
                ...(filters.createdAfter && {
                    createdAfter: filters.createdAfter,
                }),
                ...(filters.createdBefore && {
                    createdBefore: filters.createdBefore,
                }),
                ...(filters.contexts &&
                    filters.contexts.length > 0 && {
                        contexts: filters.contexts,
                    }),
                ...(filters.noteType && { noteType: filters.noteType }),
                ...(filters.deadlineAfter && {
                    deadlineAfter: filters.deadlineAfter,
                }),
                ...(filters.deadlineBefore && {
                    deadlineBefore: filters.deadlineBefore,
                }),
                ...(filters.deadlineOn && { deadlineOn: filters.deadlineOn }),
                ...(filters.status && { status: filters.status }),
                limit,
            };

            return {
                notes: (data || []).map((note) => ({
                    id: note.id,
                    content: note.content,
                    persistenceStatus: "persisted" as const,
                    created_at:
                        note.created_at?.toISOString() ||
                        new Date().toISOString(),
                    deadline: note.deadline?.toISOString() || undefined,
                    key_context: note.key_context || undefined,
                    contexts: note.contexts || undefined,
                    tags: note.tags || undefined,
                    suggested_contexts: note.suggested_contexts || undefined,
                    note_type:
                        (note.note_type as Note["note_type"]) || undefined,
                    status: (note.status as TodoStatus) || undefined,
                })),
                totalCount: Number(totalCount),
                appliedFilters,
            };
        } catch (error) {
            console.error("Error in filterNotes:", error);
            throw error;
        } finally {
            await db.$client.end();
        }
    });
}

/**
 * Helper function to get available filter options for the user
 * Useful for suggesting filter values to the AI
 */
export async function getFilterOptions(): Promise<{
    availableContexts: string[];
    availableHashtags: string[];
    availableNoteTypes: string[];
    availableStatuses: TodoStatus[];
}> {
    return measureExecutionTime("getFilterOptions", async () => {
        const db = createDb();

        try {
            await db.$client.connect();

            // Get all unique contexts, tags, and note types
            const data = await db
                .select({
                    contexts: notes.contexts,
                    tags: notes.tags,
                    note_type: notes.note_type,
                    status: notes.status,
                })
                .from(notes);

            const contextSet = new Set<string>();
            const tagSet = new Set<string>();
            const noteTypeSet = new Set<string>();
            const statusSet = new Set<TodoStatus>();

            data?.forEach((note) => {
                // Collect contexts
                if (Array.isArray(note.contexts)) {
                    note.contexts.forEach((context: string) => {
                        if (context?.trim()) {
                            contextSet.add(context.trim());
                        }
                    });
                }

                // Collect tags/hashtags
                if (Array.isArray(note.tags)) {
                    note.tags.forEach((tag: string) => {
                        if (tag?.trim()) {
                            tagSet.add(tag.trim());
                        }
                    });
                }

                // Collect note types
                if (note.note_type?.trim()) {
                    noteTypeSet.add(note.note_type.trim());
                }

                // Collect statuses
                if (
                    note.status &&
                    Object.values(TodoStatus).includes(
                        note.status as TodoStatus
                    )
                ) {
                    statusSet.add(note.status as TodoStatus);
                }
            });

            console.log("Available filter options:", {
                contexts: Array.from(contextSet),
                hashtags: Array.from(tagSet),
                noteTypes: Array.from(noteTypeSet),
                statuses: Array.from(statusSet),
            });

            return {
                availableContexts: Array.from(contextSet).sort(),
                availableHashtags: Array.from(tagSet).sort(),
                availableNoteTypes: Array.from(noteTypeSet).sort(),
                availableStatuses: Array.from(statusSet).sort(),
            };
        } catch (error) {
            console.error("Error in getFilterOptions:", error);
            throw error;
        } finally {
            await db.$client.end();
        }
    });
}
