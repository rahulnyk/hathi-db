# Editor Modules Documentation

This document explains the modular architecture of the notes editor.

## Structure

### 1. `/components/journal/editor/helpers.ts`

Contains utility functions for text manipulation:

-   `handleBracketInsertion` - Wraps text in bracket pairs
-   `handleAutoDeleteBracketPair` - Auto-deletes matching bracket pairs
-   `BRACKET_PAIRS` - Configuration for supported brackets

### 2. `/components/journal/editor/editorCommands.ts`

Extensible command system for editor commands:

-   Plugin-like architecture for adding new commands
-   Built-in commands: `/q`, `qq` (chat mode), `/n`, `nn` (notes mode)
-   Easy to add new commands via `registerCommand()`

### 3. `/components/journal/editor/editorPlugins.ts`

Keyboard event handling system:

-   Plugin architecture for keyboard handlers
-   Built-in plugins: Enter, Bracket, Backspace handling
-   Easy to add new keyboard handlers via `registerKeyboardPlugin()`

## Usage Example

```typescript
// Adding a new command
registerCommand({
    patterns: ["/help", "?"],
    maxLength: 5,
    handler: (dispatch, setContent) => {
        // Command logic
        return true;
    },
});

// Adding a new keyboard plugin
registerKeyboardPlugin({
    key: "Tab",
    handler: (event, context) => {
        // Tab handling logic
    },
});
```

## Benefits

-   **Modular**: Each concern is separated into its own module
-   **Extensible**: New commands and keyboard handlers can be added easily
-   **Maintainable**: Clean separation of concerns
-   **Testable**: Each module can be tested independently
