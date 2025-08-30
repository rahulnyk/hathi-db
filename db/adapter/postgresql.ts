/**
 * PostgreSQL Database Adapter Implementation
 *
 * This adapter implements the DatabaseAdapter interface using PostgreSQL
 * with Drizzle ORM. It encapsulates all database operations and provides
 * a clean interface for the application layer.
 */

import { createClient, createDb } from "@/db/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import { notes, type Note as DbNote } from "@/db/schema";
import { measureExecutionTime } from "@/lib/performance";
import {
    eq,
    desc,
    and,
    or,
    gte,
    lte,
    arrayContains,
    count,
    inArray,
    sql,
    type SQL,
} from "drizzle-orm";

import type {
    DatabaseAdapter,
    Note,
    CreateNoteParams,
    UpdateNoteParams,
    FetchNotesParams,
    NotesFilter,
    FilterNotesResult,
    SemanticSearchParams,
    SemanticSearchResult,
    RawSemanticSearchResult,
    SearchResultNote,
    ContextStats,
    PaginatedContextStats,
    FetchContextStatsParams,
    FilterOptions,
    NoteType,
} from "./types";

import { TodoStatus } from "./types";

/**
 * PostgreSQL implementation of the DatabaseAdapter interface
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
    /**
     * Converts a database note record to the application Note type
     */
    private convertDbNoteToNote(dbNote: DbNote): Note {
        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: dbNote.contexts ?? [],
            tags: dbNote.tags ?? [],
            suggested_contexts: dbNote.suggested_contexts ?? undefined,
            note_type: dbNote.note_type as NoteType,
            embedding: dbNote.embedding ?? undefined,
            embedding_model: dbNote.embedding_model ?? undefined,
            embedding_created_at: dbNote.embedding_created_at?.toISOString(),
            deadline: dbNote.deadline?.toISOString() ?? null,
            status: dbNote.status as TodoStatus | null,
            created_at: dbNote.created_at.toISOString(),
            updated_at: dbNote.updated_at.toISOString(),
            persistenceStatus: "persisted" as const,
        };
    }

    /**
     * Converts a database note record to SearchResultNote type
     */
    private convertDbNoteToSearchResult(dbNote: DbNote): SearchResultNote {
        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: dbNote.contexts ?? undefined,
            tags: dbNote.tags ?? undefined,
            suggested_contexts: dbNote.suggested_contexts ?? undefined,
            note_type: dbNote.note_type as NoteType | undefined,
            deadline: dbNote.deadline?.toISOString(),
            status: dbNote.status as TodoStatus | undefined,
            created_at: dbNote.created_at.toISOString(),
            updated_at: dbNote.updated_at.toISOString(),
            persistenceStatus: "persisted" as const,
        };
    }

    /**
     * Builds database query conditions based on provided filters
     */
    private buildFilterConditions(filters: NotesFilter): SQL[] {
        const conditions: SQL[] = [];

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

        if (filters.contexts && filters.contexts.length > 0) {
            const contextConditions = filters.contexts.map((context) =>
                arrayContains(notes.contexts, [context])
            );
            conditions.push(and(...contextConditions)!);
        }

        if (filters.hashtags && filters.hashtags.length > 0) {
            const tagConditions = filters.hashtags.map((tag) =>
                arrayContains(notes.tags, [tag])
            );
            conditions.push(or(...tagConditions)!);
        }

        if (filters.noteType) {
            conditions.push(eq(notes.note_type, filters.noteType));
        }

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
            const startOfDay = new Date(`${filters.deadlineOn}T00:00:00.000Z`);
            const endOfDay = new Date(`${filters.deadlineOn}T23:59:59.999Z`);
            conditions.push(
                and(
                    gte(notes.deadline, startOfDay),
                    lte(notes.deadline, endOfDay)
                )!
            );
        }

        if (filters.status) {
            conditions.push(eq(notes.status, filters.status));
        }

        return conditions;
    }

    /**
     * Transforms raw semantic search results to SearchResultNote format
     */
    private transformSemanticSearchResults(
        rawResults: RawSemanticSearchResult[]
    ): SearchResultNote[] {
        return rawResults.map(
            (note): SearchResultNote => ({
                id: note.id,
                content: note.content,
                key_context: note.key_context ?? undefined,
                contexts: note.contexts ?? [],
                tags: note.tags ?? [],
                note_type: (note.note_type as NoteType) ?? undefined,
                suggested_contexts: note.suggested_contexts ?? [],
                created_at: note.created_at.toISOString(),
                updated_at: note.updated_at.toISOString(),
                similarity: note.similarity,
                persistenceStatus: "persisted" as const,
                deadline: undefined,
                status: undefined,
            })
        );
    }

    /**
     * Extracts unique values from nested arrays in database records
     */
    private extractUniqueArrayValues<T extends Record<string, any>>(
        records: T[],
        field: keyof T
    ): Set<string> {
        const valueSet = new Set<string>();

        records.forEach((record) => {
            const fieldValue = record[field];
            if (Array.isArray(fieldValue)) {
                fieldValue.forEach((item: string | null) => {
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
     */
    private extractUniqueScalarValues<T extends Record<string, any>>(
        records: T[],
        field: keyof T
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
     * Creates a new note in the database
     */
    async createNote(params: CreateNoteParams): Promise<Note> {
        return measureExecutionTime("createNote", async () => {
            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                const noteToInsert = {
                    id: params.id,
                    content: params.content,
                    key_context: params.key_context,
                    contexts: params.contexts || [],
                    tags: params.tags || [],
                    note_type: params.note_type,
                    deadline: params.deadline
                        ? new Date(params.deadline)
                        : null,
                    status: params.status || null,
                };

                const result = await db
                    .insert(notes)
                    .values(noteToInsert)
                    .returning();

                if (!result || result.length === 0) {
                    throw new Error("No data returned after insert");
                }

                return this.convertDbNoteToNote(result[0]);
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error creating note:", errorMessage);
                throw new Error(`Failed to create note: ${errorMessage}`);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Updates an existing note in the database
     */
    async updateNote(noteId: string, params: UpdateNoteParams): Promise<Note> {
        return measureExecutionTime("updateNote", async () => {
            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                const updateData: Record<string, unknown> = {};

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined) {
                        if (key === "deadline" && typeof value === "string") {
                            updateData[key] = new Date(value);
                        } else if (
                            key === "embedding_created_at" &&
                            typeof value === "string"
                        ) {
                            updateData[key] = new Date(value);
                        } else {
                            updateData[key] = value;
                        }
                    }
                });

                const result = await db
                    .update(notes)
                    .set(updateData)
                    .where(eq(notes.id, noteId))
                    .returning();

                if (!result || result.length === 0) {
                    throw new Error("No data returned after update");
                }

                return this.convertDbNoteToNote(result[0]);
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error updating note:", errorMessage);
                throw new Error(`Failed to update note: ${errorMessage}`);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Deletes a note from the database
     */
    async deleteNote(noteId: string): Promise<{ noteId: string }> {
        return measureExecutionTime("deleteNote", async () => {
            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                await db.delete(notes).where(eq(notes.id, noteId));

                return { noteId };
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error deleting note:", errorMessage);
                throw new Error(`Failed to delete note: ${errorMessage}`);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Fetches notes with optional context filtering
     */
    async fetchNotes(params: FetchNotesParams): Promise<Note[]> {
        return measureExecutionTime("fetchNotes", async () => {
            if (
                !params.keyContext &&
                (!params.contexts || params.contexts.length === 0)
            ) {
                throw new Error(
                    "At least one filtering parameter (keyContext or contexts) must be provided"
                );
            }

            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                if (params.contexts && params.contexts.length > 0) {
                    if (params.method === "AND") {
                        const andConditions = params.contexts.map((context) =>
                            arrayContains(notes.contexts, [context])
                        );
                        const result = await db
                            .select()
                            .from(notes)
                            .where(and(...andConditions))
                            .orderBy(desc(notes.created_at));

                        return result.map((note) =>
                            this.convertDbNoteToNote(note)
                        );
                    } else {
                        const result = await db
                            .select()
                            .from(notes)
                            .where(
                                arrayContains(notes.contexts, params.contexts)
                            )
                            .orderBy(desc(notes.created_at));

                        return result.map((note) =>
                            this.convertDbNoteToNote(note)
                        );
                    }
                } else if (params.keyContext) {
                    const result = await db
                        .select()
                        .from(notes)
                        .where(
                            arrayContains(notes.contexts, [params.keyContext])
                        )
                        .orderBy(desc(notes.created_at));

                    return result.map((note) => this.convertDbNoteToNote(note));
                }

                return [];
            } catch (error) {
                console.error("Error fetching notes:", error);
                throw error;
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Fetches notes by their IDs
     */
    async fetchNotesByIds(noteIds: string[]): Promise<Note[]> {
        return measureExecutionTime("fetchNotesByIds", async () => {
            if (!noteIds || noteIds.length === 0) {
                return [];
            }

            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                const result = await db
                    .select()
                    .from(notes)
                    .where(inArray(notes.id, noteIds));

                return result.map((note) => this.convertDbNoteToNote(note));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not fetch notes by IDs.";
                console.error("Error in fetchNotesByIds:", errorMessage);
                throw new Error(errorMessage);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Filters notes based on given parameters
     */
    async filterNotes(filters: NotesFilter = {}): Promise<FilterNotesResult> {
        return measureExecutionTime("filterNotes", async () => {
            console.log("Filtering notes with filters:", filters);

            const db = createDb();

            try {
                await db.$client.connect();

                const limit = Math.min(filters.limit || 20, 50);
                const conditions = this.buildFilterConditions(filters);
                const whereCondition =
                    conditions.length > 0 ? and(...conditions) : undefined;

                const [notesResult, countResult] = await Promise.all([
                    db
                        .select()
                        .from(notes)
                        .where(whereCondition)
                        .orderBy(desc(notes.created_at))
                        .limit(limit),

                    db
                        .select({ count: count() })
                        .from(notes)
                        .where(whereCondition),
                ]);

                const totalCount = countResult[0]?.count || 0;

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
                    ...(filters.deadlineOn && {
                        deadlineOn: filters.deadlineOn,
                    }),
                    ...(filters.status && { status: filters.status }),
                    limit,
                };

                return {
                    notes: notesResult.map((note) =>
                        this.convertDbNoteToSearchResult(note)
                    ),
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
                await db.$client.end();
            }
        });
    }

    /**
     * Searches notes using semantic similarity
     */
    async searchNotesBySimilarity(
        params: SemanticSearchParams
    ): Promise<SemanticSearchResult> {
        return measureExecutionTime("searchNotesBySimilarity", async () => {
            const { query, similarityThreshold = 0.7, limit = 10 } = params;

            if (
                !query ||
                typeof query !== "string" ||
                query.trim().length === 0
            ) {
                throw new Error(
                    "Query parameter is required and must be a non-empty string"
                );
            }

            if (similarityThreshold < 0 || similarityThreshold > 1) {
                throw new Error(
                    "Similarity threshold must be between 0.0 and 1.0"
                );
            }

            if (limit <= 0 || limit > 1000) {
                throw new Error("Limit must be between 1 and 1000");
            }

            // This method expects the embedding to be generated outside the adapter
            // The calling function should handle embedding generation
            throw new Error(
                "Semantic search requires embedding generation which should be handled by the calling function"
            );
        });
    }

    /**
     * Executes semantic search with provided embedding
     */
    async executeSemanticSearch(
        embedding: number[],
        similarityThreshold: number,
        limit: number
    ): Promise<SemanticSearchResult> {
        return measureExecutionTime("executeSemanticSearch", async () => {
            const db = createDb();

            try {
                await db.$client.connect();

                const result = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(embedding)}::vector,
                            ${similarityThreshold}::float,
                            ${limit}::integer
                        )
                    `
                );

                const rawResults: RawSemanticSearchResult[] = result.rows.map(
                    (row): RawSemanticSearchResult => {
                        const record = row as Record<string, unknown>;
                        return {
                            id: String(record.id),
                            content: String(record.content),
                            key_context: record.key_context
                                ? String(record.key_context)
                                : null,
                            contexts: Array.isArray(record.contexts)
                                ? (record.contexts as string[])
                                : null,
                            tags: Array.isArray(record.tags)
                                ? (record.tags as string[])
                                : null,
                            note_type: record.note_type
                                ? String(record.note_type)
                                : null,
                            suggested_contexts: Array.isArray(
                                record.suggested_contexts
                            )
                                ? (record.suggested_contexts as string[])
                                : null,
                            created_at: new Date(String(record.created_at)),
                            updated_at: new Date(String(record.updated_at)),
                            similarity: Number(record.similarity),
                        };
                    }
                );

                const formattedNotes =
                    this.transformSemanticSearchResults(rawResults);

                return {
                    notes: formattedNotes,
                    totalCount: formattedNotes.length,
                    message: "", // Message will be set by the calling function
                    appliedFilters: {
                        query: "",
                        similarityThreshold,
                        limit,
                    },
                };
            } catch (error) {
                console.error("Error executing semantic search query:", error);
                throw new Error(
                    error instanceof Error
                        ? `Database query failed: ${error.message}`
                        : "Failed to execute semantic search query"
                );
            } finally {
                try {
                    await db.$client.end();
                } catch (cleanupError) {
                    console.warn(
                        "Warning: Failed to close database connection:",
                        cleanupError
                    );
                }
            }
        });
    }

    /**
     * Gets available filter options for notes
     */
    async getFilterOptions(): Promise<FilterOptions> {
        return measureExecutionTime("getFilterOptions", async () => {
            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                const result = await db
                    .select({
                        contexts: notes.contexts,
                        tags: notes.tags,
                        note_type: notes.note_type,
                        status: notes.status,
                    })
                    .from(notes);

                const contextSet = this.extractUniqueArrayValues(
                    result,
                    "contexts"
                );
                const tagSet = this.extractUniqueArrayValues(result, "tags");
                const noteTypeSet = this.extractUniqueScalarValues(
                    result,
                    "note_type"
                );

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

                return {
                    availableContexts: Array.from(contextSet).sort(),
                    availableHashtags: Array.from(tagSet).sort(),
                    availableNoteTypes: Array.from(noteTypeSet).sort(),
                    availableStatuses: Array.from(statusSet).sort(),
                };
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error in getFilterOptions:", errorMessage);
                throw new Error(
                    `Failed to get filter options: ${errorMessage}`
                );
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Fetches statistics for all distinct contexts
     */
    async fetchContextStats(): Promise<ContextStats[]> {
        return measureExecutionTime("fetchContextStats", async () => {
            const client = createClient();

            try {
                await client.connect();

                const result = await client.query(
                    "SELECT * FROM get_user_context_stats()"
                );

                return result.rows.map((row) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: row.lastused,
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not fetch context statistics.";
                console.error("Error in fetchContextStats:", errorMessage);
                throw new Error(errorMessage);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Fetches paginated statistics for distinct contexts
     */
    async fetchContextStatsPaginated(
        params: FetchContextStatsParams = {}
    ): Promise<PaginatedContextStats> {
        return measureExecutionTime("fetchContextStatsPaginated", async () => {
            const { limit = 30, offset = 0, searchTerm } = params;
            const client = createClient();

            try {
                await client.connect();

                const result = await client.query(
                    "SELECT * FROM get_user_context_stats_paginated($1, $2, $3)",
                    [limit, offset, searchTerm || null]
                );

                const contexts = result.rows.map((row) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: row.lastused,
                }));

                const totalCount =
                    result.rows.length > 0 ? result.rows[0].total_count : 0;
                const hasMore = offset + contexts.length < totalCount;

                return {
                    contexts,
                    totalCount,
                    hasMore,
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not fetch paginated context statistics.";
                console.error(
                    "Error in fetchContextStatsPaginated:",
                    errorMessage
                );
                throw new Error(errorMessage);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Searches contexts for autocomplete functionality
     */
    async searchContexts(
        searchTerm: string,
        limit: number = 20
    ): Promise<ContextStats[]> {
        return measureExecutionTime("searchContexts", async () => {
            if (!searchTerm.trim()) {
                return [];
            }

            const client = createClient();

            try {
                await client.connect();

                const result = await client.query(
                    "SELECT * FROM search_user_contexts($1, $2)",
                    [searchTerm.trim(), limit]
                );

                return result.rows.map((row) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: row.lastused,
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not search contexts.";
                console.error("Error in searchContexts:", errorMessage);
                throw new Error(errorMessage);
            } finally {
                await client.end();
            }
        });
    }
}
