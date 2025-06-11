-- Drop all policies for the notes table
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Disable Row Level Security
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;

-- Note: We're not dropping the user_id index as it might be useful for other queries
-- If you want to also drop the index, uncomment the following line:
-- DROP INDEX IF EXISTS idx_notes_user_id;