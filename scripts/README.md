# Scripts Directory

This directory contains utility scripts for the Hathi DB project.

## download-model.js

Downloads and caches the HuggingFace embedding model specified in the environment configuration.

### Usage

```bash
# Via yarn script (recommended)
yarn model:download

# Direct execution
node scripts/download-model.js

# Via start.sh (automatic during setup)
./start.sh
```

### Environment Variables

-   `HUGGINGFACE_EMBEDDING_MODEL`: The model name to download (default: `intfloat/multilingual-e5-base`)
-   `EMBEDDING_PROVIDER`: Must be set to `HUGGINGFACE` for the script to run

### Features

-   Downloads and caches models to `./.cache/huggingface`
-   Provides progress feedback and timing information
-   Handles errors gracefully with helpful error messages
-   Supports graceful shutdown (Ctrl+C)
-   Automatically called during initial setup via `start.sh`

### Error Handling

The script provides context-specific error messages:

-   Network connectivity issues
-   Model not found errors
-   General debugging guidance

### Integration

This script is automatically called during the initial setup process when running `./start.sh`, but can also be run independently for testing or manual model downloads.
