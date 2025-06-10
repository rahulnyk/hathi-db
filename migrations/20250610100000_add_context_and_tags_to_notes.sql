-- Add key_context column
ALTER TABLE public.notes
ADD COLUMN key_context TEXT;

-- Add contexts array column
ALTER TABLE public.notes
ADD COLUMN contexts TEXT[];

-- Add tags array column
ALTER TABLE public.notes
ADD COLUMN tags TEXT[];

-- Create index for key_context
CREATE INDEX IF NOT EXISTS idx_notes_key_context ON public.notes(key_context);

-- Create GIN index for contexts array (for faster array operations like @>, <@, &&)
CREATE INDEX IF NOT EXISTS idx_notes_contexts_gin ON public.notes USING GIN (contexts);

-- Create GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_notes_tags_gin ON public.notes USING GIN (tags);