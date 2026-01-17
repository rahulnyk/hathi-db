# Hathi

<h1 align="center">🐘 Hathi - Your AI-Powered Second Brain</h1>

<p align="center">
  <strong>Local-first, AI-powered note-taking that eliminates the friction of organization.</strong><br/>
  Dump your thoughts freely. Let AI handle the structure, context, and retrieval.
</p>

<p align="center">
  <a href="#why-hathi"><strong>Why Hathi?</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#setup"><strong>Setup</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a>
</p>

---

## Why Hathi?

Hathi is built on a simple philosophy: **your thoughts shouldn't wait for perfect organization**.

### 🌐 Local-First, No Cloud Required

-   **100% local storage** - Your notes never leave your machine
-   **No subscriptions, no servers** - Complete data ownership
-   **Offline-first** - Works entirely without internet (except for AI features)
-   **Privacy-focused** - Your thoughts remain private

### 🧠 AI-First Note Taking

Stop worrying about:

-   ❌ Perfect grammar and formatting
-   ❌ Organizing notes into folders
-   ❌ Remembering where you saved something
-   ❌ Structuring your thoughts before writing

Start focusing on:

-   ✅ **Capturing ideas instantly** as they come
-   ✅ **Natural language** - write however you think
-   ✅ **Automatic organization** - AI tags and categorizes for you
-   ✅ **Effortless retrieval** - just ask Hathi

### 🎯 The Hathi Workflow

1. **Dump** - Write anything, anywhere. No formatting needed.
2. **Let AI structure** - Automatically fixes grammar, adds context, identifies TODOs
3. **Ask when needed** - "What should I remember about John?" or "Get me started for today"
4. **Never search again** - Your AI agent finds what you need

---

## Features

### 📝 Note-Taking Without Friction

#### Contexts: Automatic Organization

Contexts are Hathi's way of organizing notes without manual folder management.

-   **What are contexts?** - Think of them as intelligent tags that group related notes
-   **How to use them?** - Simply wrap any word in double square brackets: `[[meeting]]`, `[[project-alpha]]`
-   **Automatic tagging** - AI suggests relevant contexts as you write
-   **No drilling required** - Related notes are automatically linked
-   **Context editing** - Rename contexts anytime; all notes update automatically

**Why contexts work:** Instead of "Where should I save this?", just write `[[work]]` or `[[ideas]]` and it's organized.

#### Journal: Every Day is a Context

The journal page treats every date as a context, perfect for daily notes.

-   **Today button** - Instantly jump to today's journal (keyboard shortcut friendly)
-   **Date navigation** - Browse past and future dates with ease
-   **Date contexts** - Each date (e.g., `[[2026-01-17]]`) is automatically a context
-   **Timeline view** - See your day-by-day thought progression

**Pro tip:** Write meeting notes on their date, then reference them with `[[2026-01-17]]` from anywhere.

#### Smart Editor Features

-   **Markdown support** - Format text with standard Markdown syntax
-   **Auto-closing brackets** - Type `[[` and get `]]` automatically positioned
-   **Context suggestions** - Start typing `[[proj` to see matching contexts
-   **Real-time auto-save** - Never lose your work, every keystroke is saved

### 🤖 AI-Powered Intelligence

#### Automatic Structuring

Write messy, think freely. AI cleans it up:

```
Before: "remember buy milk also finish report tomorrow john meeting 3pm"
After: "Remember to buy milk. Also finish report by tomorrow. John meeting at 3pm."
```

Fixes grammar, adds punctuation, and preserves your meaning.

#### Intelligent TODO Detection

Automatically detects action items and extracts due dates from natural language like "tomorrow" or "next Friday". Examples:

-   "need to call Sarah about the project"
-   "don't forget meeting at 3pm tomorrow"
-   "review the budget before Friday"

#### Smart Context Tagging

AI suggests relevant contexts based on your note content and existing contexts.

### 🔍 AI Agent: Your Information Retriever

Ask questions naturally and the agent finds relevant notes using semantic search, context filtering, and date ranges. View and edit source notes directly in the chat.

#### Example Queries

-   "Get me started for today" - Surfaces relevant TODOs
-   "What should I remember before meeting John?" - Pulls related notes with a quick summary
-   "Show me ideas about the product launch" - Semantic search
-   "What was decided in last week's meeting?" - Date + context filtering
-   "Find notes about authentication" - Conceptual similarity

**Conversational**: Ask follow-up questions to dig deeper. The agent remembers context throughout the conversation.

---

## Tech Stack

### Core Technologies

