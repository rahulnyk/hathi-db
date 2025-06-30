-- Create a new function that supports pagination and search
CREATE OR REPLACE FUNCTION get_user_context_stats_paginated(
    p_user_id uuid,
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
        WHERE n.user_id = p_user_id 
        AND LOWER(ctx) LIKE LOWER('%' || p_search_term || '%');
    ELSE
        SELECT COUNT(DISTINCT ctx) INTO total_contexts
        FROM notes AS n,
             unnest(n.contexts) AS ctx
        WHERE n.user_id = p_user_id;
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
        n.user_id = p_user_id
        AND (
            p_search_term IS NULL 
            OR p_search_term = '' 
            OR LOWER(ctx) LIKE LOWER('%' || p_search_term || '%')
        )
    GROUP BY
        ctx
    ORDER BY
        "lastUsed" DESC,
        "count" DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create a function specifically for search suggestions (returns all matching contexts)
CREATE OR REPLACE FUNCTION search_user_contexts(
    p_user_id uuid,
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
        n.user_id = p_user_id
        AND LOWER(ctx) LIKE LOWER('%' || p_search_term || '%')
    GROUP BY
        ctx
    ORDER BY
        "count" DESC,
        "lastUsed" DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
