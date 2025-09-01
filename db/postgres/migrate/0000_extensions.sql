-- =============================================================================
-- EXTENSIONS SETUP
-- =============================================================================
-- This migration sets up the required PostgreSQL extensions

-- Enable vector extension for embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: The vector extension needs to be installed in PostgreSQL
-- For local development, install pgvector:
-- https://github.com/pgvector/pgvector#installation
