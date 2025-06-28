# Q&A Feature with Semantic Search

## Overview
The Q&A feature allows users to ask questions about their notes and get intelligent answers using semantic search and AI.

## How it Works

### 1. **Semantic Search Pipeline**
1. User asks a question in the Q&A interface
2. Generate embedding for the question using OpenAI
3. Search user's notes using vector similarity (cosine distance)
4. Retrieve most relevant notes based on semantic similarity
5. Feed relevant notes to LLM with the question for answer generation

### 2. **Fallback Mechanisms**
- **Embedding Generation Fails**: Falls back to keyword-based search
- **No Semantic Results**: Tries lower similarity threshold (0.5 instead of 0.7)
- **Still No Results**: Falls back to keyword search or recent notes
- **No Keywords**: Returns recent notes for context

### 3. **Search Strategy**
```typescript
// Primary: Semantic similarity search
similarity_threshold: 0.7 (primary)
similarity_threshold: 0.5 (fallback)

// Fallback: PostgreSQL full-text search
textSearch('content', keywords, { type: 'websearch' })

// Last resort: Recent notes
order by created_at DESC limit 20
```

## Components

### **Database Function**
- `search_notes_by_similarity()`: PostgreSQL function for vector similarity search
- Uses `embedding <=> query_embedding` (cosine distance)
- Returns notes with similarity scores

### **Server Action**
- `answerQuestion()`: Main Q&A server action
- Handles authentication, search, and AI generation
- Multiple fallback strategies for robustness

### **UI Components**
- `QAInterface`: Main chat-like interface
- Modal overlay that doesn't interfere with note-taking
- Toggle between note mode and Q&A mode

### **AI Integration**
- Uses existing OpenAI provider
- Generates embeddings for semantic search
- Custom Q&A prompts for better answers
- Includes user's contexts for better understanding

## Usage Examples

**Good Questions:**
- "Summarize my ideas about the mobile app project"
- "What did I learn about React performance?"
- "Show me my thoughts on the marketing strategy"

**Features:**
- References specific notes by date/context
- Synthesizes information from multiple notes
- Graceful degradation when semantic search unavailable
- Real-time conversational interface

## Technical Benefits

1. **Semantic Understanding**: Finds relevant notes even without exact keyword matches
2. **Robust Fallbacks**: Always provides answers even if semantic search fails
3. **Isolated Implementation**: Doesn't affect existing note-taking functionality
4. **Scalable**: Uses efficient vector search with similarity thresholds
5. **User Context Aware**: Leverages user's existing contexts for better answers
