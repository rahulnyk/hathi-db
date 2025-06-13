-- Add note_type column to notes table (as nullable)
ALTER TABLE public.notes
ADD COLUMN note_type TEXT;

-- Set the value of note_type to 'note' for all existing notes
UPDATE public.notes
SET note_type = 'note'
WHERE note_type IS NULL;

-- Create an index for faster queries on note_type
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON public.notes(note_type);

-- Note: Not adding NOT NULL constraint as per requirement