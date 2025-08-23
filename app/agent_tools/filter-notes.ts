"use server";

import { createClient } from "@/db/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import { notes } from "@/db/schema";
import { measureExecutionTime } from "@/lib/performance";
import type { NoteType } from "@/store/notesSlice";
import { TodoStatus } from "@/store/notesSlice";
import type { SearchResultNote } from "./types";
import {
    eq,
    desc,
    and,
    or,
    gte,
    lte,
    arrayContains,
    // sql,
    count,
    type SQL,
} from "drizzle-orm";

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
        hashtags?: string[];
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
 * Converts a database note record to SearchResultNote type
 * @param dbNote - Raw database note record
 * @returns SearchResultNote object with persistence status
 */
function convertDbNoteToSearchResult(
    dbNote: Record<string, unknown>
): SearchResultNote {
    return {
        id: dbNote.id as string,
        content: dbNote.content as string,
        key_context: dbNote.key_context as string | undefined,
        contexts: dbNote.contexts as string[] | undefined,
        tags: dbNote.tags as string[] | undefined,
        suggested_contexts: dbNote.suggested_contexts as string[] | undefined,
        note_type: dbNote.note_type as NoteType | undefined,
        deadline: dbNote.deadline
            ? (dbNote.deadline as Date).toISOString()
            : undefined,
        status: dbNote.status as TodoStatus | undefined,
        created_at: (dbNote.created_at as Date).toISOString(),
        persistenceStatus: "persisted" as const,
    };
}

/**
 * Builds database query conditions based on provided filters
 * @param filters - Filter parameters
 * @returns Array of SQL conditions to apply to the query
 */
function buildFilterConditions(filters: NotesFilter): SQL[] {
    const conditions: SQL[] = [];

    // Date filters
    if (filters.createdAfter) {
        conditions.push(gte(notes.created_at, new Date(filters.createdAfter)));
    }
    if (filters.createdBefore) {
        conditions.push(lte(notes.created_at, new Date(filters.createdBefore)));
    }

    // Context filters - notes must contain ALL specified contexts
    if (filters.contexts && filters.contexts.length > 0) {
        const contextConditions = filters.contexts.map((context) =>
            arrayContains(notes.contexts, [context])
        );
        conditions.push(and(...contextConditions)!);
    }

    // Hashtag/tag filters - notes must contain ANY of the specified tags
    if (filters.hashtags && filters.hashtags.length > 0) {
        const tagConditions = filters.hashtags.map((tag) =>
            arrayContains(notes.tags, [tag])
        );
        conditions.push(or(...tagConditions)!);
    }

    // Note type filter
    if (filters.noteType) {
        conditions.push(eq(notes.note_type, filters.noteType));
    }

    // Deadline filters
    if (filters.deadlineAfter) {
        conditions.push(gte(notes.deadline, new Date(filters.deadlineAfter)));
    }
    if (filters.deadlineBefore) {
        conditions.push(lte(notes.deadline, new Date(filters.deadlineBefore)));
    }
    if (filters.deadlineOn) {
        const startOfDay = new Date(`${filters.deadlineOn}T00:00:00.000Z`);
        const endOfDay = new Date(`${filters.deadlineOn}T23:59:59.999Z`);
        conditions.push(
            and(gte(notes.deadline, startOfDay), lte(notes.deadline, endOfDay))!
        );
    }

    // Status filter
    if (filters.status) {
        conditions.push(eq(notes.status, filters.status));
    }

    return conditions;
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

        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            // Set default and maximum limits
            const limit = Math.min(filters.limit || 20, 50);

            // Build filter conditions
            const conditions = buildFilterConditions(filters);
            const whereCondition =
                conditions.length > 0 ? and(...conditions) : undefined;

            // Execute queries in parallel for better performance
            const [notesResult, countResult] = await Promise.all([
                // Get filtered notes
                db
                    .select()
                    .from(notes)
                    .where(whereCondition)
                    .orderBy(desc(notes.created_at))
                    .limit(limit),

                // Get total count
                db.select({ count: count() }).from(notes).where(whereCondition),
            ]);

            const totalCount = countResult[0]?.count || 0;

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
                ...(filters.hashtags &&
                    filters.hashtags.length > 0 && {
                        hashtags: filters.hashtags,
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
                notes: notesResult.map(convertDbNoteToSearchResult),
                totalCount: Number(totalCount),
                appliedFilters,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error in filterNotes:", errorMessage);
            throw new Error(`Failed to filter notes: ${errorMessage}`);
        } finally {
            await client.end();
        }
    });
}

/**
 * Extracts unique values from nested arrays in database records
 * @param records - Array of database records
 * @param field - Field name to extract values from
 * @returns Set of unique string values
 */
function extractUniqueArrayValues(
    records: Record<string, unknown>[],
    field: string
): Set<string> {
    const valueSet = new Set<string>();

    records.forEach((record) => {
        const fieldValue = record[field];
        if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item: unknown) => {
                if (typeof item === "string" && item.trim()) {
                    valueSet.add(item.trim());
                }
            });
        }
    });

    return valueSet;
}

/**
 * Extracts unique scalar values from database records
 * @param records - Array of database records
 * @param field - Field name to extract values from
 * @returns Set of unique string values
 */
function extractUniqueScalarValues(
    records: Record<string, unknown>[],
    field: string
): Set<string> {
    const valueSet = new Set<string>();

    records.forEach((record) => {
        const fieldValue = record[field];
        if (typeof fieldValue === "string" && fieldValue.trim()) {
            valueSet.add(fieldValue.trim());
        }
    });

    return valueSet;
}

/**
 * Helper function to get available filter options for the user
 * Useful for suggesting filter values to the AI
 *
 * @returns Promise that resolves to available filter options
 * @throws Error if database query fails
 */
export async function getFilterOptions(): Promise<{
    availableContexts: string[];
    availableHashtags: string[];
    availableNoteTypes: string[];
    availableStatuses: TodoStatus[];
}> {
    return measureExecutionTime("getFilterOptions", async () => {
        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            // Get all unique contexts, tags, note types, and statuses
            const result = await db
                .select({
                    contexts: notes.contexts,
                    tags: notes.tags,
                    note_type: notes.note_type,
                    status: notes.status,
                })
                .from(notes);

            // Extract unique values using helper functions
            const contextSet = extractUniqueArrayValues(result, "contexts");
            const tagSet = extractUniqueArrayValues(result, "tags");
            const noteTypeSet = extractUniqueScalarValues(result, "note_type");

            // Handle status values with enum validation
            const statusSet = new Set<TodoStatus>();
            result.forEach((record) => {
                const status = record.status;
                if (
                    status &&
                    Object.values(TodoStatus).includes(status as TodoStatus)
                ) {
                    statusSet.add(status as TodoStatus);
                }
            });

            const filterOptions = {
                availableContexts: Array.from(contextSet).sort(),
                availableHashtags: Array.from(tagSet).sort(),
                availableNoteTypes: Array.from(noteTypeSet).sort(),
                availableStatuses: Array.from(statusSet).sort(),
            };

            console.log("Available filter options:", filterOptions);
            return filterOptions;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error in getFilterOptions:", errorMessage);
            throw new Error(`Failed to get filter options: ${errorMessage}`);
        } finally {
            await client.end();
        }
    });
}
