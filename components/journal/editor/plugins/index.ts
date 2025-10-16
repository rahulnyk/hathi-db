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
 * 5. Prevent default behavior (return { preventDefault: true })
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
 *   commandTriggerPlugin,
 *   myPlugin,
 *   bracketCompletionPlugin,
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
export { enterHandlerPlugin } from "./enter-handler";
export { commandTriggerPlugin } from "./command-trigger";

// Export hook
export { useEditorPlugins } from "./hooks/use-editor-plugins";

// Import plugins for composition
import { composePlugins } from "./compose";
import { commandTriggerPlugin } from "./command-trigger";
import { bracketCompletionPlugin } from "./bracket-completion";
import { bracketDeletionPlugin } from "./bracket-deletion";
import { enterHandlerPlugin } from "./enter-handler";

/**
 * Default plugin chain for the notes editor
 *
 * Plugins are executed in the following order:
 * 1. **commandTriggerPlugin** - Activates chat mode when '/' is typed at start
 * 2. **bracketCompletionPlugin** - Auto-completes brackets, quotes, and parentheses
 * 3. **bracketDeletionPlugin** - Deletes matching closing bracket when opening is deleted
 * 4. **enterHandlerPlugin** - Handles Enter key for form submission (stops chain)
 *
 * This order ensures that:
 * - Command triggers are detected first
 * - Bracket completion happens before deletion (for new brackets)
 * - Bracket deletion happens before submission
 * - Enter handling is last (as it stops the chain)
 *
 * @example
 * ```typescript
 * const { handleKeyDown } = useEditorPlugins({
 *   content,
 *   textareaRef,
 *   isEditMode,
 *   chatMode,
 *   isSubmitting,
 *   pluginChain: defaultEditorPluginChain,
 *   onContentChange: setContent,
 * });
 * ```
 */
export const defaultEditorPluginChain = composePlugins(
    commandTriggerPlugin,
    bracketCompletionPlugin,
    bracketDeletionPlugin,
    enterHandlerPlugin
);
