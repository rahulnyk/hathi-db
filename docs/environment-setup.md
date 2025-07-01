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

The application currently uses **Google Gemini** as the default AI provider. You can switch to OpenAI by changing the `CURRENT_AI_PROVIDER` in `lib/constants/ai-config.ts`.

#### Google AI (Default)
```bash
# Get this from Google AI Studio: https://aistudio.google.com/
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

#### OpenAI (Alternative)
```bash
# Get this from OpenAI Platform: https://platform.openai.com/
OPENAI_API_KEY=your-openai-api-key
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

## Switching AI Providers

To switch between AI providers, edit `lib/constants/ai-config.ts`:

```typescript
// For Google Gemini (default)
export const CURRENT_AI_PROVIDER: AIProviderType = AI_PROVIDER.GEMINI;

// For OpenAI
export const CURRENT_AI_PROVIDER: AIProviderType = AI_PROVIDER.OPENAI;
```

## Database Migration

After setting up your environment variables, run the database migrations:

```bash
pnpm migrate
```

This will set up the database with the correct embedding dimensions for your chosen AI provider:
- **Google Gemini**: 768 dimensions (embedding-001)
- **OpenAI**: 1536 dimensions (text-embedding-3-small)

## Troubleshooting

### Common Issues

1. **"GOOGLE_AI_API_KEY environment variable is required"**
   - Make sure you've added the Google AI API key to your `.env.local` file
   - Restart your development server after adding the environment variable

2. **"OPENAI_API_KEY environment variable is required"**
   - This error appears if you're using OpenAI but haven't set the API key
   - Either add the OpenAI API key or switch to Google Gemini

3. **Vector dimension mismatch**
   - If you switch AI providers, you may need to run migrations again
   - The application will automatically handle the dimension changes

### Development vs Production

- **Development**: Use `.env.local` for local development
- **Production**: Set environment variables in your hosting platform (Vercel, etc.)