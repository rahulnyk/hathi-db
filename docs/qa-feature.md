# Q&A Feature with Semantic Search

## Overview
The Q&A feature allows users to ask questions about their notes and get intelligent answers using semantic search and AI. Questions are asked inline using the `/q` command and answers appear as special notes in the timeline.

## How it Works

### 1. **Inline Q&A Workflow**
1. User types `/q [question]` in the note editor
2. Generate embedding for the question using Google Gemini
3. Search user's notes using vector similarity (cosine distance)
4. Retrieve most relevant notes based on semantic similarity
5. Feed relevant notes to LLM with the question for answer generation
6. Display answer as a special "ai-note" in the timeline with source links

### 2. **Fallback Mechanisms**
- **Embedding Generation Fails**: Falls back to keyword-based search
- **No Semantic Results**: Tries lower similarity threshold (0.5 instead of 0.7)
- **Still No Results**: Falls back to keyword search or recent notes
- **No Keywords**: Returns recent notes for context

### 3. **Search Strategy**
```typescript
// Configurable limits (see lib/constants/qa.ts)
DEFAULT_SEARCH_LIMIT: 15  // Notes sent to AI for context
MAX_USER_NOTES: 50        // Notes fetched for fallback search

// Primary: Semantic similarity search
similarity_threshold: 0.7 (primary)
similarity_threshold: 0.5 (fallback)

// Fallback: PostgreSQL full-text search
textSearch('content', keywords, { type: 'websearch' })

// Last resort: Recent notes
order by created_at DESC
```

## Components

### **Database Function**
- `search_notes_by_similarity()`: PostgreSQL function for vector similarity search
- Uses `embedding <=> query_embedding` (cosine distance)
- Returns notes with similarity scores

### **Server Action**
- `answerQuestion()`: Main Q&A server action in `/app/actions/qa.ts`
- Handles authentication, search, and AI generation
- Multiple fallback strategies for robustness
- Returns answers with source note references

### **UI Integration**
- **Inline Command**: `/q` command in the note editor
- **AI Answers**: Special "ai-note" type notes with blue highlighting
- **Source Links**: Clickable references to source notes
- **AI Slice**: Dedicated Redux slice for tracking Q&A state

### **AI Integration**
- Uses existing Google Gemini provider
- Generates embeddings for semantic search
- Custom Q&A prompts optimized for clean answers (no note IDs in response)
- Includes user's contexts for better understanding
- Source note tracking and clickable references

## Usage Examples

**How to Ask Questions:**
```
/q Summarize my ideas about the mobile app project
/q What did I learn about React performance?
/q What are my follow-up items?
/q Show me my thoughts on the marketing strategy
```

**Features:**
- **Inline Integration**: Ask questions directly in the note editor
- **Source Traceability**: Clickable links to source notes
- **Visual Distinction**: AI answers highlighted in blue
- **Semantic Search**: Finds relevant notes without exact keyword matches
- **Robust Fallbacks**: Always provides answers even if semantic search fails
- **Timeline Integration**: Q&A becomes part of your note timeline

## Technical Benefits

1. **Semantic Understanding**: Finds relevant notes even without exact keyword matches
2. **Robust Fallbacks**: Always provides answers even if semantic search fails
3. **Integrated Workflow**: Q&A is part of the note-taking flow, not separate
4. **Scalable**: Uses efficient vector search with configurable limits
5. **User Context Aware**: Leverages user's existing contexts for better answers
6. **Source Transparency**: Clear traceability back to source notes
