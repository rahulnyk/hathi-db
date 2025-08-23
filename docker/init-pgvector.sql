-- This script runs when the PostgreSQL container is first initialized
-- It creates both the main and test databases with pgvector extension

-- Create the main database
CREATE DATABASE hathi_db;

-- Create the test database  
CREATE DATABASE hathi_db_test;

-- Connect to main database and enable pgvector
\c hathi_db;
CREATE EXTENSION IF NOT EXISTS vector;
GRANT USAGE ON SCHEMA public TO postgres;

-- Connect to test database and enable pgvector
\c hathi_db_test;
CREATE EXTENSION IF NOT EXISTS vector;
GRANT USAGE ON SCHEMA public TO postgres;

-- Switch back to the default database
\c postgres;
