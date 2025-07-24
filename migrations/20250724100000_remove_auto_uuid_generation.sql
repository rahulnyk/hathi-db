-- Remove auto UUID generation from notes table
-- This allows the application to provide its own UUIDs

ALTER TABLE public.notes 
ALTER COLUMN id DROP DEFAULT;

-- Note: We keep the UUID type and PRIMARY KEY constraint
-- The application will now be responsible for generating UUIDs
