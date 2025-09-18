/**
 * SQLite Database Schema for Hathi-DB
 *
 * This schema mirrors the PostgreSQL schema but uses SQLite-compatible types
 * and stores vector embeddings in a separate virtual table using sqlite-vec.
 */

import {
    sqliteTable,
    text,
    integer,
    primaryKey,
    index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

/**
 * Contexts table schema for SQLite
 * Stores unique context names with UUIDs as TEXT
 */
export const contexts = sqliteTable(
    "contexts",
    {
        id: text("id").primaryKey().notNull(), // UUID as TEXT
        name: text("name").notNull().unique(),
        created_at: integer("created_at")
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        updated_at: integer("updated_at")
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
    },
    (table) => [index("idx_contexts_name").on(table.name)]
);

/**
 * Notes to Contexts junction table for many-to-many relationship
 */
export const notesContexts = sqliteTable(
    "notes_contexts",
    {
        note_id: text("note_id").notNull(), // UUID as TEXT
        context_id: text("context_id").notNull(), // UUID as TEXT
        created_at: integer("created_at")
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
    },
    (table) => [
        primaryKey({ columns: [table.note_id, table.context_id] }),
        index("idx_notes_contexts_note_id").on(table.note_id),
        index("idx_notes_contexts_context_id").on(table.context_id),
    ]
);

/**
 * Notes table schema for SQLite
 * Main table for storing note content and metadata
 * Embeddings are stored as JSON TEXT to match PostgreSQL vector functionality
 */
export const notes = sqliteTable(
    "notes",
    {
        // Primary key - UUID as TEXT
        id: text("id").primaryKey().notNull(),

        // Core content
        content: text("content").notNull(),
        key_context: text("key_context"),

        // JSON serialized arrays (PostgreSQL text[] becomes TEXT with JSON)
        tags: text("tags"), // JSON.stringify(string[])
        suggested_contexts: text("suggested_contexts"), // JSON.stringify(string[])

        // Note type and classification
        note_type: text("note_type"),

        // Embedding storage (JSON array to match PostgreSQL vector)
        embedding: text("embedding"), // JSON.stringify(number[]) - 768 dimensions (multilingual-e5-base)
        embedding_model: text("embedding_model", { length: 50 }),
        embedding_created_at: integer("embedding_created_at"),

        // TODO functionality
        deadline: integer("deadline"),
        status: text("status"),

        // Timestamps (stored as milliseconds since epoch)
        created_at: integer("created_at")
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        updated_at: integer("updated_at")
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
    },
    (table) => [
        index("idx_notes_key_context").on(table.key_context),
        index("idx_notes_note_type").on(table.note_type),
        index("idx_notes_deadline").on(table.deadline),
        index("idx_notes_status").on(table.status),
        index("idx_notes_created_at").on(table.created_at),
        index("idx_notes_updated_at").on(table.updated_at),
        index("idx_notes_embedding_model").on(table.embedding_model), // Index for embedding queries
    ]
);

// Define relationships
export const notesRelations = relations(notes, ({ many }) => ({
    notesContexts: many(notesContexts),
}));

export const contextsRelations = relations(contexts, ({ many }) => ({
    notesContexts: many(notesContexts),
}));

export const notesContextsRelations = relations(notesContexts, ({ one }) => ({
    note: one(notes, {
        fields: [notesContexts.note_id],
        references: [notes.id],
    }),
    context: one(contexts, {
        fields: [notesContexts.context_id],
        references: [contexts.id],
    }),
}));

// Export types for use in application
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Context = typeof contexts.$inferSelect;
export type NewContext = typeof contexts.$inferInsert;
export type NoteContext = typeof notesContexts.$inferSelect;
export type NewNoteContext = typeof notesContexts.$inferInsert;

// Database schema for strong typing
export const schema = {
    notes,
    contexts,
    notesContexts,
    notesRelations,
    contextsRelations,
    notesContextsRelations,
};

// Database type for strong typing database instances
export type Database = BetterSQLite3Database<typeof schema>;
