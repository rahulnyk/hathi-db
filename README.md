<<<<<<< HEAD
<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Hathi - AI-Powered Note-Taking with Supabase and Next.js" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Hathi - AI-Powered Note-Taking App</h1>
</a>

<p align="center">
 An intelligent note-taking application with AI-powered Q&A built with Next.js and Supabase
=======
# Hathi

<h1 align="center">🐘 Hathi - Your AI-Powered Second Brain</h1>

<p align="center">
  A smart journaling and note-taking application that helps you organize your thoughts, ideas, and knowledge with AI assistance.
>>>>>>> main
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
<<<<<<< HEAD
  <a href="#ai-qa-feature"><strong>AI Q&A Feature</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
=======
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
>>>>>>> main
</p>

## Features

<<<<<<< HEAD
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

1. **Ask Questions**: In any note input field, start your message with `/q` followed by your question
   ```
   /q What did I discuss in my team meetings last week?
   /q Summarize my project notes
   /q What are the key points from my research on AI?
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
=======
### 🚀 Core Functionality
>>>>>>> main

-   **Smart Journaling**: Create and organize notes with context-based categorization
-   **AI Integration**: Powered by OpenAI for intelligent note suggestions and insights
-   **Context Management**: Organize notes by contexts with pagination and search
-   **Real-time Sync**: All data synced in real-time with Supabase
-   **Performance Monitoring**: Built-in performance logging and optimization

### 🔐 Authentication & Security

-   **Secure Authentication**: Complete auth flow with Supabase (login, signup, password reset)
-   **Row Level Security**: Data isolation per user with RLS policies
-   **Protected Routes**: Auth-gated journal functionality

### 🎨 User Experience

-   **Modern UI**: Built with shadcn/ui components and Tailwind CSS
-   **Dark/Light Mode**: Theme switching with next-themes
-   **Responsive Design**: Works seamlessly across desktop and mobile
-   **Type Safety**: Full TypeScript implementation
-   **State Management**: Redux Toolkit for predictable state updates

### 📝 Advanced Note Features

-   **Rich Text Support**: Markdown rendering with custom plugins
-   **Hashtag Support**: Auto-detection and linking of hashtags
-   **Context Linking**: Smart context detection and suggestions
-   **Note Types**: Support for different note categories
-   **Search & Filter**: Advanced search capabilities across notes and contexts

## Tech Stack

-   **Frontend**: Next.js 15 with App Router, React 19
-   **Backend**: Supabase (PostgreSQL, Auth, Real-time)
-   **AI**: OpenAI API integration
-   **Styling**: Tailwind CSS, shadcn/ui components
-   **State Management**: Redux Toolkit
-   **Database**: PostgreSQL with custom functions and triggers
-   **Authentication**: Supabase Auth with SSR
-   **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

<<<<<<< HEAD
3. You will also need an OPEN AI API Key OPENAI_API_KEY for the AI features
=======
-   Node.js 18+
-   A [Supabase](https://supabase.com) account and project
-   An [OpenAI API](https://platform.openai.com) key
>>>>>>> main

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hathi-3
```

### 2. Install Dependencies

<<<<<<< HEAD
5. Install dependencies:

   ```bash
   yarn install
   ```

6. **Important**: Run database migrations to set up the schema and AI features:

   ```bash
   yarn migrate
   ```

   This will create:
   - Notes table with embedding support
   - Context and tags functionality  
   - Semantic search functions for AI Q&A
   - User context statistics functions

7. Start the development server:

   ```bash
   yarn dev
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
=======
```bash
yarn install
```

### 3. Set Up Environment Variables

1. Copy the environment example file:

    ```bash
    cp .env.example .env.local
    ```

2. Update `.env.local` with your credentials:
>>>>>>> main

    ```bash
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

<<<<<<< HEAD
Please file feedback and issues in this repository's issue tracker.

## License

This project is open source and available under the [MIT License](LICENSE).
=======
    # OpenAI Configuration
    OPENAI_API_KEY=your-openai-api-key

    # Optional: Performance Logging
    LOG_PERF_TO_CSV=false
    ```

    You can find your Supabase credentials in your [project's API settings](https://supabase.com/dashboard/project/_/settings/api).

### 4. Set Up the Database

Run the database migrations to set up the required tables and functions:

```bash
yarn migrate
```

This will create:

-   Notes table with RLS policies
-   Context and tags support
-   User statistics functions
-   Embedding support for AI features
-   Pagination functions

### 5. Start the Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Development

### Available Scripts

-   `yarn dev` - Start development server with Turbopack
-   `yarn build` - Build for production
-   `yarn start` - Start production server
-   `yarn lint` - Run ESLint
-   `yarn migrate` - Run database migrations
-   `yarn migrate:create` - Create a new migration
-   `yarn migrate:reset` - Reset database and run all migrations

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions
│   ├── auth/              # Authentication pages
│   ├── journal/           # Main journal interface
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Auth-related components
│   ├── journal/           # Journal components
│   ├── menu/              # Navigation components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── ai/                # AI integration
│   ├── prompts/           # AI prompts
│   └── supabase/          # Supabase configuration
├── migrations/            # Database migrations
├── store/                 # Redux store and slices
└── scripts/               # Build and deployment scripts
```

### Key Features Implementation

#### Context Management

The app organizes notes by "contexts" - thematic categories that group related notes. Contexts have statistics showing note counts and are paginated for performance.

#### AI Integration

-   Smart context suggestions based on note content
-   Note embeddings for semantic search
-   AI-powered insights and recommendations

#### Performance Optimization

-   Redux Toolkit for efficient state management
-   Pagination for large datasets
-   Performance logging to CSV for monitoring
-   Optimized database queries with proper indexing

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Connect your repository to [Vercel](https://vercel.com)
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
OPENAI_API_KEY=your-openai-api-key
```

### Database Setup for Production

1. Run migrations on your production Supabase instance
2. Ensure RLS policies are enabled
3. Verify user authentication flows

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js, Supabase, and OpenAI
>>>>>>> main
