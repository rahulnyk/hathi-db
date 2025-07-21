# Hathi

<h1 align="center">🐘 Hathi - Your AI-Powered Second Brain</h1>

<p align="center">
  A smart journaling and note-taking application that helps you organize your thoughts, ideas, and knowledge with AI assistance.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
</p>

## Features

### 🚀 Core Functionality

-   **Smart Journaling**: Create and organize notes with context-based categorization
-   **AI Integration**: Powered by Google Gemini for intelligent note suggestions and insights
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
-   **AI Chat Integration**: Chat agent with powerful note filtering tools
-   **Smart Note Discovery**: Filter by date, context, hashtags, content, and note type

## Tech Stack

-   **Frontend**: Next.js 15 with App Router, React 19
-   **Backend**: Supabase (PostgreSQL, Auth, Real-time)
-   **AI**: Google Gemini API integration (flash-2.5 model)
-   **Styling**: Tailwind CSS, shadcn/ui components
-   **State Management**: Redux Toolkit
-   **Database**: PostgreSQL with custom functions and triggers
-   **Authentication**: Supabase Auth with SSR
-   **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

-   Node.js 18+
-   A [Supabase](https://supabase.com) account and project
-   A [Google AI](https://aistudio.google.com/) API key

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hathi-3
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Environment Variables

1. Copy the environment example file:

    ```bash
    cp .env.example .env.local
    ```

2. Update `.env.local` with your credentials:

    ```bash
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

    # Google AI Configuration
    GOOGLE_AI_API_KEY=your-google-ai-api-key

    # Optional: Performance Logging
    LOG_PERF_TO_CSV=false
    ```

    You can find your Supabase credentials in your [project's API settings](https://supabase.com/dashboard/project/_/settings/api).
    You can get your Google AI API key from [Google AI Studio](https://aistudio.google.com/).

### 4. Set Up the Database

Run the database migrations to set up the required tables and functions:

```bash
yarn migrate
```

This will create:

-   Notes table with RLS policies
-   Context and tags support
-   User statistics functions
-   Embedding support for AI features (1536-dimensional vectors for Google gemini-embedding-exp-03-07)
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
GOOGLE_AI_API_KEY=your-google-ai-api-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

> **Note**: `NEXT_PUBLIC_SITE_URL` is required for proper email confirmation and password reset redirects in production. Without this, users may receive emails with localhost URLs instead of your production domain.

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

Built with ❤️ using Next.js, Supabase, and Google AI
