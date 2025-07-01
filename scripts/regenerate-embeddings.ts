import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GeminiAI } from '../lib/ai/gemini';
import { getCurrentEmbeddingConfig } from '../lib/constants/ai-config';

// Load environment variables from .env.local file (Next.js standard)
dotenv.config({ path: '.env.local' });

// Fallback to .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: '.env' });
}

// Check required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_AI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !googleApiKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GOOGLE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const aiProvider = new GeminiAI(googleApiKey);

interface Note {
  id: string;
  content: string;
  contexts?: string[];
  tags?: string[];
  note_type?: string;
  user_id: string;
}

// Function to generate document embedding using AI provider
async function generateDocumentEmbedding(
  content: string,
  contexts?: string[],
  tags?: string[],
  noteType?: string
): Promise<number[]> {
  try {
    const response = await aiProvider.generateDocumentEmbedding({
      content,
      contexts,
      tags,
      noteType
    });
    
    return response.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to backfill embeddings for notes
async function backfillEmbeddings() {
      console.log('Starting to backfill embeddings for all notes...');

  try {
    // Fetch all notes (regardless of whether they have embeddings)
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, content, contexts, tags, note_type, user_id');

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    if (!notes || notes.length === 0) {
      console.log('No notes found in the database.');
      return;
    }

    console.log(`Found ${notes.length} notes. Starting backfill for all notes...`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ noteId: string; error: string }> = [];

    // Process notes sequentially
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      console.log(`Processing note ${i + 1}/${notes.length} (ID: ${note.id})...`);

      try {
        // Generate embedding
        const embedding = await generateDocumentEmbedding(
          note.content,
          note.contexts,
          note.tags,
          note.note_type
        );

        // Update the note with the embedding directly using Supabase
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            embedding,
            embedding_model: getCurrentEmbeddingConfig().model,
            embedding_created_at: new Date().toISOString(),
          })
          .eq('id', note.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        successCount++;
        console.log(`✓ Successfully updated note ${note.id}`);

        // Add a small delay between requests to be respectful to the API
        if (i < notes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ Error processing note ${note.id}:`, errorMessage);
        errors.push({ noteId: note.id, error: errorMessage });
      }
    }

    // Print summary
    console.log('\n=== Backfill Summary ===');
    console.log(`Total notes processed: ${notes.length}`);
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(({ noteId, error }) => {
        console.log(`Note ${noteId}: ${error}`);
      });
    }

    if (successCount > 0) {
      console.log(`\n✅ Successfully backfilled embeddings for ${successCount} notes!`);
    }

  } catch (error) {
    console.error('Unexpected error during backfill:', error);
  }
}

// Run the backfill function
backfillEmbeddings().catch(console.error); 