-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant usage on the vector extension (optional but good practice)
GRANT USAGE ON SCHEMA public TO postgres;
