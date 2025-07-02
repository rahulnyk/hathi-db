# Scripts

This directory contains utility scripts for the Hathi application.

## Seed Notes Script

The `seed-notes.ts` script populates your database with sample notes and generates optimized embeddings for semantic search.

### Prerequisites

1. **Environment Variables**: Make sure you have these in your `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GOOGLE_AI_API_KEY=your-google-ai-key
   ```

2. **Database**: Run migrations first:
   ```bash
   yarn migrate
   ```

3. **User ID**: Update the `SAMPLE_USER_ID` in the script with a real user ID from your `auth.users` table.

### Usage

Run the seed script:
```bash
yarn seed
```

### What it does

1. **Creates Sample Notes**: Inserts 17 diverse sample notes with different contexts, tags, and content types
2. **Generates Embeddings**: Uses Google's gemini-embedding-001 model with optimized prompts for each note
3. **Updates Database**: Patches each note with its embedding vector and metadata
4. **Batch Processing**: Processes notes in batches of 5 to avoid API rate limits

### Sample Notes Included

- Meeting notes with work contexts
- Personal journal entries
- Technical documentation
- Recipes
- Fitness tracking
- Quick thoughts and reminders
- And more...

### Customization

You can modify the `seedNotes` array in the script to:
- Add your own sample notes
- Change the user ID
- Adjust contexts and tags
- Modify content types

### Troubleshooting

- **Rate Limits**: The script includes delays between batches to respect API limits
- **Embedding Errors**: Failed embeddings are logged but don't stop the script
- **Database Errors**: Check your Supabase connection and permissions

### Notes

- The script uses the service role key for database access
- Embeddings are generated using the same optimized prompts as your app
- All notes are created with proper timestamps and metadata