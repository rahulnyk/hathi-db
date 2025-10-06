# Editor Context and Plugin System Documentation

## Overview

The Editor Context and Plugin System provides a unified, modular approach to managing editor state and behavior. It centralizes state management using Redux, enabling plugins and commands in separate modules to access and modify editor state directly. This architecture provides clean, typed interfaces for plugins, commands, and the main editor component.

## Architecture

### Core Components

1.  **`useEditorContext` Hook** (`/hooks/editor-context.ts`)

    -   Creates a shared editor context instance.
    -   Provides a unified interface for plugins and commands.
    -   Manages Redux integration transparently.

2.  **Editor Plugins System** (`/components/journal/editor/editorPlugins.ts`)

    -   Handles keyboard events through a plugin architecture.
    -   Easily extensible for new functionality.
    -   Uses `EditorContext` for state management.

3.  **Editor Commands System** (`/components/journal/editor/editorCommands.ts`)

    -   Processes text-based commands (like `/q` for chat mode).
    -   Features an extensible command registry.
    -   Integrated with `EditorContext`.

4.  **Main Editor Component** (`/components/journal/editor/index.tsx`)
    -   Uses the `useEditorContext` hook for all state management.
    -   Maintains a clean separation between UI and business logic.

## Naming Convention

**Why `useEditorContext` follows React Hook conventions**

The function is now properly named as `useEditorContext` to follow React Hook naming conventions. Since it uses hooks internally (`useAppDispatch`, `useAppSelector`, etc.), it must be named with the 'use' prefix and follow the Rules of Hooks. This provides better developer experience with React DevTools and ESLint.

## State Management with Redux

The editor component's state is managed by Redux instead of local component state.

### `editorSlice.ts`

-   **Location**: `/store/editorSlice.ts`
-   **Purpose**: Centralized Redux state management for the editor.
-   **State Managed**:
    -   `contextBracketInfo`: Context suggestion state.
    -   `dateTriggerInfo`: Date picker trigger state.
    -   `activeSelection`: Current text selection coordinates.

### Redux Store Integration

The `editorReducer` is added to the main store configuration in `/store/index.ts`, making `state.editor.*` available throughout the application.

## Key Interfaces

### `EditorContext`

The main interface that plugins and commands interact with:

```typescript
interface EditorContext {
    /** Read-only editor state */
    state: EditorState;
    /** Computed UI state */
    uiState: EditorUIState;
    /** Editor actions */
    actions: EditorActions;
    /** High-level operations */
    operations: EditorOperations;
    /** Reference to textarea element */
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    /** Chat hook for AI interactions */
    chatHook?: ReturnType<typeof useChat>;
    /** Redux dispatch function */
    dispatch: ReturnType<typeof useAppDispatch>;
}
```

### `EditorState`

Read-only state properties:

```typescript
interface EditorState {
    content: string;
    activeSelection: ActiveSelection;
    contextBracketInfo: ContextBracketInfo;
    dateTriggerInfo: DateTriggerInfo;
    chatMode: boolean;
    isEditMode: boolean;
    isSubmitting: boolean;
    note?: Note;
    contexts: string[];
    currentKeyContext: string | null;
    draftContent: string;
}
```

### `EditorUIState`

Computed UI state properties:

```typescript
interface EditorUIState {
    /** Whether context suggestions should be shown */
    shouldShowContextSuggestions: boolean;
    /** Whether date picker should be shown */
    shouldShowDatePicker: boolean;
}
```

### `EditorActions`

Functions to modify editor state:

```typescript
interface EditorActions {
    setContent: (content: string) => void;
    setActiveSelection: (selection: ActiveSelection) => void;
    setContexts: (contexts: string[]) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;

    // Redux actions
    updateDraftContent: (content: string) => void;
    clearDraft: () => void;
    setChatMode: (enabled: boolean) => void;
    setEditingNoteId: (noteId: string | null) => void;

    // Editor state actions
    setContextBracketInfo: (info: ContextBracketInfo) => void;
    setDateTriggerInfo: (info: DateTriggerInfo) => void;
    closeContextSuggestions: () => void;
    closeDatePicker: () => void;
    resetEditorState: () => void;
}
```

## Creating Plugins

### Keyboard Plugins

Create plugins that respond to keyboard events:

```typescript
import type { KeyboardPlugin } from "./editorPlugins";
import type { EditorContext } from "@/hooks/editor-context";

const myPlugin: KeyboardPlugin = {
    key: "Tab", // Key to listen for
    modifiers: { shift: false }, // Optional modifier requirements
    stopPropagation: true, // Whether to stop further processing
    handler: (event, context: EditorContext) => {
        // Access editor state
        const { content, isEditMode } = context.state;

        // Access computed UI state
        const { shouldShowContextSuggestions, shouldShowDatePicker } =
            context.uiState;

        // Modify editor state
        context.actions.setContent("new content");

        // Use high-level operations
        context.operations.createNote();
    },
};

// Register the plugin
import { registerKeyboardPlugin } from "./editorPlugins";
registerKeyboardPlugin(myPlugin);
```

