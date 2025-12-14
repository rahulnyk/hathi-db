/**
 * Editor Plugin System
 *
 * This module provides a composable plugin system for the notes editor.
 * Plugins can intercept keyboard events and modify editor behavior in a
 * chain-of-responsibility pattern.
 *
 * ## Architecture
 *
 * The plugin system consists of:
 * - **Types**: Core interfaces (EditorPlugin, EditorPluginContext, PluginResult)
 * - **Composition**: composePlugins function to chain plugins
 * - **Plugins**: Individual plugin implementations
 * - **Hook**: useEditorPlugins to integrate with React components
 *
 * ## Plugin Execution Order
 *
 * Plugins execute left-to-right in the composition. Each plugin can:
 * 1. Continue the chain (return { continue: true })
 * 2. Stop the chain (return { continue: false })
 * 3. Modify content (return { updatedContent: "..." })
 * 4. Update cursor position (return { updatedCursorPosition: 5 })
 * 5. Update selection range (return { updatedSelectionStart: 5, updatedSelectionEnd: 10 })
 * 6. Prevent default behavior (return { preventDefault: true })
 *
 * ## Adding New Plugins
 *
 * 1. Create a new file in the plugins directory
 * 2. Implement the EditorPlugin type
 * 3. Export your plugin
 * 4. Add it to the composition in this file
 *
 * @example
 * ```typescript
 * // Create a new plugin
 * export const myPlugin: EditorPlugin = (event, context, previousResult) => {
 *   if (event.key === 'Tab') {
 *     return {
 *       continue: true,
 *       preventDefault: true,
 *       updatedContent: context.content + '    ',
 *     };
 *   }
 *   return { continue: true };
 * };
 *
 * // Add to composition
 * export const defaultEditorPluginChain = composePlugins(
 *   contextDetectionPlugin,
 *   contextSuggestionKeyboardPlugin,
 *   myPlugin, // Add your plugin here
 *   bracketWrapPlugin,
 *   bracketCompletionPlugin,
 *   bracketDeletionPlugin,
 *   enterHandlerPlugin
 * );
 * ```
 *
 * @module editor-plugins
 */

// Export types
export type { EditorPlugin, EditorPluginContext, PluginResult } from "./types";

// Export constants
export { BRACKET_PAIRS } from "./types";

// Export composition utility
export { composePlugins } from "./compose";

// Export individual plugins
export { bracketCompletionPlugin } from "./bracket-completion";
export { bracketDeletionPlugin } from "./bracket-deletion";
export { bracketWrapPlugin } from "./bracket-wrap";
export { enterHandlerPlugin } from "./enter-handler";
export { contextDetectionPlugin } from "./context-detection";
export { contextSuggestionKeyboardPlugin } from "./context-suggestion-keyboard";

// Export hook
export { useEditorPlugins } from "./hooks/use-editor-plugins";

// Import plugins for composition
import { composePlugins } from "./compose";
import { contextDetectionPlugin } from "./context-detection";
import { contextSuggestionKeyboardPlugin } from "./context-suggestion-keyboard";
import { bracketWrapPlugin } from "./bracket-wrap";
import { bracketCompletionPlugin } from "./bracket-completion";
import { bracketDeletionPlugin } from "./bracket-deletion";
import { enterHandlerPlugin } from "./enter-handler";

/**
 * Default plugin chain for the notes editor
 *
 * Plugins are executed in the following order:
 * 1. **contextDetectionPlugin** - Detects when user is typing between [[ ]] and manages suggestion box
 * 2. **contextSuggestionKeyboardPlugin** - Handles keyboard navigation when suggestions are active
 * 3. **bracketWrapPlugin** - Wraps selected text with bracket pairs (stops chain when wrapping)
 * 4. **bracketCompletionPlugin** - Auto-completes brackets when no text is selected
 * 5. **bracketDeletionPlugin** - Deletes matching closing bracket when opening is deleted with Backspace
 * 6. **enterHandlerPlugin** - Handles Enter key for form submission (stops chain in create mode)
 *
 * This order ensures that:
 * - Context detection happens early to open/close suggestion box
 * - Context keyboard handling (Arrow keys, Enter, Escape) intercepts keys before other handlers
 * - Bracket wrapping happens before completion (handles selected text, stops chain)
 * - Bracket completion only runs when no text is selected
 * - Bracket deletion happens before submission
 * - Enter handling is last (may stop chain or allow newline based on mode)
 *
 * @example
 * ```typescript
 * const { handleKeyDown } = useEditorPlugins({
 *   content,
 *   textareaRef,
 *   isEditMode,
 *   isSubmitting,
 *   pluginChain: defaultEditorPluginChain,
 *   onContentChange: setContent,
 * });
 * ```
 */
export const defaultEditorPluginChain = composePlugins(
    contextDetectionPlugin,
    contextSuggestionKeyboardPlugin,
    bracketWrapPlugin,
    bracketCompletionPlugin,
    bracketDeletionPlugin,
    enterHandlerPlugin
);
