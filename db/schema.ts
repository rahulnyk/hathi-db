import {
    pgTable,
    uuid,
    text,
    timestamp,
    vector,
    varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Notes table schema for Hathi-DB
 * This table stores all note entries without user authentication
 *
 * Note: Indexes are defined in the raw SQL migration files for better control
 * over PostgreSQL-specific features like vector indexes and GIN indexes.
 */
export const notes = pgTable("notes", {
    // Primary key
    id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    // Core content
    content: text("content").notNull(),
    key_context: text("key_context"),

    // Array columns for contexts and tags
    contexts: text("contexts").array(),
    tags: text("tags").array(),
    suggested_contexts: text("suggested_contexts").array(),

    // Note type and classification
    note_type: text("note_type"),

    // Vector embeddings for semantic search
    embedding: vector("embedding", { dimensions: 1536 }),
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

// Export type for use in application
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
