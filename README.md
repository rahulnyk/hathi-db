<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Hathi - AI-Powered Note-Taking with Supabase and Next.js" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Hathi - AI-Powered Note-Taking App</h1>
</a>

<p align="center">
 An intelligent note-taking application with AI-powered Q&A built with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#ai-qa-feature"><strong>AI Q&A Feature</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
</p>
<br/>

## Features

### Core Note-Taking
- **Rich Markdown Support**: Write notes with full Markdown formatting including headers, lists, code blocks, and emphasis
- **Context-Based Organization**: Organize notes using contextual tags and categories
- **Smart Bracket Insertion**: Auto-completion for brackets, parentheses, and other paired characters
- **Real-time Editing**: Edit notes inline with double-click functionality
- **Optimistic Updates**: Instant UI updates with background synchronization

### AI-Powered Features
- **Intelligent Q&A**: Ask questions about your notes using natural language
- **Semantic Search**: Find relevant notes using AI embeddings and vector similarity
- **Context Suggestions**: AI-generated context suggestions for better organization
- **Note Structuring**: AI-powered note structuring and formatting

### Technical Features
- Built on [Next.js](https://nextjs.org) App Router
- **Supabase Integration**: Authentication, database, and real-time subscriptions
- **Vector Embeddings**: OpenAI embeddings for semantic search capabilities
- **Redux State Management**: Centralized state with optimistic updates
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works on desktop and mobile devices
- **Tailwind CSS** styling with **shadcn/ui** components

## AI Q&A Feature

The standout feature of Hathi is its AI-powered Q&A system that lets you ask questions about your notes using natural language.

### How to Use

1. **Ask Questions**: In any note input field, start your message with `\qai` followed by your question
   ```
   \qai What did I discuss in my team meetings last week?
   \qai Summarize my project notes
   \qai What are the key points from my research on AI?
   ```

2. **Get AI Answers**: The system will:
   - Search your notes using semantic similarity (AI embeddings)
   - Fall back to keyword matching if needed
   - Generate contextual answers using OpenAI
   - Display the answer inline in your note timeline

3. **Smart Search**: The system uses multiple search strategies:
   - **Semantic Search**: Uses OpenAI embeddings to find conceptually similar notes
   - **Keyword Matching**: Falls back to traditional text matching
   - **Recent Notes**: Uses your most recent notes if no specific matches are found

### Features
- **Inline Integration**: Ask questions directly in the note input box
- **Visual Distinction**: AI answers are clearly marked and cannot be edited
- **Context Aware**: Uses your personal context tags and note history
- **Robust Fallbacks**: Multiple search strategies ensure you always get relevant results
- **No Separate Interface**: Seamlessly integrated into the note-taking workflow

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Copy the database credentials mainly NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

3. You will also need an OPEN AI API Key OPENAI_API_KEY for the AI features

4. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   OPENAI_API_KEY=[INSERT OPEN AI API KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. Install dependencies:

   ```bash
   npm install
   ```

6. **Important**: Run database migrations to set up the schema and AI features:

   ```bash
   npm run migrate
   ```

   This will create:
   - Notes table with embedding support
   - Context and tags functionality  
   - Semantic search functions for AI Q&A
   - User context statistics functions

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Visit `http://localhost:3000` and start taking notes!

### Database Schema

The application uses several key tables:
- **notes**: Stores user notes with content, contexts, tags, and AI embeddings
- **Vector embeddings**: OpenAI embeddings for semantic search
- **RPC functions**: Custom functions for similarity search and context statistics

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `OPENAI_API_KEY`: OpenAI API key for AI features (Q&A, embeddings, suggestions)

## Architecture

Hathi is built with modern web technologies:

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **AI**: OpenAI API for embeddings, completions, and Q&A
- **State**: Redux Toolkit with optimistic updates
- **Components**: shadcn/ui component library
- **Deployment**: Vercel (recommended)

## Feedback and issues

Please file feedback and issues in this repository's issue tracker.

## License

This project is open source and available under the [MIT License](LICENSE).
