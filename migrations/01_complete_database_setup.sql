-- Migration: Complete Database Setup for Hathi-DB
-- Created: 2025-08-20
-- Consolidated migration that sets up the complete database schema without user authentication
-- This migration creates all tables, functions, indexes, and extensions needed by the application

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Create notes table with complete schema (no user_id - auth removed)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  key_context TEXT,
  contexts TEXT[],
  tags TEXT[],
  note_type TEXT,
  suggested_contexts TEXT[],
  embedding vector(1536) DEFAULT NULL,
  embedding_model VARCHAR(50) DEFAULT NULL,
  embedding_created_at TIMESTAMPTZ DEFAULT NULL,
  deadline TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- TRIGGERS AND UTILITY FUNCTIONS
-- =============================================================================

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Standard column indexes
CREATE INDEX IF NOT EXISTS idx_notes_key_context ON public.notes(key_context);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON public.notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_deadline ON public.notes(deadline);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at);

-- Array column indexes (GIN for efficient array operations)
CREATE INDEX IF NOT EXISTS idx_notes_contexts_gin ON public.notes USING GIN (contexts);
CREATE INDEX IF NOT EXISTS idx_notes_tags_gin ON public.notes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_notes_suggested_contexts_gin ON public.notes USING GIN (suggested_contexts);

-- Vector similarity indexes for semantic search
CREATE INDEX IF NOT EXISTS idx_notes_embedding_cosine
ON notes USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_embedding_l2
ON notes USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Function to get context statistics (used by contexts.ts)
CREATE OR REPLACE FUNCTION get_user_context_stats()
RETURNS TABLE(context text, "count" bigint, "lastUsed" timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ctx AS context,
    COUNT(*) AS "count",
    MAX(n.created_at) AS "lastUsed"
  FROM
    notes AS n,
    unnest(n.contexts) AS ctx
  GROUP BY
    ctx
  ORDER BY
    "count" DESC,
    "lastUsed" DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get paginated context statistics with search (used by contexts.ts)
CREATE OR REPLACE FUNCTION get_user_context_stats_paginated(
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0,
    p_search_term text DEFAULT NULL
)
RETURNS TABLE(context text, "count" bigint, "lastUsed" timestamptz, total_count bigint) AS $$
DECLARE
    total_contexts bigint;
BEGIN
    -- First, get the total count of contexts for pagination info
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SELECT COUNT(DISTINCT ctx) INTO total_contexts
        FROM notes AS n,
             unnest(n.contexts) AS ctx
        WHERE LOWER(ctx) LIKE LOWER('%' || p_search_term || '%');
    ELSE
        SELECT COUNT(DISTINCT ctx) INTO total_contexts
        FROM notes AS n,
             unnest(n.contexts) AS ctx;
    END IF;

    -- Return the paginated results with search filtering
    RETURN QUERY
    SELECT
        ctx AS context,
        COUNT(*) AS "count",
        MAX(n.created_at) AS "lastUsed",
        total_contexts AS total_count
    FROM
        notes AS n,
        unnest(n.contexts) AS ctx
    WHERE
        p_search_term IS NULL 
        OR p_search_term = '' 
        OR LOWER(ctx) LIKE LOWER('%' || p_search_term || '%')
    GROUP BY
        ctx
    ORDER BY
        "lastUsed" DESC,
        "count" DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to search user contexts (used by contexts.ts)
CREATE OR REPLACE FUNCTION search_user_contexts(
    p_search_term text,
    p_limit integer DEFAULT 20
)
RETURNS TABLE(context text, "count" bigint, "lastUsed" timestamptz) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ctx AS context,
        COUNT(*) AS "count",
        MAX(n.created_at) AS "lastUsed"
    FROM
        notes AS n,
        unnest(n.contexts) AS ctx
    WHERE
        LOWER(ctx) LIKE LOWER('%' || p_search_term || '%')
    GROUP BY
        ctx
    ORDER BY
        "count" DESC,
        "lastUsed" DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search notes by semantic similarity using embeddings (used by agent tools)
CREATE OR REPLACE FUNCTION search_notes_by_similarity(
    p_query_embedding vector(1536), -- OpenAI embedding dimension
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
        n.embedding IS NOT NULL
        AND (1 - (n.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (n.embedding <=> p_query_embedding)) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Display table structure for verification
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Table structure:';
    RAISE NOTICE 'Notes table created with columns: id, content, key_context, contexts, tags, note_type, suggested_contexts, embedding, embedding_model, embedding_created_at, deadline, status, created_at, updated_at';
    RAISE NOTICE 'All required functions created: get_user_context_stats, get_user_context_stats_paginated, search_user_contexts, search_notes_by_similarity';
    RAISE NOTICE 'All indexes created for optimal performance';
END $$;
