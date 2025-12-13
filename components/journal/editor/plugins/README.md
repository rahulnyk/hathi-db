# Editor Plugin System

A composable, extensible plugin system for the notes editor that allows keyboard event interception and editor behavior modification.

## Architecture

The plugin system uses the **Chain of Responsibility** pattern to process keyboard events through a series of plugins. Each plugin can:

-   Continue the chain or stop propagation
-   Modify editor content
-   Update cursor position
-   Prevent default browser behavior
-   Dispatch Redux actions

## Directory Structure

```
components/journal/editor/plugins/
├── README.md                    # This file
├── types.ts                     # Core TypeScript interfaces
├── compose.ts                   # Plugin composition utility
├── index.ts                     # Plugin registration and exports
├── bracket-completion.ts        # Auto-complete brackets plugin
├── bracket-wrap.ts              # Wrap selected text with brackets plugin
├── bracket-deletion.ts          # Delete matching bracket pairs plugin
├── enter-handler.ts             # Enter key submission plugin
├── command-trigger.ts           # Chat mode trigger plugin
├── context-detection.ts         # Context suggestion detection plugin
├── context-suggestion-keyboard.ts # Context suggestion keyboard handler
└── hooks/
    └── use-editor-plugins.ts    # React hook for integration
```

## Core Concepts

### Plugin Interface

```typescript
type EditorPlugin = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    context: EditorPluginContext,
    previousResult: PluginResult
) => PluginResult;
```

### Plugin Context

Each plugin receives context containing:

-   `content`: Current textarea content
-   `cursorPosition`: Current cursor position
-   `selectionStart/End`: Selection range
-   `textareaRef`: Reference to textarea element
-   `dispatch`: Redux dispatch function
-   `isEditMode`: Whether editing existing note
-   `isSubmitting`: Whether submission is in progress

### Plugin Result

Plugins return a result object:

```typescript
interface PluginResult {
    continue: boolean; // Continue to next plugin?
    updatedContent?: string; // New content (optional)
    updatedCursorPosition?: number; // New cursor position (optional)
    preventDefault?: boolean; // Prevent default behavior? (optional)
}
```

## Built-in Plugins

### 1. Command Trigger Plugin

**File**: `command-trigger.ts`

Activates chat mode when user types `/` at the start of an empty field (create mode only).

```typescript
// User types: /
// Result: Chat mode activated
```

### 2. Bracket Completion Plugin

**File**: `bracket-completion.ts`

Auto-completes brackets, quotes, and parentheses:

```typescript
// User types: (
// Result: (|)  (cursor at |)
```

Supports: `()`, `[]`, `{}`, `""`, `''`, `` ` ` ``

### 3. Bracket Wrap Plugin

**File**: `bracket-wrap.ts`

Automatically wraps selected text with bracket pairs when an opening bracket is typed:

```typescript
// Content: "hello |world|" (text "world" is selected)
// User types: (
// Result: "hello (|world|)" (text "world" still selected)

// User types [ again:
// Result: "hello ([|world|])" (text "world" still selected)
```

This provides an intuitive way to wrap existing text in brackets, quotes, or parentheses. The plugin:

-   Detects when text is selected
-   Wraps the selection with the appropriate bracket pair
-   Maintains the selection around the wrapped text (excluding the new brackets)
-   Allows multiple wrapping operations in sequence

Supports: `()`, `[]`, `{}`, `""`, `''`, `` ` ` ``

### 4. Bracket Deletion Plugin

**File**: `bracket-deletion.ts`

Automatically deletes the corresponding closing bracket when the opening bracket is deleted with Backspace:

```typescript
// Content: "hello(|)" (cursor at |)
// User presses: Backspace
// Result: "hello|"
```

This only works when there are no characters between the opening and closing brackets, providing a symmetric experience to bracket completion.

Supports: `()`, `[]`, `{}`, `""`, `''`, `` ` ` ``

### 5. Enter Handler Plugin

**File**: `enter-handler.ts`

Handles Enter key behavior differently based on edit mode:

**Edit Mode (editing existing note):**

