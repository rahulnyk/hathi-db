import { EditorPlugin, EditorPluginContext, PluginResult } from "./types";

/**
 * Composes multiple plugins into a single plugin chain
 *
 * Plugins are executed left-to-right (first plugin in array runs first).
 * The chain stops if any plugin returns continue: false.
 * Each plugin receives the updated context from previous plugins,
 * allowing them to build upon each other's modifications.
 *
 * @param plugins - Array of plugins to compose
 * @returns A single composed plugin function
 *
 * @example
 * ```typescript
 * const editorChain = composePlugins(
 *   bracketCompletionPlugin,
 *   enterHandlerPlugin
 * );
 * ```
 */
export function composePlugins(...plugins: EditorPlugin[]): EditorPlugin {
    return (
        event: React.KeyboardEvent<HTMLTextAreaElement>,
        context: EditorPluginContext,
        initialResult: PluginResult = { continue: true }
    ): PluginResult => {
        let result = initialResult;
        let currentContext = context;

        for (const plugin of plugins) {
            // Stop if previous plugin said not to continue
            if (!result.continue) {
                break;
            }

            // Update context with any content changes from previous plugin
            if (result.updatedContent !== undefined) {
                currentContext = {
                    ...currentContext,
                    content: result.updatedContent,
                };
            }

            // Update cursor position if provided
            if (result.updatedCursorPosition !== undefined) {
                currentContext = {
                    ...currentContext,
                    cursorPosition: result.updatedCursorPosition,
                    selectionStart: result.updatedCursorPosition,
                    selectionEnd: result.updatedCursorPosition,
                };
            }

            // Execute plugin with updated context and previous result
            const pluginResult = plugin(event, currentContext, result);

            // Merge results, accumulating preventDefault flags
            result = {
                ...result,
                ...pluginResult,
                preventDefault:
                    result.preventDefault || pluginResult.preventDefault,
            };
        }

        return result;
    };
}
