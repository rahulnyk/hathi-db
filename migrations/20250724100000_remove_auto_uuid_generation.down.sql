-- Down migration: Restore auto UUID generation
-- This restores the original behavior where the database generates UUIDs

ALTER TABLE public.notes 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
