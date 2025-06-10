-- Drop indexes first
DROP INDEX IF EXISTS idx_notes_tags_gin;
DROP INDEX IF EXISTS idx_notes_contexts_gin;
DROP INDEX IF EXISTS idx_notes_key_context;

-- Drop columns
ALTER TABLE public.notes
DROP COLUMN IF EXISTS tags;

ALTER TABLE public.notes
DROP COLUMN IF EXISTS contexts;

ALTER TABLE public.notes
DROP COLUMN IF EXISTS key_context;