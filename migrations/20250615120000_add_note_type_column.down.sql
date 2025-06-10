-- Drop the index
DROP INDEX IF EXISTS idx_notes_note_type;

-- Drop the column
ALTER TABLE public.notes
DROP COLUMN IF EXISTS note_type;