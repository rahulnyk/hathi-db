# Da- **Realistic Content**: Notes include various types of content an entrepreneur would create

-   **Date Distribution**: Notes are spread across past 7 days with random timestamps
-   **Context Management**: Each note gets a date-based key context and relevant topic contexts
-   **Suggested Contexts**: Pre-populated semantic suggestions for enhanced note discovery
-   **Batch Embedding Generation**: AI embeddings are generated efficiently in parallel batches
-   **Slug-based Contexts**: All contexts use slug format for consistencye Seeding

This directory contains scrip## Features

-   **Realistic Content**: Notes include various types of content an entrepreneur would create
-   **Date Distribution**: Notes are spread across past 7 days with random timestamps
-   **Context Management**: Each note gets a date-based key context and relevant topic contexts
-   **Batch Embedding Generation**: AI embeddings are generated efficiently in parallel batches
-   **Slug-based Contexts**: All contexts use slug format for consistency

## Performance

The seeding script uses batch processing for embedding generation, which provides significant performance improvements:

-   **Batch Size**: Processes 5 embeddings in parallel per batch
-   **API Efficiency**: Reduces total API calls and improves throughput
-   **Typical Performance**: ~12 seconds for 20 notes (vs ~4 minutes with sequential processing)seeding the database with sample data.

## Files

### `entrepreneur-notes.json`

Contains a week's worth of realistic entrepreneur notes including:

-   Meeting notes
-   Product ideas
-   Customer feedback
-   Todo lists
-   Personal reflections
-   Strategic thoughts

The notes are designed to be unorganized and realistic, representing how an entrepreneur might quickly jot down thoughts throughout their day.

### `seed-notes.ts`

Script that loads the entrepreneur notes and seeds the database with:

-   Notes distributed across the past 7 days (excluding today)
-   Random timestamps within business hours (8 AM - 8 PM)
-   Maximum 10 notes per day
-   Date-based contexts (e.g., "15-august-2025")
-   AI-generated embeddings for each note (processed in batches for efficiency)
-   Proper key_context and contexts fields

## Usage

1. Ensure your environment variables are set in `.env.local`:

    ```
    GOOGLE_AI_API_KEY=your_api_key
    ```

2. Make sure your PostgreSQL database is running:

    ```bash
    docker-compose up -d
    ```

3. Run the seeding script:
    ```bash
    yarn tsx db/seed/seed-notes.ts
    ```

## Features

-   **Realistic Content**: Notes include various types of content an entrepreneur would create
-   **Date Distribution**: Notes are spread across past 7 days with random timestamps
-   **Context Management**: Each note gets a date-based key context and relevant topic contexts
-   **Embedding Generation**: AI embeddings are generated for semantic search capabilities
-   **Slug-based Contexts**: All contexts use slug format for consistency

## Data Structure

Each note includes:

-   `content`: The actual note text (markdown formatted)
-   `key_context`: Date slug (e.g., "15-august-2025")
-   `contexts`: Array including date context plus topic contexts
-   `tags`: Relevant tags for categorization
-   `note_type`: Type of note (usually "note")
-   `suggested_contexts`: AI-curated related topics for discovery
-   `created_at`: Timestamp when note was supposedly created
-   `embedding`: AI-generated vector for semantic search