-   `Enter`: Adds new line
-   `Shift+Enter`: Adds new line

**Create Mode (creating new note):**

-   `Enter`: Submits form (stops chain)
-   `Shift+Enter`: Adds new line (continues chain)

```typescript
// Create mode:
User types: Enter → Form submits
User types: Shift+Enter → New line is added

// Edit mode:
User types: Enter → New line is added
User types: Shift+Enter → New line is added
```

## Usage

### In the Editor Component

```typescript
import { useEditorPlugins, defaultEditorPluginChain } from "./plugins";

export function NotesEditor({ note }: NotesEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState("");

    const { handleKeyDown } = useEditorPlugins({
        content,
        textareaRef,
        isEditMode: !!note,
        isSubmitting: false,
        pluginChain: defaultEditorPluginChain,
        onContentChange: setContent,
    });

    return (
        <Textarea ref={textareaRef} value={content} onKeyDown={handleKeyDown} />
    );
}
```

## Creating New Plugins

### Step 1: Create Plugin File

Create a new file in the `plugins/` directory:

```typescript
// my-plugin.ts
import { EditorPlugin } from "./types";

/**
 * My Custom Plugin
 *
 * Description of what your plugin does
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @param previousResult - Result from previous plugin
 * @returns Plugin result
 */
export const myCustomPlugin: EditorPlugin = (
    event,
    context,
    previousResult
) => {
    // Your plugin logic here
    if (event.key === "Tab") {
        const { content, cursorPosition } = context;
        const before = content.slice(0, cursorPosition);
        const after = content.slice(cursorPosition);

        return {
            continue: true,
            preventDefault: true,
            updatedContent: `${before}    ${after}`, // Add 4 spaces
            updatedCursorPosition: cursorPosition + 4,
        };
    }

    // Let other plugins handle it
    return { continue: true };
};
```

### Step 2: Register Plugin

Add your plugin to `index.ts`:

```typescript
// Export your plugin
export { myCustomPlugin } from "./my-plugin";

// Add to composition
import { myCustomPlugin } from "./my-plugin";

export const defaultEditorPluginChain = composePlugins(
    myCustomPlugin, // Add here
    bracketWrapPlugin,
    bracketCompletionPlugin,
    bracketDeletionPlugin,
    enterHandlerPlugin
);
```

## Plugin Execution Order

Plugins execute **left-to-right** in the composition:

```typescript
const chain = composePlugins(
    pluginA, // Runs first
    pluginB, // Runs second (receives results from A)
    pluginC // Runs third (receives results from B)
);
```

### Order Guidelines

1. **Command/trigger plugins** first (detect special keys)
2. **Content modification plugins** middle (transform text)
3. **Submission plugins** last (stop chain)

**Important**: Plugins that stop the chain (return `continue: false`) should be placed last.

## Examples

### Example 1: Auto-capitalize Plugin

```typescript
export const autoCapitalizePlugin: EditorPlugin = (
    event,
    context,
    previousResult
) => {
    const { content, cursorPosition } = context;

    // Capitalize first letter after period + space
    if (event.key === " " && content[cursorPosition - 1] === ".") {
        // Continue chain, let space be typed normally
        // Next character will be capitalized by another mechanism
        return { continue: true };
    }

    return { continue: true };
};
```

### Example 2: Markdown Shortcut Plugin

```typescript
export const markdownShortcutPlugin: EditorPlugin = (
    event,
    context,
    previousResult
) => {
    // Ctrl+B for bold
    if (event.key === "b" && (event.ctrlKey || event.metaKey)) {
        const { content, selectionStart, selectionEnd } = context;
        const selectedText = content.slice(selectionStart, selectionEnd);

        if (selectedText) {
            const before = content.slice(0, selectionStart);
            const after = content.slice(selectionEnd);

            return {
                continue: true,
                preventDefault: true,
                updatedContent: `${before}**${selectedText}**${after}`,
                updatedCursorPosition: selectionEnd + 4,
            };
        }
    }

    return { continue: true };
};
```

### Example 3: Redux State Plugin

