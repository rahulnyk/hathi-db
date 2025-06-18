CREATE OR REPLACE FUNCTION get_user_context_stats(p_user_id uuid)
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
  GROUP BY
    ctx
  ORDER BY
    "count" DESC,
    "lastUsed" DESC;
END;
$$ LANGUAGE plpgsql;