-   **Frontend**: Next.js 15 (App Router) + React 19
-   **Language**: TypeScript (full type safety)
-   **Styling**: Tailwind CSS + shadcn/ui components
-   **State Management**: Redux Toolkit with redux-persist
-   **Database ORM**: Drizzle ORM
-   **Agent**: Vercel AI SDK

### Database Architecture

Hathi uses **SQLite** as the primary database (PostgreSQL support exists but is optional).

#### SQLite Schema

**Notes Table** (`notes`):

-   `id` (TEXT) - UUID primary key
-   `content` (TEXT) - Note content
-   `key_context` (TEXT) - Primary context for the note
-   `tags` (TEXT) - JSON array of tags
-   `suggested_contexts` (TEXT) - AI-suggested contexts
-   `note_type` (TEXT) - Type: 'note', 'todo', etc.
-   `embedding` (TEXT) - JSON array (768-dim vector for semantic search)
-   `embedding_model` (TEXT) - Model used for embedding
-   `deadline` (INTEGER) - Unix timestamp for TODOs
-   `status` (TEXT) - TODO status tracking
-   `created_at`, `updated_at` (INTEGER) - Timestamps

**Contexts Table** (`contexts`):

-   `id` (TEXT) - UUID primary key
-   `name` (TEXT) - Unique context name
-   `created_at`, `updated_at` (INTEGER) - Timestamps

**Notes-Contexts Junction** (`notes_contexts`):

-   Many-to-many relationship between notes and contexts
-   Enables notes to belong to multiple contexts

#### Vector Search

-   **sqlite-vec extension** - Efficient vector similarity search
-   **768-dimensional embeddings** - Using multilingual-e5-base model
-   **Local embeddings** - Runs entirely on your machine (HuggingFace Transformers)

### AI Configuration

Flexible AI provider system configurable from the UI:

-   **Text Generation**: Google Gemini (configurable model)

    -   Default: `gemini-2.5-flash`
    -   Lightweight tasks: `gemini-2.0-flash-lite`
    -   Agent operations: `gemini-2.5-flash`

-   **Embeddings**: HuggingFace (local) or Gemini (remote)
    -   Default: `intfloat/multilingual-e5-base` (768 dimensions, local)
    -   Alternative: `gemini-embedding-exp-03-07` (1536 dimensions, API)

**Configure AI from UI** - No need to edit config files manually! Access AI settings directly from the application interface.

---

## Setup

### Prerequisites

-   **Node.js 18+** (18.17.0 or higher recommended)
-   **Yarn** package manager
-   _Optional_: Google AI API key (for Gemini models)

### Quick Start with `start.sh`

Hathi includes an automated setup script that handles everything:

```bash
chmod +x start.sh
./start.sh
```

**That's it!** The script handles:

-   ✅ Node.js installation (if needed)
-   ✅ Dependency installation
-   ✅ Environment configuration
-   ✅ SQLite database setup
-   ✅ Embedding model download (local, no API needed)
-   ✅ Application launch

