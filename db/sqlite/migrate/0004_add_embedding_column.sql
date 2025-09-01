-- Add embedding column to notes table to match PostgreSQL schema
-- This stores embeddings as JSON text in the same table as the notes
ALTER TABLE notes ADD COLUMN embedding TEXT;

-- Create index for embedding queries (notes with embeddings)
CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes(embedding) WHERE embedding IS NOT NULL;

-- Create index for embedding model queries
CREATE INDEX IF NOT EXISTS idx_notes_embedding_model ON notes(embedding_model) WHERE embedding_model IS NOT NULL;
