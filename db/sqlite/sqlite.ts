/**
 * SQLite Database Adapter Implementation
 *
 * This adapter implements the DatabaseAdapter interface using SQLite
 * with better-sqlite3 and sqlite-vec for vector operations.
 * It provides the same interface as the PostgreSQL adapter.
 */

import {
    createSqliteDb,
    getRawSqliteConnection,
    executeSql,
} from "./connection";
import {
    notes,
    contexts,
    notesContexts,
    schema,
    type Note as DbNote,
    type Database,
} from "./schema";
import { v4 as uuidv4 } from "uuid";
import { measureExecutionTime } from "../../lib/performance";
import {
    eq,
    desc,
    and,
    or,
    gte,
    lte,
    count,
    inArray,
    sql,
    like,
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
} from "../types";

import { TodoStatus } from "../types";

/**
 * SQLite implementation of the DatabaseAdapter interface
 */
export class SqliteAdapter implements DatabaseAdapter {
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

        // Parse JSON fields that were serialized
        const tags = dbNote.tags ? JSON.parse(dbNote.tags) : [];
        const suggestedContexts = dbNote.suggested_contexts
            ? JSON.parse(dbNote.suggested_contexts)
            : undefined;

        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: contextsList,
            tags: tags,
            suggested_contexts: suggestedContexts,
            note_type: dbNote.note_type as NoteType,
            embedding: undefined, // Embeddings are stored separately in vec0 table
            embedding_model: dbNote.embedding_model ?? undefined,
            embedding_created_at: dbNote.embedding_created_at
                ? new Date(dbNote.embedding_created_at).toISOString()
                : undefined,
            deadline: dbNote.deadline
                ? new Date(dbNote.deadline).toISOString()
                : null,
            status: dbNote.status as TodoStatus | null,
            created_at: new Date(dbNote.created_at).toISOString(),
            updated_at: new Date(dbNote.updated_at).toISOString(),
            persistenceStatus: "persisted" as const,
        };
    }

    /**
     * Converts a database note record to SearchResultNote type
     */
    private async convertDbNoteToSearchResult(
        dbNote: DbNote,
        db?: Database,
        similarity?: number
    ): Promise<SearchResultNote> {
        let contextsList: string[] = [];

        if (db) {
            contextsList = await this.fetchContextsForNote(db, dbNote.id);
        }

        // Parse JSON fields that were serialized
        const tags = dbNote.tags ? JSON.parse(dbNote.tags) : undefined;
        const suggestedContexts = dbNote.suggested_contexts
            ? JSON.parse(dbNote.suggested_contexts)
            : undefined;

        return {
            ...dbNote,
            key_context: dbNote.key_context ?? undefined,
            contexts: contextsList,
            tags: tags,
            suggested_contexts: suggestedContexts,
            note_type: dbNote.note_type as NoteType | undefined,
            deadline: dbNote.deadline
                ? new Date(dbNote.deadline).toISOString()
                : undefined,
            status: dbNote.status as TodoStatus | undefined,
            created_at: new Date(dbNote.created_at).toISOString(),
            updated_at: new Date(dbNote.updated_at).toISOString(),
            persistenceStatus: "persisted" as const,
            similarity: similarity,
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

        // First, delete existing relationships for this note
        await db.delete(notesContexts).where(eq(notesContexts.note_id, noteId));

        // Then insert new relationships
        const relationships = contextIds.map((contextId) => ({
            note_id: noteId,
            context_id: contextId,
        }));

        if (relationships.length > 0) {
            await db.insert(notesContexts).values(relationships);
        }
    }

    /**
     * Builds database query conditions based on provided filters
     */
    private buildFilterConditions(filters: NotesFilter): SQL[] {
        const conditions: SQL[] = [];

        if (filters.createdAfter) {
            conditions.push(
                gte(notes.created_at, new Date(filters.createdAfter).getTime())
            );
        }
        if (filters.createdBefore) {
            conditions.push(
                lte(notes.created_at, new Date(filters.createdBefore).getTime())
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
            // For SQLite, we need to check JSON content for tags
            const tagConditions = filters.hashtags.map(
                (tag) =>
                    sql`json_extract(${notes.tags}, '$') LIKE ${
                        '%"' + tag + '"%'
                    }`
            );
            conditions.push(or(...tagConditions)!);
        }

        if (filters.noteType) {
            conditions.push(eq(notes.note_type, filters.noteType));
        }

        if (filters.deadlineAfter) {
            conditions.push(
                gte(notes.deadline, new Date(filters.deadlineAfter).getTime())
            );
        }
        if (filters.deadlineBefore) {
            conditions.push(
                lte(notes.deadline, new Date(filters.deadlineBefore).getTime())
            );
        }
        if (filters.deadlineOn) {
            const startOfDay = new Date(
                `${filters.deadlineOn}T00:00:00.000Z`
            ).getTime();
            const endOfDay = new Date(
                `${filters.deadlineOn}T23:59:59.999Z`
            ).getTime();
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
        const values = new Set<string>();
        records.forEach((record) => {
            const fieldValue = record[field];
            if (fieldValue && typeof fieldValue === "string") {
                try {
                    const parsed = JSON.parse(fieldValue);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((item) => values.add(String(item)));
                    }
                } catch {
                    // Ignore invalid JSON
                }
            }
        });
        return values;
    }

    /**
     * Extracts unique scalar values from database records
     */
    private extractUniqueScalarValues<T extends Record<string, any>>(
        records: T[],
        field: keyof T
    ): Set<string> {
        const values = new Set<string>();
        records.forEach((record) => {
            const value = record[field];
            if (value !== null && value !== undefined) {
                values.add(String(value));
            }
        });
        return values;
    }

    /**
     * Creates a new note in the database
     */
    async createNote(params: CreateNoteParams): Promise<Note> {
        return measureExecutionTime("createNote", async () => {
            const db = createSqliteDb();

            try {
                const noteToInsert = {
                    id: params.id,
                    content: params.content,
                    key_context: params.key_context,
                    tags: params.tags ? JSON.stringify(params.tags) : null,
                    note_type: params.note_type,
                    deadline: params.deadline
                        ? new Date(params.deadline).getTime()
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
            }
        });
    }

    /**
     * Updates an existing note in the database
     */
    async updateNote(noteId: string, params: UpdateNoteParams): Promise<Note> {
        return measureExecutionTime("updateNote", async () => {
            const db = createSqliteDb();

            try {
                const updateData: Record<string, unknown> = {};

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && key !== "contexts") {
                        if (key === "deadline" && typeof value === "string") {
                            updateData[key] = new Date(value).getTime();
                        } else if (
                            key === "embedding_created_at" &&
                            typeof value === "string"
                        ) {
                            updateData[key] = new Date(value).getTime();
                        } else if (
                            key === "tags" ||
                            key === "suggested_contexts"
                        ) {
                            updateData[key] = Array.isArray(value)
                                ? JSON.stringify(value)
                                : value;
                        } else if (key === "embedding") {
                            // Handle embedding separately - don't store in main table
                            // Embeddings are stored in the vec0 virtual table
                            if (params.embedding_model) {
                                updateData["embedding_model"] =
                                    params.embedding_model;
                            }
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

                // Handle embedding if provided
                if (params.embedding && Array.isArray(params.embedding)) {
                    await this.upsertEmbedding(
                        noteId,
                        params.embedding,
                        params.embedding_model || "unknown"
                    );
                }

                return await this.convertDbNoteToNote(result[0], db);
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                console.error("Error updating note:", errorMessage);
                throw new Error(`Failed to update note: ${errorMessage}`);
            }
        });
    }

    /**
     * Deletes a note from the database
     */
    async deleteNote(noteId: string): Promise<{ noteId: string }> {
        return measureExecutionTime("deleteNote", async () => {
            const db = createSqliteDb();

            try {
                // First delete the note-context relationships
                await db
                    .delete(notesContexts)
                    .where(eq(notesContexts.note_id, noteId));

                // Remove the embedding from the notes table if it exists
                const rawDb = getRawSqliteConnection();
                try {
                    rawDb
                        .prepare(
                            "UPDATE notes SET embedding = NULL, embedding_model = NULL, embedding_created_at = NULL WHERE id = ?"
                        )
                        .run(noteId);
                } catch (error) {
                    // Note might not have embedding
                    console.warn(
                        "Could not remove embedding for note:",
                        noteId
                    );
                }

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
            }
        });
    }

    /**
     * Fetches notes with optional context filtering
     */
    async fetchNotes(params: FetchNotesParams): Promise<Note[]> {
        return measureExecutionTime("fetchNotes", async () => {
            const db = createSqliteDb();

            try {
                // Build where conditions
                const whereConditions: SQL[] = [];

                // Apply context filtering if provided
                if (params.keyContext) {
                    whereConditions.push(
                        eq(notes.key_context, params.keyContext)
                    );
                }

                if (params.contexts && params.contexts.length > 0) {
                    const contextConditions = params.contexts.map(
                        (context) =>
                            sql`EXISTS (
                            SELECT 1 FROM ${notesContexts} nc 
                            JOIN ${contexts} c ON nc.context_id = c.id 
                            WHERE nc.note_id = ${notes.id} AND c.name = ${context}
                        )`
                    );

                    const condition =
                        params.method === "OR"
                            ? or(...contextConditions)
                            : and(...contextConditions);

                    if (condition) {
                        whereConditions.push(condition);
                    }
                }

                // Build and execute the query
                const result =
                    whereConditions.length > 0
                        ? await db
                              .select()
                              .from(notes)
                              .where(and(...whereConditions))
                              .orderBy(desc(notes.created_at))
                        : await db
                              .select()
                              .from(notes)
                              .orderBy(desc(notes.created_at));

                // Convert notes and fetch their contexts
                const notesWithContexts = await Promise.all(
                    result.map((note) => this.convertDbNoteToNote(note, db))
                );

                return notesWithContexts;
            } catch (error) {
                console.error("Error fetching notes:", error);
                throw error;
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

            const db = createSqliteDb();

            try {
                const result = await db
                    .select()
                    .from(notes)
                    .where(inArray(notes.id, noteIds))
                    .orderBy(desc(notes.created_at));

                // Convert notes and fetch their contexts
                const notesWithContexts = await Promise.all(
                    result.map((note) => this.convertDbNoteToNote(note, db))
                );

                return notesWithContexts;
            } catch (error) {
                console.error("Error fetching notes by IDs:", error);
                throw error;
            }
        });
    }

    /**
     * Filters notes based on given parameters
     */
    async filterNotes(filters: NotesFilter = {}): Promise<FilterNotesResult> {
        return measureExecutionTime("filterNotes", async () => {
            console.log("Filtering notes with filters:", filters);

            const db = createSqliteDb();

            try {
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
     * Calculate cosine similarity between two vectors
     */
    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error("Vectors must have the same length");
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
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
            const rawDb = getRawSqliteConnection();

            try {
                // Query for similar embeddings directly from notes table
                // Get all notes with embeddings and calculate similarity in memory
                const allEmbeddingsQuery = `SELECT id, embedding FROM notes WHERE embedding IS NOT NULL`;
                const allEmbeddings = rawDb.prepare(allEmbeddingsQuery).all();

                if (allEmbeddings.length === 0) {
                    return {
                        notes: [],
                        totalCount: 0,
                        message: "",
                        appliedFilters: {
                            query: "",
                            similarityThreshold,
                            limit,
                        },
                    };
                }

                // Calculate cosine similarity in memory
                const similarities = allEmbeddings
                    .map((row: any) => {
                        const storedEmbedding = JSON.parse(row.embedding);
                        const similarity = this.calculateCosineSimilarity(
                            embedding,
                            storedEmbedding
                        );
                        return {
                            id: row.id,
                            similarity: similarity,
                            distance: 1 - similarity, // Convert similarity to distance
                        };
                    })
                    .filter((item) => item.similarity >= similarityThreshold)
                    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
                    .slice(0, limit);

                const noteIdsWithSimilarity = similarities;

                if (noteIdsWithSimilarity.length === 0) {
                    return {
                        notes: [],
                        totalCount: 0,
                        message: "",
                        appliedFilters: {
                            query: "",
                            similarityThreshold,
                            limit,
                        },
                    };
                }

                // Fetch note details using Drizzle
                const db = createSqliteDb();
                const noteIds = noteIdsWithSimilarity.map((item) => item.id);

                const notesData = await db
                    .select()
                    .from(notes)
                    .where(inArray(notes.id, noteIds));

                // Build raw results for transformation
                const rawResults: RawSemanticSearchResult[] = [];

                for (const noteData of notesData) {
                    const similarityData = noteIdsWithSimilarity.find(
                        (item) => item.id === noteData.id
                    );
                    const contexts = await this.fetchContextsForNote(
                        db,
                        noteData.id
                    );

                    rawResults.push({
                        id: noteData.id,
                        content: noteData.content,
                        key_context: noteData.key_context,
                        contexts: contexts,
                        tags: noteData.tags ? JSON.parse(noteData.tags) : null,
                        note_type: noteData.note_type,
                        suggested_contexts: noteData.suggested_contexts
                            ? JSON.parse(noteData.suggested_contexts)
                            : null,
                        created_at: new Date(noteData.created_at),
                        updated_at: new Date(noteData.updated_at),
                        similarity: similarityData?.similarity || 0,
                    });
                }

                // Sort by similarity descending
                rawResults.sort((a, b) => b.similarity - a.similarity);

                const formattedNotes =
                    this.transformSemanticSearchResults(rawResults);

                return {
                    notes: formattedNotes,
                    totalCount: formattedNotes.length,
                    message: "",
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
            }
        });
    }

    /**
     * Gets available filter options for notes
     */
    async getFilterOptions(): Promise<FilterOptions> {
        return measureExecutionTime("getFilterOptions", async () => {
            const db = createSqliteDb();

            try {
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
                const statusSet = this.extractUniqueScalarValues(
                    noteResults,
                    "status"
                );

                return {
                    availableContexts: Array.from(contextSet),
                    availableHashtags: Array.from(tagSet),
                    availableNoteTypes: Array.from(noteTypeSet),
                    availableStatuses: Array.from(statusSet).filter(
                        (status): status is TodoStatus =>
                            Object.values(TodoStatus).includes(
                                status as TodoStatus
                            )
                    ),
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not fetch filter options.";
                console.error("Error in getFilterOptions:", errorMessage);
                throw new Error(errorMessage);
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
            const limit = params.limit || 30;
            const offset = params.offset || 0;

            const rawDb = getRawSqliteConnection();

            try {
                // Execute equivalent of get_user_context_stats_paginated function
                const query = `
                    SELECT 
                        c.name AS context,
                        COUNT(*) AS count,
                        MAX(nc.created_at) AS lastUsed,
                        (SELECT COUNT(DISTINCT c2.name) FROM contexts c2 JOIN notes_contexts nc2 ON c2.id = nc2.context_id) AS total_count
                    FROM contexts c
                    JOIN notes_contexts nc ON c.id = nc.context_id
                    GROUP BY c.name
                    ORDER BY lastUsed DESC, count DESC
                    LIMIT ? OFFSET ?
                `;

                const results = rawDb
                    .prepare(query)
                    .all(limit, offset) as Array<{
                    context: string;
                    count: number;
                    lastUsed: number;
                    total_count: number;
                }>;

                const contexts: ContextStats[] = results.map((row) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: new Date(row.lastUsed).toISOString(),
                }));

                const totalCount =
                    results.length > 0 ? results[0].total_count : 0;
                const hasMore = offset + limit < totalCount;

                return {
                    contexts,
                    totalCount,
                    hasMore,
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not fetch context stats.";
                console.error(
                    "Error in fetchContextStatsPaginated:",
                    errorMessage
                );
                throw new Error(errorMessage);
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

            const rawDb = getRawSqliteConnection();

            try {
                // Execute equivalent of search_user_contexts function
                const query = `
                    SELECT 
                        c.name AS context,
                        COUNT(*) AS count,
                        MAX(nc.created_at) AS lastUsed
                    FROM contexts c
                    JOIN notes_contexts nc ON c.id = nc.context_id
                    WHERE LOWER(c.name) LIKE LOWER(?)
                    GROUP BY c.name
                    ORDER BY count DESC, lastUsed DESC
                    LIMIT ?
                `;

                const results = rawDb
                    .prepare(query)
                    .all(`%${searchTerm.trim()}%`, limit);

                return results.map((row: any) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: new Date(row.lastUsed).toISOString(),
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Could not search contexts.";
                console.error("Error in searchContexts:", errorMessage);
                throw new Error(errorMessage);
            }
        });
    }

    /**
     * Insert or update embedding for a note
     */
    async upsertEmbedding(
        noteId: string,
        embedding: number[],
        embeddingModel: string
    ): Promise<void> {
        return measureExecutionTime("upsertEmbedding", async () => {
            const db = createSqliteDb();

            try {
                // Store embedding directly in the notes table
                const embeddingJson = JSON.stringify(embedding);

                await db
                    .update(notes)
                    .set({
                        embedding: embeddingJson,
                        embedding_model: embeddingModel,
                        embedding_created_at: Date.now(),
                    })
                    .where(eq(notes.id, noteId));

                console.log(
                    `✅ Successfully stored embedding for note ${noteId} (${embedding.length} dimensions)`
                );
            } catch (error) {
                console.error("Error upserting embedding:", error);
                throw new Error(
                    error instanceof Error
                        ? `Failed to upsert embedding: ${error.message}`
                        : "Failed to upsert embedding"
                );
            }
        });
    }
}
