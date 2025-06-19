-- Step 1: Enable vector extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column using pgvector
-- text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding vector(1536) DEFAULT NULL;

-- Step 3: Add metadata columns
ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMPTZ DEFAULT NULL;

-- Step 4: Create indexes for vector similarity searches
-- Cosine similarity index (most common for text embeddings)
CREATE INDEX IF NOT EXISTS idx_notes_embedding_cosine
ON notes USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;

-- L2 distance index (alternative similarity metric)
CREATE INDEX IF NOT EXISTS idx_notes_embedding_l2
ON notes USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;
