# AI Service Configuration

This document explains the configurable AI system for LLM and embedding services.

## Overview

The AI configuration system supports:

1. **LLM Configuration** (`getAIConfig()`) - For text generation services
2. **Embedding Configuration** (`getEmbeddingConfig()`) - For embedding services
3. **Environment-based Model Selection** - All models are configurable via environment variables

## Model Configuration

All AI models are now configurable through environment variables, allowing you to easily switch between different models without code changes.

### LLM Model Environment Variables

```bash
# Gemini Text Generation Models
GEMINI_TEXT_GENERATION_MODEL=gemini-2.5-flash           # Main text generation
GEMINI_TEXT_GENERATION_LITE_MODEL=gemini-2.0-flash-lite # Lightweight tasks
GEMINI_AGENT_MODEL=gemini-2.5-flash                     # AI agent operations
```

### Embedding Model Environment Variables

```bash
# Gemini Embeddings
GEMINI_EMBEDDING_MODEL=gemini-embedding-exp-03-07

# HuggingFace Local Embeddings
HUGGINGFACE_EMBEDDING_MODEL=intfloat/multilingual-e5-base
```

## Configuration Functions

### `getAIConfig()` - LLM Configuration

Returns configurations for text generation services including:

-   `textGeneration` - Main text generation model (configurable via `GEMINI_TEXT_GENERATION_MODEL`)
-   `textGenerationLite` - Lighter model for simple tasks (configurable via `GEMINI_TEXT_GENERATION_LITE_MODEL`)
-   `agentModel` - Model for agent operations (configurable via `GEMINI_AGENT_MODEL`)
-   `provider` - API credentials and endpoints

### `getEmbeddingConfig()` - Embedding Configuration

Returns configurations specific to embedding services including:

-   `embedding` - Model name and dimensions (configurable via `GEMINI_EMBEDDING_MODEL` or `HUGGINGFACE_EMBEDDING_MODEL`)
-   `provider` - API credentials (if needed)

## Provider and Model Selection

You can configure both the provider and the specific models independently:

```bash
# Provider Selection
export AI_PROVIDER=GEMINI                    # Use Gemini for text generation
export EMBEDDING_PROVIDER=HUGGINGFACE       # Use HuggingFace for embeddings
export EMBEDDINGS_DIMS=768                  # Vector dimensions

# Model Selection
export GEMINI_TEXT_GENERATION_MODEL=gemini-2.5-flash
export GEMINI_TEXT_GENERATION_LITE_MODEL=gemini-2.0-flash-lite
export GEMINI_AGENT_MODEL=gemini-2.5-flash
export GEMINI_EMBEDDING_MODEL=gemini-embedding-exp-03-07
export HUGGINGFACE_EMBEDDING_MODEL=intfloat/multilingual-e5-base
```

## Available Providers

### LLM Providers

-   `GEMINI` - Google Gemini models for text generation

### Embedding Providers

-   `HUGGINGFACE` - Local HuggingFace models (default: multilingual-e5-base, 768 dimensions)
-   `GEMINI` - Google Gemini embeddings (default: gemini-embedding-exp-03-07, 1536 dimensions)

## Example Configurations

### Development Setup (Local Embeddings)

```bash
export AI_PROVIDER=GEMINI                               # Gemini for LLM
export EMBEDDING_PROVIDER=HUGGINGFACE                   # Local embeddings
export EMBEDDINGS_DIMS=768                              # For HuggingFace models
export GEMINI_TEXT_GENERATION_MODEL=gemini-2.5-flash
export HUGGINGFACE_EMBEDDING_MODEL=intfloat/multilingual-e5-base
```

### Production Setup (All Gemini)

```bash
export AI_PROVIDER=GEMINI           # Gemini for LLM
export EMBEDDING_PROVIDER=GEMINI    # Gemini for embeddings
export GOOGLE_AI_API_KEY=your_key   # Required for both
```

### Hybrid Setup (Recommended)

```bash
export AI_PROVIDER=GEMINI           # Gemini for text generation
export EMBEDDING_PROVIDER=LOCAL     # Local embeddings for privacy/cost
export GOOGLE_AI_API_KEY=your_key   # Only needed for text generation
```

## Migration from Previous Version

The old `AI_PROVIDER` variable is still supported for backward compatibility:

-   If only `AI_PROVIDER` is set, it will be used for both LLM and embeddings
-   If both `AI_PROVIDER` and `EMBEDDING_PROVIDER` are set, they work independently

## File Structure

```
lib/ai/
├── ai-config.ts           # Configuration functions
├── index.ts               # Service factory
├── gemini.ts              # Gemini LLM service
├── gemini-embedding.ts    # Gemini embedding service
├── huggingface-embedding.ts # Local embedding service
└── types.ts               # Type definitions
```

## Type Safety

The new system includes proper TypeScript types:

-   `AIConfig` - Complete LLM configuration
-   `EmbeddingConfig` - Embedding-specific configuration
-   Separate proxy objects for accessing configurations

This ensures type safety and prevents mixing up LLM and embedding configurations.
