-- Migration: Add deadline and status to notes table for TODO functionality
-- Created: 2025-07-01

DO $$
BEGIN
    -- Add 'deadline' column for TODO items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='deadline') THEN
        ALTER TABLE notes ADD COLUMN deadline TIMESTAMPTZ;
        RAISE NOTICE 'Column deadline added to notes table.';
    ELSE
        RAISE NOTICE 'Column deadline already exists in notes table.';
    END IF;

    -- Add 'status' column for TODO items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='status') THEN
        ALTER TABLE notes ADD COLUMN status TEXT;
        RAISE NOTICE 'Column status added to notes table.';
    ELSE
        RAISE NOTICE 'Column status already exists in notes table.';
    END IF;
END $$;
