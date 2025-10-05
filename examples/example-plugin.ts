/**
 * Example Plugin - Auto-Complete for Common Phrases
 *
 * This is an example of how to create a new editor plugin using the EditorContext system.
 * This plugin provides auto-completion for common phrases when users type specific triggers.
 */

import type { KeyboardPlugin } from "../components/journal/editor/editor-plugins";
import type { EditorContext } from "@/hooks/editor-context";

/**
 * Common phrases that can be auto-completed
 */
const COMMON_PHRASES = {
    "todo:": "TODO: ",
    "note:": "NOTE: ",
    "idea:": "IDEA: ",
    "fix:": "FIX: ",
    "hack:": "HACK: ",
    "review:": "REVIEW: ",
} as const;

/**
 * Tab completion plugin for common phrases
 *
 * When user types a phrase trigger and presses Tab, it expands to the full phrase.
 * For example: typing "todo" and pressing Tab expands to "TODO: "
 */
const tabCompletionPlugin: KeyboardPlugin = {
    key: "Tab",
    handler: (event, context: EditorContext) => {
        const currentContent = context.state.content;
        const cursorPosition = context.state.activeSelection.start;

        // Find the word before the cursor
        const textBeforeCursor = currentContent.substring(0, cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1]?.toLowerCase();

        // Check if the last word matches any of our phrase triggers
        const trigger = lastWord + ":";
        if (trigger in COMMON_PHRASES) {
            event.preventDefault();

            const replacement =
                COMMON_PHRASES[trigger as keyof typeof COMMON_PHRASES];
            const wordStartPosition = cursorPosition - lastWord.length;

            // Replace the trigger word with the full phrase
            const newContent =
                currentContent.substring(0, wordStartPosition) +
                replacement +
                currentContent.substring(cursorPosition);

            context.actions.setContent(newContent);

            // Update draft for new notes
            if (!context.state.isEditMode) {
                context.actions.updateDraftContent(newContent);
            }

            // Move cursor to end of inserted phrase
            const newCursorPosition = wordStartPosition + replacement.length;
            requestAnimationFrame(() => {
                if (context.textareaRef.current) {
                    context.textareaRef.current.setSelectionRange(
                        newCursorPosition,
                        newCursorPosition
                    );
                    context.actions.setActiveSelection({
                        start: newCursorPosition,
                        end: newCursorPosition,
                    });
                }
            });

            return; // Stop further processing
        }

        // If no match, let the default Tab behavior continue
    },
};

/**
 * Smart quote plugin
 *
 * Automatically converts straight quotes to smart quotes when typing.
 */
const smartQuotePlugin: KeyboardPlugin = {
    key: '"',
    handler: (event, context: EditorContext) => {
        // Only apply smart quotes in non-code contexts
        // This is a simple example - you could make this more sophisticated
        const currentContent = context.state.content;
        const cursorPosition = context.state.activeSelection.start;

        // Check if we're inside a code block (simple heuristic)
        const textBeforeCursor = currentContent.substring(0, cursorPosition);
        const codeBlockCount = (textBeforeCursor.match(/```/g) || []).length;
        const inCodeBlock = codeBlockCount % 2 === 1;

        if (inCodeBlock) {
            // Let normal quote behavior continue in code blocks
            return;
        }

        event.preventDefault();

        // Simple smart quote logic: use opening quote if after whitespace or at start
        const charBefore =
            cursorPosition > 0 ? currentContent[cursorPosition - 1] : " ";
        const useOpeningQuote = /\s/.test(charBefore) || cursorPosition === 0;
        const smartQuote = useOpeningQuote ? '"' : '"';

        const newContent =
            currentContent.substring(0, cursorPosition) +
            smartQuote +
            currentContent.substring(cursorPosition);

        context.actions.setContent(newContent);

        if (!context.state.isEditMode) {
            context.actions.updateDraftContent(newContent);
        }

        // Move cursor after the inserted quote
        const newCursorPosition = cursorPosition + 1;
        requestAnimationFrame(() => {
            if (context.textareaRef.current) {
                context.textareaRef.current.setSelectionRange(
                    newCursorPosition,
                    newCursorPosition
                );
                context.actions.setActiveSelection({
                    start: newCursorPosition,
                    end: newCursorPosition,
                });
            }
        });
    },
};

/**
 * Export plugins for registration
 */
export const examplePlugins = [tabCompletionPlugin, smartQuotePlugin];

/**
 * Example of how to register these plugins:
 *
 * ```typescript
 * import { registerKeyboardPlugin } from "./editorPlugins";
 * import { examplePlugins } from "./examplePlugin";
 *
 * // Register all example plugins
 * examplePlugins.forEach(plugin => registerKeyboardPlugin(plugin));
 * ```
 */
