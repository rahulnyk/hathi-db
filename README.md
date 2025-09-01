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
-   **Local Database**: PostgreSQL with pgvector for semantic search
-   **Performance Monitoring**: Built-in performance logging and optimization

### 🔐 Database & Performance

-   **Dual Database Support**: Choose between PostgreSQL (production) or SQLite (embedded)
-   **Environment Switching**: Switch databases with `USE_DB=postgres|sqlite` environment variable
-   **PostgreSQL**: Full-featured with pgvector extension for production deployments
-   **SQLite + sqlite-vec**: Lightweight embedded option with vector search capabilities
-   **Drizzle ORM**: Type-safe database operations across both backends
-   **Vector Search**: Semantic similarity search with embeddings (both databases)
-   **Performance Monitoring**: Built-in performance logging and optimization

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
-   **Backend**: PostgreSQL with Drizzle ORM
-   **AI**: Google Gemini API integration (flash-2.5 model)
-   **Styling**: Tailwind CSS, shadcn/ui components
-   **State Management**: Redux Toolkit
-   **Database**: PostgreSQL with custom functions and triggers
-   **Vector Search**: pgvector extension for semantic similarity
-   **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

-   Node.js 18+
-   Docker and Docker Compose (for local PostgreSQL)
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
    # PostgreSQL Configuration (defaults work with Docker setup)
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=hathi-db-123!
    POSTGRES_DB=hathi_db

    # Google AI Configuration
    GOOGLE_AI_API_KEY=your-google-ai-api-key

    # Optional: Performance Logging
    LOG_PERF_TO_CSV=false

    # Optional: Development Settings
    NEXT_PUBLIC_DISPLAY_TOOL_INFO=false  # Set to true to show AI tool execution info in chat
    ```

    You can get your Google AI API key from [Google AI Studio](https://aistudio.google.com/).

### 4. Choose Your Database Backend

Hathi supports two database options. Choose one based on your needs:

#### Option A: SQLite (Embedded - Recommended for Development/Personal Use)

SQLite provides a lightweight, embedded database perfect for development, personal use, or standalone deployments.

```bash
# Set SQLite as your database
echo "USE_DB=sqlite" >> .env.local

# Run SQLite migrations and seed with sample data
USE_DB=sqlite yarn db:sqlite:migrate
USE_DB=sqlite yarn db:sqlite:seed
```

#### Option B: PostgreSQL (Recommended for Production)

PostgreSQL provides a full-featured database with advanced capabilities, ideal for production deployments.

```bash
# Start PostgreSQL using Docker
cd docker
docker-compose up -d

# Set PostgreSQL as your database (default)
echo "USE_DB=postgres" >> .env.local

# Run PostgreSQL migrations and seed with sample data
yarn db:migrate
yarn db:seed
```

### 5. Start the Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Development

### Available Scripts

#### General

-   `yarn dev` - Start development server with Turbopack
-   `yarn build` - Build for production
-   `yarn start` - Start production server
-   `yarn lint` - Run ESLint

#### PostgreSQL Database

-   `yarn db:migrate` - Run PostgreSQL migrations
-   `yarn db:reset` - Reset PostgreSQL database and run all migrations
-   `yarn db:seed` - Seed PostgreSQL with sample data
-   `yarn db:tables` - List all PostgreSQL tables
-   `yarn db:data <table>` - View data from a specific PostgreSQL table

#### SQLite Database

-   `yarn db:sqlite:migrate` - Run SQLite migrations
-   `yarn db:sqlite:reset` - Reset SQLite database and run all migrations
-   `yarn db:sqlite:seed` - Seed SQLite with sample data
-   `yarn db:sqlite:test` - Test SQLite connection
-   `yarn db:sqlite:fresh` - Truncate and reseed SQLite database

#### Environment Switching

```bash
# Use SQLite (embedded)
USE_DB=sqlite yarn dev

# Use PostgreSQL (production)
USE_DB=postgres yarn dev  # or just yarn dev (default)
```

### Development Tools

#### AI Tool Debugging

To see AI tool execution information in the chat interface during development:

1. Set `NEXT_PUBLIC_DISPLAY_TOOL_INFO=true` in your `.env.local` file, or
2. Open browser console and call `window.toggleToolInfo()` to toggle on/off

This will show detailed information about AI tool calls and their results.

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions for database
│   ├── chat/              # AI chat interface
│   ├── journal/           # Main journal interface
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── chat/              # Chat-related components
│   ├── journal/           # Journal components
│   ├── menu/              # Navigation components
│   └── ui/                # shadcn/ui components
├── db/                    # Database configuration
│   ├── migrate/           # Migration files
│   ├── connection.ts      # Database connection
│   └── schema.ts          # Drizzle schema
├── docker/                # Docker configuration
│   ├── docker-compose.yml # PostgreSQL setup
│   └── Dockerfile.postgres # Custom PostgreSQL image
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── ai/                # AI integration
│   └── prompts/           # AI prompts
├── store/                 # Redux store and slices
├── tests/                 # Test files
└── scripts/               # Build and utility scripts
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
# PostgreSQL Database Configuration
POSTGRES_HOST=your-production-postgres-host
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=hathi_db

# Google AI API for embeddings
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Site configuration
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

> **Note**: `NEXT_PUBLIC_SITE_URL` is required for proper URL generation in production environments.

### Database Setup for Production

1. Set up a PostgreSQL instance with pgvector extension
2. Run migrations using `yarn db:migrate`
3. Seed initial data if needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js, PostgreSQL, and Google AI
