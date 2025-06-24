-- Add suggested_contexts array column
ALTER TABLE public.notes
ADD COLUMN suggested_contexts TEXT[];

-- Create GIN index for suggested_contexts array (for faster array operations like @>, <@, &&)
CREATE INDEX IF NOT EXISTS idx_notes_suggested_contexts_gin ON public.notes USING GIN (suggested_contexts);
