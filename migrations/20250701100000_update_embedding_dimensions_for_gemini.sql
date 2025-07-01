-- Migration: Update embedding dimensions for Google Gemini text-embedding-004
-- Created: 2025-07-01

-- Step 1: Drop existing indexes
DROP INDEX IF EXISTS idx_notes_embedding_cosine;
DROP INDEX IF EXISTS idx_notes_embedding_l2;

-- Step 2: Drop existing embedding column
ALTER TABLE notes DROP COLUMN IF EXISTS embedding;

-- Step 3: Add new embedding column with 768 dimensions (Google text-embedding-004)
ALTER TABLE notes ADD COLUMN embedding vector(768) DEFAULT NULL;

-- Step 4: Recreate indexes for vector similarity searches
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

-- Step 5: Update the semantic search function to use 768 dimensions
CREATE OR REPLACE FUNCTION search_notes_by_similarity(
    p_user_id UUID,
    p_query_embedding vector(768), -- Google text-embedding-004 dimension
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    content TEXT,
    key_context TEXT,
    contexts TEXT[],
    tags TEXT[],
    note_type TEXT,
    suggested_contexts TEXT[],
    created_at TIMESTAMPTZ,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.content,
        n.key_context,
        n.contexts,
        n.tags,
        n.note_type,
        n.suggested_contexts,
        n.created_at,
        (1 - (n.embedding <=> p_query_embedding)) AS similarity
    FROM notes n
    WHERE
        n.user_id = p_user_id
        AND n.embedding IS NOT NULL
        AND (1 - (n.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (n.embedding <=> p_query_embedding)) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;