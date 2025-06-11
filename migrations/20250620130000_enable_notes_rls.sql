-- Enable Row Level Security for notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies to control access
-- Allow users to select only their own notes
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own notes
CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own notes
CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notes
CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- Create an index on user_id for faster policy evaluation
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);