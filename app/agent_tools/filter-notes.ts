"use server";

import { createClient } from "@/lib/supabase/server";
import { measureExecutionTime } from "@/lib/performance";
import type { Note } from "@/store/notesSlice";
import { TodoStatus } from "@/store/notesSlice";
import type { SearchResultNote } from "./types";

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
        const supabase = await createClient();
        console.log("Filtering notes with filters:", filters);
        try {
            // Set default and maximum limits
            const limit = Math.min(filters.limit || 20, 50);

            // Start building the query
            let query = supabase
                .from("notes")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false });

            // Apply date filters
            if (filters.createdAfter) {
                query = query.gte("created_at", filters.createdAfter);
            }
            if (filters.createdBefore) {
                query = query.lte("created_at", filters.createdBefore);
            }

            // Apply context filters
            if (filters.contexts && filters.contexts.length > 0) {
                // Filter notes that contain ALL of the specified contexts
                // Using contains operator to check if the note's contexts array contains all specified contexts
                query = query.contains("contexts", filters.contexts);
            }

            // Apply hashtag/tag filters
            // if (filters.hashtags && filters.hashtags.length > 0) {
            //     // Filter notes that contain ANY of the specified hashtags/tags
            //     query = query.overlaps("tags", filters.hashtags);
            // }

            // Apply note type filter
            if (filters.noteType) {
                query = query.eq("note_type", filters.noteType);
            }

            // Apply deadline filters
            if (filters.deadlineAfter) {
                query = query.gte("deadline", filters.deadlineAfter);
            }
            if (filters.deadlineBefore) {
                query = query.lte("deadline", filters.deadlineBefore);
            }
            if (filters.deadlineOn) {
                // Filter for notes with deadline on a specific date
                const startOfDay = `${filters.deadlineOn}T00:00:00.000Z`;
                const endOfDay = `${filters.deadlineOn}T23:59:59.999Z`;
                query = query
                    .gte("deadline", startOfDay)
                    .lte("deadline", endOfDay);
            }

            // Apply status filter
            if (filters.status) {
                query = query.eq("status", filters.status);
            }

            // Apply limit
            query = query.limit(limit);

            const { data, error, count } = await query;

            if (error) {
                console.error("Error filtering notes:", error);
                throw error;
            }

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
                // ...(filters.hashtags &&
                //     filters.hashtags.length > 0 && {
                //         hashtags: filters.hashtags,
                //     }),
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
                notes: ((data as Note[]) || []).map((note) => ({
                    ...note,
                    persistenceStatus: "persisted" as const,
                })),
                totalCount: count || 0,
                appliedFilters,
            };
        } catch (error) {
            console.error("Error in filterNotes:", error);
            throw error;
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
        const supabase = await createClient();

        try {
            // Get all unique contexts, tags, and note types
            const { data, error } = await supabase
                .from("notes")
                .select("contexts, tags, note_type, status");

            if (error) {
                console.error("Error getting filter options:", error);
                throw error;
            }

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
        }
    });
}
