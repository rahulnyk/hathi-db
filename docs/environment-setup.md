# Environment Setup

This document explains how to set up the environment variables for the Hathi note-taking application.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```bash
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### AI Provider Configuration

The application uses **Google Gemini** as the AI provider.

#### Google AI
```bash
# Get this from Google AI Studio: https://aistudio.google.com/
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

### Optional Configuration
```bash
# Enable performance logging to CSV file
LOG_PERF_TO_CSV=false
```

## Getting API Keys

### Google AI API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API key" in the top right
4. Create a new API key or use an existing one
5. Copy the API key to your `.env.local` file

### Supabase Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

## Database Migration

After setting up your environment variables, run the database migrations:

```bash
yarn migrate
```

This will set up the database with the correct embedding dimensions for Google Gemini:
- **Google Gemini**: 1536 dimensions (gemini-embedding-exp-03-07)

## Troubleshooting

### Common Issues

1. **"GOOGLE_AI_API_KEY environment variable is required"**
   - Make sure you've added the Google AI API key to your `.env.local` file
   - Restart your development server after adding the environment variable

2. **Vector dimension mismatch**
   - The application uses 1536-dimensional vectors for Google gemini-embedding-exp-0307
   - Run migrations if you encounter dimension-related issues

### Development vs Production

- **Development**: Use `.env.local` for local development
- **Production**: Set environment variables in your hosting platform (Vercel, etc.)