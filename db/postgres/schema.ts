import {
    pgTable,
    uuid,
    text,
    timestamp,
    vector,
    varchar,
    primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Contexts table schema for Hathi-DB
 * This table stores unique context names
 */
export const contexts = pgTable("contexts", {
    id: uuid("id").primaryKey().notNull(),
    name: text("name").notNull().unique(),
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`now()`),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .default(sql`now()`),
});

/**
 * Notes to Contexts junction table for many-to-many relationship
 */
export const notesContexts = pgTable(
    "notes_contexts",
    {
        note_id: uuid("note_id").notNull(),
        context_id: uuid("context_id").notNull(),
        created_at: timestamp("created_at", { withTimezone: true })
            .notNull()
            .default(sql`now()`),
    },
    (table) => [primaryKey({ columns: [table.note_id, table.context_id] })]
);

/**
 * Notes table schema for Hathi-DB
 * This table stores all note entries without user authentication
 *
 * Note: Indexes are defined in the raw SQL migration files for better control
 * over PostgreSQL-specific features like vector indexes and GIN indexes.
 */
export const notes = pgTable("notes", {
    // Primary key - ID generation handled by application
    id: uuid("id").primaryKey().notNull(),

    // Core content
    content: text("content").notNull(),
    key_context: text("key_context"),

    // Array columns for tags (contexts moved to separate table)
    tags: text("tags").array(),
    suggested_contexts: text("suggested_contexts").array(),

    // Note type and classification
    note_type: text("note_type"),

    // Vector embeddings for semantic search
    embedding: vector("embedding", {
        dimensions: parseInt(process.env.EMBEDDINGS_DIMS || "768", 10),
    }),
    embedding_model: varchar("embedding_model", { length: 50 }),
    embedding_created_at: timestamp("embedding_created_at", {
        withTimezone: true,
    }),

    // TODO functionality
    deadline: timestamp("deadline", { withTimezone: true }),
    status: text("status"),

    // Timestamps
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`now()`),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .default(sql`now()`),
});

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
export type Database = NodePgDatabase<typeof schema>;
