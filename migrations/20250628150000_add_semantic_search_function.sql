-- Migration: Add semantic search function for Q&A
-- Created: 2025-06-28

-- Function to search notes by semantic similarity using embeddings
CREATE OR REPLACE FUNCTION search_notes_by_similarity(
    p_user_id UUID,
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
        n.user_id = p_user_id 
        AND n.embedding IS NOT NULL
        AND (1 - (n.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (n.embedding <=> p_query_embedding)) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