```typescript
import { setHighlightMode } from "@/store/uiSlice";

export const highlightModePlugin: EditorPlugin = (
    event,
    context,
    previousResult
) => {
    const { dispatch, isEditMode } = context;

    // Activate highlight mode with Ctrl+H
    if (event.key === "h" && (event.ctrlKey || event.metaKey)) {
        if (!isEditMode) {
            dispatch(setHighlightMode(true));

            return {
                continue: true,
                preventDefault: true,
            };
        }
    }

    return { continue: true };
};
```

## Testing Plugins

### Unit Testing

```typescript
import { bracketCompletionPlugin } from "./bracket-completion";

describe("bracketCompletionPlugin", () => {
    it("should complete opening parenthesis", () => {
        const mockEvent = { key: "(" } as React.KeyboardEvent;
        const context = {
            content: "hello",
            cursorPosition: 5,
            // ... other context properties
        };

        const result = bracketCompletionPlugin(mockEvent, context, {
            continue: true,
        });

        expect(result.updatedContent).toBe("hello()");
        expect(result.updatedCursorPosition).toBe(6);
        expect(result.preventDefault).toBe(true);
    });
});
```

## Best Practices

### 1. Keep Plugins Focused

Each plugin should do one thing well:

✅ Good: `bracketCompletionPlugin` only handles bracket completion
❌ Bad: A plugin that handles brackets, quotes, and markdown formatting

### 2. Document Behavior

Use JSDoc comments to explain:

-   What the plugin does
-   When it activates
-   What it returns
-   Examples of use

### 3. Handle Edge Cases

```typescript
export const myPlugin: EditorPlugin = (event, context, previousResult) => {
    // Check if we should even run
    if (context.isSubmitting) {
        return { continue: true };
    }

    // Check for null/undefined
    if (!context.content) {
        return { continue: true };
    }

    // Your logic here
};
```

### 4. Preserve Context

When modifying content, preserve the rest:

```typescript
const before = content.slice(0, cursorPosition);
const after = content.slice(cursorPosition);
const updatedContent = `${before}${newText}${after}`;
```

### 5. Consider Edit vs Create Mode

Some plugins should only work in certain modes:

```typescript
if (context.isEditMode) {
    return { continue: true }; // Skip in edit mode
}
```

## Debugging

### Enable Logging

Add logging to your plugins:

```typescript
export const myPlugin: EditorPlugin = (event, context, previousResult) => {
    console.log("Plugin executed:", {
        key: event.key,
        content: context.content,
        cursor: context.cursorPosition,
    });

    // Your logic
};
```

### Check Plugin Order

Ensure your plugin is in the right position in the chain:

```typescript
console.log("Plugin chain:", defaultEditorPluginChain.toString());
```

## Performance Considerations

1. **Keep plugins fast** - They run on every keypress
2. **Avoid heavy computations** - Delegate to async operations if needed
3. **Early return** - Return quickly if plugin doesn't apply

```typescript
export const expensivePlugin: EditorPlugin = (
    event,
    context,
    previousResult
) => {
    // Early return for irrelevant keys
    if (event.key !== "mySpecialKey") {
        return { continue: true };
    }

    // Only run expensive logic when needed
    // ...
};
```

## Troubleshooting

### Plugin Not Running

1. Check if it's registered in `index.ts`
2. Check if previous plugin stopped the chain
3. Check if conditions are being met

### Content Not Updating

1. Ensure `updatedContent` is returned
2. Check if `onContentChange` is being called
3. Verify cursor position update

### Cursor Position Wrong

1. Use `setTimeout` for cursor updates after content change
2. Ensure position is calculated correctly
3. Check if selection range is being set

## Future Enhancements

Potential additions to the plugin system:

-   [ ] Async plugin support
-   [ ] Plugin priority/ordering configuration
-   [ ] Plugin enable/disable at runtime
-   [ ] Plugin event hooks (before/after chain)
-   [ ] Plugin metadata and introspection
-   [ ] Plugin composition utilities (combine, conditional, etc.)

## License

Part of the hathi-db project.
