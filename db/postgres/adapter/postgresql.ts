/**
 * PostgreSQL Database Adapter Implementation
 *
 * This adapter implements the DatabaseAdapter interface using PostgreSQL
 * with Drizzle ORM. It encapsulates all database operations and provides
 * a clean interface for the application layer.
 */

import { createClient, createDb } from "@/db/postgres/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import {
    notes,
    contexts,
    notesContexts,
    schema,
    type Note as DbNote,
    type Database,
} from "@/db/postgres/schema";
import { v4 as uuidv4 } from "uuid";
import { measureExecutionTime } from "@/lib/performance";
import { slugToSentenceCase } from "@/lib/utils";
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
} from "../../types";

import { TodoStatus } from "../../types";

/**
 * PostgreSQL implementation of the DatabaseAdapter interface
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
    /**
     * Fetches contexts for a note by note ID
     */
    private async fetchContextsForNote(
        db: Database,
        noteId: string
    ): Promise<string[]> {
        const noteContexts = await db
            .select({
                contextName: contexts.name,
            })
            .from(notesContexts)
            .innerJoin(contexts, eq(notesContexts.context_id, contexts.id))
            .where(eq(notesContexts.note_id, noteId));

        return noteContexts.map((nc: any) => nc.contextName);
    }

    /**
     * Converts a database note record to the application Note type
     */
    private async convertDbNoteToNote(
        dbNote: DbNote,
        db?: Database
    ): Promise<Note> {
        let contextsList: string[] = [];

        if (db) {
            contextsList = await this.fetchContextsForNote(db, dbNote.id);
        }

        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: contextsList,
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
    private async convertDbNoteToSearchResult(
        dbNote: DbNote,
        db?: Database
    ): Promise<SearchResultNote> {
        let contextsList: string[] = [];

        if (db) {
            contextsList = await this.fetchContextsForNote(db, dbNote.id);
        }

        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: contextsList,
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
     * Upserts contexts and returns their IDs
     */
    private async upsertContexts(
        db: Database,
        contextNames: string[]
    ): Promise<string[]> {
        if (!contextNames || contextNames.length === 0) {
            return [];
        }

        const contextIds: string[] = [];

        for (const contextName of contextNames) {
            // Try to find existing context
            let existingContext = await db
                .select()
                .from(contexts)
                .where(eq(contexts.name, contextName))
                .limit(1);

            if (existingContext.length > 0) {
                contextIds.push(existingContext[0].id);
            } else {
                // Create new context
                const newContextId = uuidv4();
                await db.insert(contexts).values({
                    id: newContextId,
                    name: contextName,
                });
                contextIds.push(newContextId);
            }
        }

        return contextIds;
    }

    /**
     * Links a note to contexts via the junction table
     */
    private async linkNoteToContexts(
        db: Database,
        noteId: string,
        contextIds: string[]
    ): Promise<void> {
        if (!contextIds || contextIds.length === 0) {
            return;
        }

        // First delete existing links for this note
        await db.delete(notesContexts).where(eq(notesContexts.note_id, noteId));

        // Insert new links
        const linksToInsert = contextIds.map((contextId) => ({
            note_id: noteId,
            context_id: contextId,
        }));

        if (linksToInsert.length > 0) {
            await db.insert(notesContexts).values(linksToInsert);
        }
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
            // Use EXISTS subquery to check for contexts in the junction table
            const contextExistsConditions = filters.contexts.map(
                (context) =>
                    sql`EXISTS (
                    SELECT 1 FROM ${notesContexts} nc 
                    JOIN ${contexts} c ON nc.context_id = c.id 
                    WHERE nc.note_id = ${notes.id} AND c.name = ${context}
                )`
            );
            conditions.push(and(...contextExistsConditions)!);
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
                const db = drizzle(client, { schema });

                const noteToInsert = {
                    id: params.id,
                    content: params.content,
                    key_context: params.key_context,
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

                // Handle contexts
                if (params.contexts && params.contexts.length > 0) {
                    const contextIds = await this.upsertContexts(
                        db,
                        params.contexts
                    );
                    await this.linkNoteToContexts(db, params.id, contextIds);
                }

                return await this.convertDbNoteToNote(result[0], db);
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
                const db = drizzle(client, { schema });

                const updateData: Record<string, unknown> = {};

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && key !== "contexts") {
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

                // Check if there's anything to update besides contexts
                const hasDataToUpdate = Object.keys(updateData).length > 0;
                const hasContextsToUpdate = params.contexts !== undefined;

                if (!hasDataToUpdate && !hasContextsToUpdate) {
                    throw new Error("No values to update");
                }

                let result: any[] = [];

                // Only perform database update if there are fields to update
                if (hasDataToUpdate) {
                    result = await db
                        .update(notes)
                        .set(updateData)
                        .where(eq(notes.id, noteId))
                        .returning();

                    if (!result || result.length === 0) {
                        throw new Error("No data returned after update");
                    }
                } else {
                    // If only contexts are being updated, fetch the current note
                    result = await db
                        .select()
                        .from(notes)
                        .where(eq(notes.id, noteId));

                    if (!result || result.length === 0) {
                        throw new Error("Note not found");
                    }
                }

                // Handle contexts if provided
                if (hasContextsToUpdate) {
                    const contextIds = await this.upsertContexts(
                        db,
                        params.contexts!
                    );
                    await this.linkNoteToContexts(db, noteId, contextIds);
                }

                return await this.convertDbNoteToNote(result[0], db);
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
                const db = drizzle(client, { schema });

                // First delete the note-context relationships
                await db
                    .delete(notesContexts)
                    .where(eq(notesContexts.note_id, noteId));

                // Then delete the note itself
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
                const db = drizzle(client, { schema });

                let result: DbNote[];

                if (params.contexts && params.contexts.length > 0) {
                    if (params.method === "AND") {
                        // For AND logic, the note must have ALL specified contexts
                        const conditions = params.contexts.map(
                            (context) =>
                                sql`EXISTS (
                                SELECT 1 FROM ${notesContexts} nc 
                                JOIN ${contexts} c ON nc.context_id = c.id 
                                WHERE nc.note_id = ${notes.id} AND c.name = ${context}
                            )`
                        );
                        result = await db
                            .select()
                            .from(notes)
                            .where(and(...conditions))
                            .orderBy(desc(notes.created_at));
                    } else {
                        // For OR logic, the note must have ANY of the specified contexts
                        // Use individual OR conditions for each context
                        const contextConditions = params.contexts.map(
                            (contextName) =>
                                sql`EXISTS (
                                SELECT 1 FROM ${notesContexts} nc 
                                JOIN ${contexts} c ON nc.context_id = c.id 
                                WHERE nc.note_id = ${notes.id} AND c.name = ${contextName}
                            )`
                        );
                        result = await db
                            .select()
                            .from(notes)
                            .where(or(...contextConditions))
                            .orderBy(desc(notes.created_at));
                    }
                } else if (params.keyContext) {
                    const contextCondition = sql`EXISTS (
                        SELECT 1 FROM ${notesContexts} nc 
                        JOIN ${contexts} c ON nc.context_id = c.id 
                        WHERE nc.note_id = ${notes.id} AND c.name = ${params.keyContext}
                    )`;
                    result = await db
                        .select()
                        .from(notes)
                        .where(contextCondition)
                        .orderBy(desc(notes.created_at));
                } else {
                    result = [];
                }

                // Convert notes and fetch their contexts
                const notesWithContexts = await Promise.all(
                    result.map((note) => this.convertDbNoteToNote(note, db))
                );

                return notesWithContexts;
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
                const db = drizzle(client, { schema });

                const result = await db
                    .select()
                    .from(notes)
                    .where(inArray(notes.id, noteIds));

                // Convert notes and fetch their contexts
                const notesWithContexts = await Promise.all(
                    result.map((note) => this.convertDbNoteToNote(note, db))
                );

                return notesWithContexts;
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

            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema });

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

                // Convert notes and fetch their contexts
                const notesWithContexts = await Promise.all(
                    notesResult.map((note) =>
                        this.convertDbNoteToSearchResult(note, db)
                    )
                );

                return {
                    notes: notesWithContexts,
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
                const db = drizzle(client, { schema });

                // Get unique contexts from the contexts table
                const contextResults = await db
                    .select({ name: contexts.name })
                    .from(contexts)
                    .orderBy(contexts.name);

                // Get other filter options from notes table
                const noteResults = await db
                    .select({
                        tags: notes.tags,
                        note_type: notes.note_type,
                        status: notes.status,
                    })
                    .from(notes);

                const contextSet = new Set(contextResults.map((c) => c.name));
                const tagSet = this.extractUniqueArrayValues(
                    noteResults,
                    "tags"
                );
                const noteTypeSet = this.extractUniqueScalarValues(
                    noteResults,
                    "note_type"
                );

                const statusSet = new Set<TodoStatus>();
                noteResults.forEach((record) => {
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
     * Fetches paginated statistics for distinct contexts
     */
    async fetchContextStatsPaginated(
        params: FetchContextStatsParams = {}
    ): Promise<PaginatedContextStats> {
        return measureExecutionTime("fetchContextStatsPaginated", async () => {
            const { limit = 30, offset = 0 } = params;
            const client = createClient();

            try {
                await client.connect();

                const result = await client.query(
                    "SELECT * FROM get_user_context_stats_paginated($1, $2)",
                    [limit, offset]
                );

                const contexts = result.rows.map((row) => ({
                    context: row.context,
                    count: parseInt(row.count, 10),
                    lastUsed: row.lastused
                        ? new Date(row.lastused).toISOString()
                        : undefined,
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

    /**
     * Renames a context and updates all note references
     */
    async renameContext(oldName: string, newName: string): Promise<void> {
        return measureExecutionTime("renameContext", async () => {
            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema });

                // Start transaction
                await client.query("BEGIN");

                try {
                    // Check if new context already exists
                    const existingContext = await db
                        .select()
                        .from(contexts)
                        .where(eq(contexts.name, newName))
                        .limit(1);

                    const oldContextParams = await db
                        .select()
                        .from(contexts)
                        .where(eq(contexts.name, oldName))
                        .limit(1);

                    if (!oldContextParams || oldContextParams.length === 0) {
                        throw new Error(`Context "${oldName}" not found`);
                    }
                    const oldContextId = oldContextParams[0].id;

                    if (existingContext.length > 0) {
                        // MERGE LOGIC
                        const newContextId = existingContext[0].id;

                        // 1. Fetch links for old context
                        const oldLinks = await db
                            .select()
                            .from(notesContexts)
                            .where(eq(notesContexts.context_id, oldContextId));

                        if (oldLinks.length > 0) {
                            const noteIds = oldLinks.map((n) => n.note_id);

                            // Fetch all existing links for the new context upfront to avoid N+1 queries
                            const existingNewContextLinks = await db
                                .select()
                                .from(notesContexts)
                                .where(eq(notesContexts.context_id, newContextId));

                            // Create a Set of note IDs already linked to the new context for O(1) lookups
                            const existingNoteIds = new Set(
                                existingNewContextLinks.map((link) => link.note_id)
                            );

                            // Batch operations: separate links into those to delete vs update
                            const noteIdsToDelete: string[] = [];
                            const noteIdsToUpdate: string[] = [];

                            for (const link of oldLinks) {
                                if (existingNoteIds.has(link.note_id)) {
                                    noteIdsToDelete.push(link.note_id);
                                } else {
                                    noteIdsToUpdate.push(link.note_id);
                                }
                            }

                            // Perform bulk DELETE for duplicate links
                            if (noteIdsToDelete.length > 0) {
                                await db
                                    .delete(notesContexts)
                                    .where(
                                        and(
                                            inArray(notesContexts.note_id, noteIdsToDelete),
                                            eq(notesContexts.context_id, oldContextId)
                                        )
                                    );
                            }

                            // Perform bulk UPDATE for non-duplicate links
                            if (noteIdsToUpdate.length > 0) {
                                await db
                                    .update(notesContexts)
                                    .set({ context_id: newContextId })
                                    .where(
                                        and(
                                            inArray(notesContexts.note_id, noteIdsToUpdate),
                                            eq(notesContexts.context_id, oldContextId)
                                        )
                                    );
                            }

                            // 2. Update note content in batch
                            const notesToUpdate = await db
                                .select()
                                .from(notes)
                                .where(inArray(notes.id, noteIds));

                            const oldNameSentenceCase = slugToSentenceCase(oldName);
                            const newNameSentenceCase = slugToSentenceCase(newName);
                            const regex = new RegExp(
                                `\\[\\[${oldNameSentenceCase.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&"
                                )}\\]\\]`,
                                "gi"
                            );

                            // Batch note updates
                            for (const note of notesToUpdate) {
                                const updatedContent = note.content.replace(
                                    regex,
                                    `[[${newNameSentenceCase}]]`
                                );

                                const updatedKeyContext =
                                    note.key_context === oldName
                                        ? newName
                                        : note.key_context;

                                if (
                                    updatedContent !== note.content ||
                                    updatedKeyContext !== note.key_context
                                ) {
                                    await db
                                        .update(notes)
                                        .set({
                                            content: updatedContent,
                                            key_context: updatedKeyContext,
                                        })
                                        .where(eq(notes.id, note.id));
                                }
                            }
                        }

                        // 3. Delete old context
                        await db.delete(contexts).where(eq(contexts.id, oldContextId));

                    } else {
                        // RENAME LOGIC (Existing)
                        // 1. Update the context name in the contexts table
                        await db
                            .update(contexts)
                            .set({ name: newName })
                            .where(eq(contexts.id, oldContextId));

                        // 2. Fetch all notes linked to this context
                        const linkedNotes = await db
                            .select({ noteId: notesContexts.note_id })
                            .from(notesContexts)
                            .where(eq(notesContexts.context_id, oldContextId));

                        if (linkedNotes.length > 0) {
                            const noteIds = linkedNotes.map((n) => n.noteId);

                            // 3. Fetch the actual notes to update their content
                            const notesToUpdate = await db
                                .select()
                                .from(notes)
                                .where(inArray(notes.id, noteIds));

                            // 4. Update each note's content and key_context
                            for (const note of notesToUpdate) {
                                const oldNameSentenceCase = slugToSentenceCase(oldName);
                                const newNameSentenceCase = slugToSentenceCase(newName);

                                const regex = new RegExp(
                                    `\\[\\[${oldNameSentenceCase.replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        "\\$&"
                                    )}\\]\\]`,
                                    "gi"
                                );
                                const updatedContent = note.content.replace(
                                    regex,
                                    `[[${newNameSentenceCase}]]`
                                );

                                const updatedKeyContext =
                                    note.key_context === oldName
                                        ? newName
                                        : note.key_context;

                                if (
                                    updatedContent !== note.content ||
                                    updatedKeyContext !== note.key_context
                                ) {
                                    await db
                                        .update(notes)
                                        .set({
                                            content: updatedContent,
                                            key_context: updatedKeyContext,
                                        })
                                        .where(eq(notes.id, note.id));
                                }
                            }
                        }
                    }

                    // Commit transaction
                    await client.query("COMMIT");
                } catch (error) {
                    // Rollback on error
                    await client.query("ROLLBACK");
                    throw error;
                }
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error renaming context:", errorMessage);
                throw new Error(`Failed to rename context: ${errorMessage}`);
            } finally {
                await client.end();
            }
        });
    }

    /**
     * Checks if a context exists
     */
    async contextExists(name: string): Promise<boolean> {
        return measureExecutionTime("contextExists", async () => {
             const client = createClient();
             try {
                 await client.connect();
                 const db = drizzle(client, { schema });
                 
                 const result = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(contexts)
                    .where(eq(contexts.name, name));
                    
                 return Number(result[0].count) > 0;
             } catch(error) {
                 console.error("Error checking context existence:", error);
                 return false;
             } finally {
                 await client.end();
             }
        });
    }
}

