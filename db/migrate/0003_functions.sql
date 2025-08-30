-- =============================================================================
-- DATABASE FUNCTIONS FOR APPLICATION LOGIC
-- =============================================================================
-- This migration creates all the database functions required by the application

-- Function to get context statistics (used by contexts.ts)
CREATE OR REPLACE FUNCTION get_user_context_stats()
RETURNS TABLE(context text, "count" bigint, "lastUsed" timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name AS context,
    COUNT(*) AS "count",
    MAX(nc.created_at) AS "lastUsed"
  FROM
    contexts c
    JOIN notes_contexts nc ON c.id = nc.context_id
  GROUP BY
    c.name
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
        SELECT COUNT(DISTINCT c.name) INTO total_contexts
        FROM contexts c
        JOIN notes_contexts nc ON c.id = nc.context_id
        WHERE LOWER(c.name) LIKE LOWER('%' || p_search_term || '%');
    ELSE
        SELECT COUNT(DISTINCT c.name) INTO total_contexts
        FROM contexts c
        JOIN notes_contexts nc ON c.id = nc.context_id;
    END IF;

    -- Return the paginated results with search filtering
    RETURN QUERY
    SELECT
        c.name AS context,
        COUNT(*) AS "count",
        MAX(nc.created_at) AS "lastUsed",
        total_contexts AS total_count
    FROM
        contexts c
        JOIN notes_contexts nc ON c.id = nc.context_id
    WHERE
        p_search_term IS NULL 
        OR p_search_term = '' 
        OR LOWER(c.name) LIKE LOWER('%' || p_search_term || '%')
    GROUP BY
        c.name
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
        c.name AS context,
        COUNT(*) AS "count",
        MAX(nc.created_at) AS "lastUsed"
    FROM
        contexts c
        JOIN notes_contexts nc ON c.id = nc.context_id
    WHERE
        LOWER(c.name) LIKE LOWER('%' || p_search_term || '%')
    GROUP BY
        c.name
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
        ARRAY(
            SELECT c.name 
            FROM notes_contexts nc 
            JOIN contexts c ON nc.context_id = c.id 
            WHERE nc.note_id = n.id
        ) AS contexts,
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