### Command Plugins

Create plugins that respond to text commands:

```typescript
import type { EditorCommand } from "./editorCommands";
import type { EditorContext } from "@/hooks/editor-context";

const myCommand: EditorCommand = {
    patterns: ["/my", "mycmd"], // Command patterns to match
    maxLength: 10, // Maximum input length for recognition
    handler: (context: EditorContext) => {
        // Access and modify editor state
        context.actions.setChatMode(true);
        context.actions.setContent("");
        return true; // Return true if command was handled
    },
};

// Register the command
import { registerCommand } from "./editorCommands";
registerCommand(myCommand);
```

## Plugin and Command Examples

### Simple Text Expansion Plugin

```typescript
const textExpansionPlugin: KeyboardPlugin = {
    key: " ", // Space key
    handler: (event, context) => {
        const content = context.state.content;
        const cursorPos = context.state.activeSelection.start;
        const wordBefore = getWordBefore(content, cursorPos);

        if (wordBefore === "addr") {
            event.preventDefault();
            const newContent = replaceLastWord(content, cursorPos, "address");
            context.actions.setContent(newContent);
        }
    },
};
```

### Auto-Save Plugin

```typescript
const autoSavePlugin: KeyboardPlugin = {
    key: "s",
    modifiers: { ctrl: true },
    handler: (event, context) => {
        if (context.state.isEditMode) {
            event.preventDefault();
            context.operations.saveEdit();
        }
    },
};
```

### Custom Mode Switch Command

```typescript
const focusModeCommand: EditorCommand = {
    patterns: ["/focus"],
    maxLength: 6,
    handler: (context) => {
        // Custom logic for focus mode
        context.actions.resetEditorState();
        context.actions.setContent("Focus mode activated");
        return true;
    },
};
```

## Best Practices

### Plugin Development

1.  **Use TypeScript**: Leverage strong typing for a better development experience.
2.  **Handle Edge Cases**: Always check if the context state is valid before performing operations.
3.  **Prevent Default Appropriately**: Only prevent default browser/editor behavior when necessary.
4.  **Update Selection**: Remember to update the cursor/selection position after content changes.
5.  **Consider Edit vs. New Note**: Handle both "edit mode" and "new note" scenarios.

### State Management

1.  **Use `EditorContext`**: Always use the provided context instead of direct Redux access.
2.  **Immutable Updates**: Use the provided actions instead of direct state mutations.
3.  **Async Operations**: Handle asynchronous operations properly within plugins.
4.  **Performance**: Be mindful of frequent state updates.

## Migration Guide

If migrating from the old `PluginContext` system:

**Old:**

```typescript
handler: (event, context: PluginContext) => {
    const content = context.content;
    context.setContent("new content");
    context.dispatch(someAction());
};
```

**New:**

```typescript
handler: (event, context: EditorContext) => {
    const content = context.state.content;
    context.actions.setContent("new content");
    // Redux actions are available through context.actions or context.dispatch
};
```

### Key Changes

1.  **State Access**: `context.property` → `context.state.property`
2.  **Actions**: Direct function calls → `context.actions.functionName()`
3.  **Operations**: New high-level operations are available in `context.operations`.
4.  **Type Safety**: Better TypeScript support with clearer interfaces.

## Debugging

### Common Issues

1.  **State Not Updating**: Ensure you're using the correct action from `context.actions`.
2.  **Selection Issues**: Always update the selection after content changes.
3.  **Plugin Not Triggering**: Check key matching and modifier requirements.
4.  **Command Not Working**: Verify pattern matching and input length limits.

### Debugging Tools

You can add `console.log` statements to your plugin handlers for debugging:

```typescript
// Add to plugin handler for debugging
console.log("Current state:", context.state);
console.log("Available actions:", Object.keys(context.actions));
```

## Performance Considerations

1.  **Debounced Updates**: For frequent operations, consider debouncing.
2.  **Selective Re-renders**: The system is optimized to minimize re-renders.
3.  **Memory Leaks**: Properly clean up any timers or subscriptions in plugins.
4.  **Bundle Size**: Keep plugin dependencies minimal.

## Future Enhancements

Planned improvements to the editor context system:

1.  **Plugin Priority System**: Control the plugin execution order.
2.  **Plugin Dependencies**: Declare dependencies between plugins.
3.  **Hot Plugin Reloading**: Development-time plugin reloading.
4.  **Plugin Marketplace**: A shareable plugin ecosystem.
5.  **Advanced State Management**: More sophisticated state synchronization.
6.  **Performance Monitoring**: Built-in performance tracking for plugins.

## Contributing

When contributing new plugins or improvements:

1.  Follow TypeScript best practices.
2.  Include comprehensive JSDoc comments.
3.  Add unit tests for new functionality.
4.  Update this documentation for new features.
5.  Consider backward compatibility.
