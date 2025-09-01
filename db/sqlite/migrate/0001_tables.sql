-- Create contexts table
CREATE TABLE "contexts" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    "created_at" INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    "updated_at" INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Create notes table
CREATE TABLE "notes" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "content" TEXT NOT NULL,
    "key_context" TEXT,
    "tags" TEXT, -- JSON string of array
    "suggested_contexts" TEXT, -- JSON string of array
    "note_type" TEXT,
    -- "embedding" TEXT, -- JSON string of embedding vector
    "embedding_model" TEXT,
    "embedding_created_at" INTEGER, -- timestamp in milliseconds
    "deadline" INTEGER, -- timestamp in milliseconds
    "status" TEXT,
    "created_at" INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    "updated_at" INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Create notes_contexts junction table
CREATE TABLE "notes_contexts" (
    "note_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    PRIMARY KEY ("note_id", "context_id"),
    FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("context_id") REFERENCES "contexts" ("id") ON DELETE CASCADE
);

-- Create indexes for contexts
CREATE INDEX "idx_contexts_name" ON "contexts" ("name");

-- Create indexes for notes_contexts
CREATE INDEX "idx_notes_contexts_note_id" ON "notes_contexts" ("note_id");
CREATE INDEX "idx_notes_contexts_context_id" ON "notes_contexts" ("context_id");

-- Create indexes for notes
CREATE INDEX "idx_notes_key_context" ON "notes" ("key_context");
CREATE INDEX "idx_notes_note_type" ON "notes" ("note_type");
CREATE INDEX "idx_notes_deadline" ON "notes" ("deadline");
CREATE INDEX "idx_notes_status" ON "notes" ("status");
CREATE INDEX "idx_notes_created_at" ON "notes" ("created_at");
CREATE INDEX "idx_notes_updated_at" ON "notes" ("updated_at");
