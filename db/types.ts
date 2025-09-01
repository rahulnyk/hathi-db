/**
 * Database adapter types for Hathi-DB
 *
 * This module defines all types used by the database adapter to ensure
 * type safety and consistency across database operations.
 */

/**
 * Persistence status for notes in the application
 */
export type PersistenceStatus = "pending" | "persisted" | "failed" | "deleting";

/**
 * Possible note types in the system
 */
export type NoteType = "note" | "todo" | "ai-todo" | "ai-note" | null;

/**
 * TODO status enum for task management
 */
export enum TodoStatus {
    TODO = "TODO",
    DOING = "DOING",
    DONE = "DONE",
    OBSOLETE = "OBSOLETE",
}

/**
 * Application-level note interface that extends the database schema
 * with additional runtime properties
 */
export interface Note {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    persistenceStatus: PersistenceStatus;
    errorMessage?: string;
    key_context?: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
    suggested_contexts?: string[];
    embedding?: number[];
    embedding_model?: string;
    embedding_created_at?: string;
    isSearchResult?: boolean;
    deadline?: string | null;
    status?: TodoStatus | null;
}

/**
 * Search result note interface for agent tools
 */
export interface SearchResultNote
    extends Pick<
        Note,
        | "persistenceStatus"
        | "id"
        | "content"
        | "key_context"
        | "contexts"
        | "tags"
        | "note_type"
        | "suggested_contexts"
        | "created_at"
        | "updated_at"
        | "deadline"
        | "status"
    > {
    similarity?: number;
}

/**
 * Parameters for creating a new note
 */
export interface CreateNoteParams {
    id: string;
    content: string;
    key_context: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
    deadline?: string | null;
    status?: TodoStatus | null;
}

/**
 * Parameters for updating an existing note
 */
export interface UpdateNoteParams {
    content?: string;
    contexts?: string[];
    tags?: string[];
    suggested_contexts?: string[];
    note_type?: NoteType;
    deadline?: string | null;
    status?: TodoStatus | null;
    embedding?: number[];
    embedding_model?: string;
    embedding_created_at?: string;
}

/**
 * Parameters for fetching notes with context filtering
 */
export interface FetchNotesParams {
    keyContext?: string;
    contexts?: string[];
    method?: "AND" | "OR";
}

/**
 * Filter parameters for advanced note searching
 */
export interface NotesFilter {
    createdAfter?: string;
    createdBefore?: string;
    contexts?: string[];
    hashtags?: string[];
    noteType?: string;
    deadlineAfter?: string;
    deadlineBefore?: string;
    deadlineOn?: string;
    status?: TodoStatus;
    limit?: number;
}

/**
 * Result interface for filtered notes
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
        limit: number;
    };
}

/**
 * Parameters for semantic search
 */
export interface SemanticSearchParams {
    query: string;
    similarityThreshold?: number;
    limit?: number;
}

/**
 * Result interface for semantic search
 */
export interface SemanticSearchResult {
    notes: SearchResultNote[];
    totalCount: number;
    message: string;
    appliedFilters: {
        query: string;
        similarityThreshold: number;
        limit: number;
    };
}

/**
 * Raw semantic search result from database
 */
export interface RawSemanticSearchResult {
    id: string;
    content: string;
    key_context: string | null;
    contexts: string[] | null;
    tags: string[] | null;
    note_type: string | null;
    suggested_contexts: string[] | null;
    created_at: Date;
    updated_at: Date;
    similarity: number;
}

/**
 * Context statistics interface
 */
export interface ContextStats {
    context: string;
    count: number;
    lastUsed?: string;
}

/**
 * Paginated context statistics response
 */
export interface PaginatedContextStats {
    contexts: ContextStats[];
    totalCount: number;
    hasMore: boolean;
}

/**
 * Parameters for fetching context statistics
 */
export interface FetchContextStatsParams {
    limit?: number;
    offset?: number;
}

/**
 * Available filter options for notes
 */
export interface FilterOptions {
    availableContexts: string[];
    availableHashtags: string[];
    availableNoteTypes: string[];
    availableStatuses: TodoStatus[];
}

/**
 * Database adapter interface defining all database operations
 */
export interface DatabaseAdapter {
    // Note operations
    createNote(params: CreateNoteParams): Promise<Note>;
    updateNote(noteId: string, params: UpdateNoteParams): Promise<Note>;
    deleteNote(noteId: string): Promise<{ noteId: string }>;
    fetchNotes(params: FetchNotesParams): Promise<Note[]>;
    fetchNotesByIds(noteIds: string[]): Promise<Note[]>;

    // Search operations
    filterNotes(filters: NotesFilter): Promise<FilterNotesResult>;
    searchNotesBySimilarity(
        params: SemanticSearchParams
    ): Promise<SemanticSearchResult>;
    getFilterOptions(): Promise<FilterOptions>;

    // Context operations
    fetchContextStatsPaginated(
        params: FetchContextStatsParams
    ): Promise<PaginatedContextStats>;
    searchContexts(searchTerm: string, limit?: number): Promise<ContextStats[]>;
}
