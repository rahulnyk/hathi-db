-- Create trigger to update updated_at timestamp on notes table
CREATE TRIGGER update_notes_updated_at
    AFTER UPDATE ON notes
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE notes SET updated_at = (unixepoch() * 1000) WHERE id = NEW.id;
END;

-- Create trigger to update updated_at timestamp on contexts table
CREATE TRIGGER update_contexts_updated_at
    AFTER UPDATE ON contexts
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE contexts SET updated_at = (unixepoch() * 1000) WHERE id = NEW.id;
END;