Visit [http://localhost:3000](http://localhost:3000) and configure your AI models from the UI.

### Manual Setup (Alternative)

If you prefer manual control:

#### 1. Install Dependencies

```bash
yarn install
```

#### 2. Configure Environment

Create `.env.local`:

```bash
# Database Configuration (SQLite - local file)
USE_DB=sqlite

# Google AI Configuration (Optional - configure from UI)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# AI Provider Configuration
AI_PROVIDER=GEMINI                    # LLM provider
EMBEDDING_PROVIDER=HUGGINGFACE        # Embedding provider (local, no API)
EMBEDDINGS_DIMS=768                   # Vector dimensions

# AI Model Configuration (Optional - uses defaults)
GEMINI_TEXT_GENERATION_MODEL=gemini-2.5-flash
GEMINI_TEXT_GENERATION_LITE_MODEL=gemini-2.0-flash-lite
GEMINI_AGENT_MODEL=gemini-2.5-flash
HUGGINGFACE_EMBEDDING_MODEL=intfloat/multilingual-e5-base

# Optional: Performance Logging
LOG_PERF_TO_CSV=false

# Optional: Development Settings
NEXT_PUBLIC_DISPLAY_TOOL_INFO=false  # Show AI tool execution info
```

Get your Google AI API key from [Google AI Studio](https://aistudio.google.com/) or configure it from the app UI.

#### 3. Setup SQLite Database

```bash
# Run migrations to create tables
yarn db:sqlite:migrate

# Optional: Seed with sample data
yarn db:sqlite:seed
```

#### 4. Download Embedding Model (Optional)

For local embeddings without API calls:

```bash
yarn model:download
```

This downloads the HuggingFace model for offline use.

#### 5. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### AI Configuration

**Configure from UI (Recommended):** Access AI settings directly in the application to set your Google AI API key and select models—no need to edit files!

**Environment Variables (Alternative):**

-   Set `GOOGLE_AI_API_KEY` for Gemini models
-   Configure specific models with `GEMINI_*_MODEL` variables
-   Use `EMBEDDING_PROVIDER=HUGGINGFACE` for local embeddings (no API key needed)

---

## Usage

### Creating Your First Note

1. **Open the app** at [http://localhost:3000](http://localhost:3000)
2. **Start typing** - No signup, no setup, just write
3. **Add context** - Type `[[project-name]]` to categorize
4. **Let AI help** - Grammar, structure, and TODOs handled automatically

### Using the Journal

1. **Click "Today"** button to jump to today's date
2. **Write daily notes** - Each date is a context automatically
3. **Navigate dates** - Use date picker to browse past/future entries
4. **Reference dates** - Link to specific days with `[[2026-01-17]]`

### Working with Contexts

```
# Creating contexts (automatic)
[[work]] [[meeting]] [[ideas]]

# Context suggestions (as you type)
Type "[[proj..." → See matching contexts

# Multiple contexts per note
[[project-alpha]] [[urgent]] [[client-meetings]]
```

### Using the AI Agent

Open the chat panel and try:

**Daily Planning:**

-   "Get me started for today"
-   "What are my pending tasks?"
-   "What's on my agenda?"

**Information Retrieval:**

-   "What should I remember about John?"
-   "Show me recent notes about the product launch"
-   "What was discussed in yesterday's meeting?"

**Date-based Queries:**

-   "What did I write last week?"
-   "Show me notes from January"
-   "What happened on [[2026-01-15]]?"

**Context Filtering:**

-   "All notes about [[project-alpha]]"
-   "Work-related TODOs"
-   "Show me urgent tasks"

### Editing Notes

-   **In Journal**: Click any note to edit inline
-   **In Agent Chat**: Click source notes to edit directly
-   **Auto-save**: Changes save automatically as you type
-   **Context updates**: Edit context names; all notes update

---

## Development

### Available Scripts

#### Development

-   `yarn dev` - Start development server with Turbopack
-   `yarn build` - Build for production
-   `yarn start` - Start production server
-   `yarn lint` - Run ESLint
-   `yarn test` - Run tests with Jest
-   `yarn test:watch` - Run tests in watch mode

#### SQLite Database (Primary)

-   `yarn db:sqlite:migrate` - Run SQLite migrations
-   `yarn db:sqlite:reset` - Reset SQLite database and run all migrations
-   `yarn db:sqlite:seed` - Seed SQLite with sample data
-   `yarn db:sqlite:fresh` - Truncate and reseed database
-   `yarn db:sqlite:tables` - List all tables
-   `yarn db:sqlite:schema` - Show database schema
-   `yarn db:sqlite:data` - View table data
-   `yarn db:sqlite:overview` - Show database overview

#### AI Configuration

-   `yarn validate-config` - Validate AI configuration
-   `yarn model:download` - Download local embedding model

### Project Structure

```
hathi-db/
├── app/                        # Next.js App Router
│   ├── actions/               # Server actions
│   │   ├── ai.ts             # AI operations (structurize, suggest contexts)
│   │   ├── notes.ts          # Note CRUD operations
│   │   └── contexts.ts       # Context management
│   ├── agent_tools/          # AI Agent tools
│   │   ├── filter-notes.ts   # Advanced note filtering
│   │   ├── semantic-search.ts # Vector similarity search
│   │   └── summarize-notes.ts # Note summarization
│   ├── api/chat/             # Chat API endpoint
│   └── journal/              # Journal page routes
├── components/
│   ├── journal/              # Journal components
│   │   ├── editor/           # Note editor with plugins
│   │   ├── note_card/        # Note display components
│   │   └── date-context-picker.tsx
│   ├── chat/                 # AI agent chat interface
│   └── ui/                   # shadcn/ui components
├── db/
│   ├── sqlite/               # SQLite implementation
│   │   ├── schema.ts        # Database schema
│   │   ├── adapter.ts       # Database operations
│   │   └── migrate-runner.ts
│   ├── postgres/             # PostgreSQL (optional)
│   └── types.ts              # Shared types
├── lib/
│   ├── ai/                   # AI service layer
│   │   ├── gemini.ts        # Gemini LLM integration
│   │   ├── huggingface-embedding.ts # Local embeddings
│   │   └── ai-config.ts     # Configuration management
│   ├── prompts/              # AI prompts
│   ├── noteUtils.ts          # Note manipulation utilities
│   ├── date-utils.ts         # Date formatting
│   └── bracketMatchUtils.ts  # Context bracket handling
├── store/                    # Redux state management
│   ├── notesSlice.ts        # Notes state
│   ├── journalSlice.ts      # Journal state
│   ├── agentSlice.ts        # Agent state
│   └── middleware/          # Persistence middleware
├── hooks/                    # Custom React hooks
├── scripts/
│   ├── download-model.js    # HuggingFace model downloader
│   └── validate-config.ts   # Config validation
└── start.sh                 # Automated setup script
```

### Key Concepts

#### Database Architecture

Hathi uses **SQLite with sqlite-vec** for local storage:

-   **Notes table**: Stores note content, metadata, embeddings
-   **Contexts table**: Manages context definitions
-   **Notes-Contexts junction**: Many-to-many relationships
-   **Vector embeddings**: 768-dimensional vectors stored as JSON
-   **Semantic search**: Using cosine similarity on embeddings

#### AI Pipeline

1. **Note Creation** → Extract contexts with `[[...]]` regex
2. **AI Processing** → Suggest contexts, detect TODOs, extract deadlines
3. **Structurization** (optional) → Clean up grammar and formatting
4. **Embedding Generation** → Create 768-dim vector (local)
5. **Storage** → Save to SQLite with all metadata

#### Agent System

The AI agent uses multiple tools to answer queries:

-   **filter_notes**: Advanced filtering (date, context, type, content)
-   **semantic_search**: Vector similarity search
-   **summarize_notes**: Summarize note collections
-   **get_filter_options**: Discover available contexts/tags

Tools are orchestrated by Gemini with the Vercel AI SDK.

### Development Tips

#### Debugging AI Operations

Enable tool info display:

```bash
# In .env.local
NEXT_PUBLIC_DISPLAY_TOOL_INFO=true
```

Or toggle in browser console:

```javascript
window.toggleToolInfo();
```

#### Testing Database Operations

```bash
# Reset and seed database
yarn db:sqlite:fresh

# Inspect database
yarn db:sqlite:overview
yarn db:sqlite:schema
```

#### Performance Monitoring

Enable CSV logging:

```bash
# In .env.local
LOG_PERF_TO_CSV=true
```

Check `performance_log.csv` for operation timings.

---

## Architecture Decisions

**Local-First**: Privacy, speed, ownership, and offline capability (except AI features).

**SQLite**: Embedded, portable, fast, with native vector search via sqlite-vec. Zero configuration.

**AI-First**: Traditional note-taking requires upfront organization and manual search. Hathi inverts this—write freely, AI organizes automatically, and your agent retrieves information naturally.

---

## FAQ

### Do I need an API key?

**For basic use: No.** Local embeddings work without any API.

**For AI features: Yes.** You need a Google AI API key for:

-   Context suggestions
-   Note structurization
-   TODO detection
-   AI agent chat

Configure it from the UI or set `GOOGLE_AI_API_KEY` in `.env.local`.

### Is my data private?

**Yes, completely.** All notes are stored in a local SQLite file on your machine. Nothing is sent to any cloud service except:

-   AI API calls (if you enable AI features)
-   These only send note content for processing, not the entire database

### Can I use it offline?

**Mostly yes.** You can create, edit, browse, and search notes offline with local embeddings. Internet is only needed for AI features (structurization, context suggestions, agent queries).

### How accurate is TODO detection?

Very accurate. The system recognizes:

-   Explicit keywords: "todo", "remember", "don't forget"
-   Action verbs: "call", "email", "buy", "finish"
-   Checkbox formats: `[ ]`, `- [ ]`, `* [ ]`
-   Temporal phrases: "tomorrow", "next week", "by Friday"

Due dates are automatically extracted from natural language.

### Can I export my data?

Your data is already in an open format:

-   **Database**: SQLite file at `local.db` (use any SQLite browser)
-   **Format**: Standard SQL schema, easy to export
-   **No lock-in**: Simple migration to other systems

### How do I backup my notes?

Simply backup the `local.db` file (SQLite database). You can:

-   Copy it to cloud storage
-   Version control with git
-   Use any backup solution

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

-   Use TypeScript for type safety
-   Use Yarn (not npm or pnpm)
-   Follow existing code structure
-   Add tests for new features
-   Update documentation as needed

---

## License

This project is licensed under the **MIT License**.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

See the [LICENSE](LICENSE) file for full details.

---

## Acknowledgments

-   **Next.js** - React framework
-   **Vercel AI SDK** - AI integration
-   **Drizzle ORM** - Type-safe database
-   **shadcn/ui** - UI components
-   **sqlite-vec** - Vector search in SQLite
-   **HuggingFace Transformers** - Local embeddings
-   **Google Gemini** - LLM capabilities

---

<p align="center">
  Made with ❤️ for better note-taking
</p>
