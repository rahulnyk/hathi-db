/**
 * Editor Plugins - Keyboard Handler System
 * Extensible plugin system for handling keyboard events
 */

import React from "react";
import {
    handleBracketInsertion,
    handleAutoDeleteBracketPair,
    BRACKET_PAIRS,
} from "./helpers";
import type { EditorContext } from "@/hooks/editor-context";

/**
 * Keyboard plugin interface
 *
 * Defines the structure for keyboard event handlers in the editor plugin system.
 */
export interface KeyboardPlugin {
    /** Key pattern to match */
    key: string;
    /** Optional modifier requirements */
    modifiers?: {
        shift?: boolean;
        ctrl?: boolean;
        alt?: boolean;
        meta?: boolean;
    };
    /** Handler function */
    handler: (
        event: React.KeyboardEvent<HTMLTextAreaElement>,
        context: EditorContext
    ) => Promise<void> | void;
    /** Whether this plugin should prevent further processing */
    stopPropagation?: boolean;
}

/**
 * Enter key handler plugin
 *
 * Handles Enter key presses for form submission, respecting context suggestions
 * and chat mode behavior.
 */
const enterKeyPlugin: KeyboardPlugin = {
    key: "Enter",
    modifiers: { shift: false },
    stopPropagation: true,
    handler: async (event, context) => {
        // If context suggestion box is open, let it handle the enter key
        if (
            context.state.contextBracketInfo?.isInsideBrackets &&
            context.state.contextBracketInfo.searchTerm.length >= 2
        ) {
            // Don't prevent default here - let the suggestion box handle it
            return;
        }

        event.preventDefault();
        if (!context.state.content.trim() || context.state.isSubmitting) return;

        // If in chat mode and chatHook is provided, use chat instead of creating notes
        if (
            context.state.chatMode &&
            context.chatHook &&
            !context.state.isEditMode
        ) {
            event.preventDefault();
            const form = event.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
            return;
        }

        if (context.state.isEditMode) {
            context.operations.saveEdit();
        } else {
            await context.operations.createNote();
        }
    },
};

/**
 * Bracket key handler plugins - one for each bracket type
 *
 * Factory function that creates plugins for handling bracket insertion
 * with auto-pairing and cursor positioning.
 */
const createBracketPlugin = (bracketKey: string): KeyboardPlugin => ({
    key: bracketKey,
    stopPropagation: true,
    handler: (event, context) => {
        event.preventDefault();

        // Get current selection directly from the event target
        const currentSelection = {
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
        };

        const result = handleBracketInsertion(
            bracketKey,
            context.state.content,
            currentSelection,
            BRACKET_PAIRS
        );

        // Update the textarea value directly first
        if (context.textareaRef.current) {
            context.textareaRef.current.value = result.newValue;

            // Set the selection immediately
            context.textareaRef.current.setSelectionRange(
                result.newSelectionStart,
                result.newSelectionEnd
            );
        }

        // Then update the React state
        context.actions.setContent(result.newValue);
        context.actions.setActiveSelection({
            start: result.newSelectionStart,
            end: result.newSelectionEnd,
        });

        // Update draft for new notes
        if (!context.state.isEditMode) {
            context.actions.updateDraftContent(result.newValue);
        }
    },
});

// Create individual bracket plugins
const leftSquareBracketPlugin = createBracketPlugin("[");
const leftParenPlugin = createBracketPlugin("(");
const leftCurlyBracePlugin = createBracketPlugin("{");
const leftAngleBracketPlugin = createBracketPlugin("<");

/**
 * Date picker trigger plugin for pipe character (|)
 *
 * Handles pipe character insertion that triggers the date picker.
 */
const dateTriggerPipePlugin: KeyboardPlugin = {
    key: "|",
    stopPropagation: true,
    handler: (event, context) => {
        // Don't trigger date picker in chat mode
        if (context.state.chatMode) {
            return;
        }

        // Allow the character to be inserted first
        // The date picker will be triggered in the content change handler
    },
};

/**
 * Date picker trigger plugin for backslash character (\)
 *
 * Handles backslash character insertion that triggers the date picker.
 */
const dateTriggerBackslashPlugin: KeyboardPlugin = {
    key: "\\",
    stopPropagation: true,
    handler: (event, context) => {
        // Don't trigger date picker in chat mode
        if (context.state.chatMode) {
            return;
        }

        // Allow the character to be inserted first
        // The date picker will be triggered in the content change handler
    },
};

/**
 * Escape key handler plugin for context suggestions and date picker
 *
 * Handles Escape key to close open UI elements like date picker and context suggestions.
 */
const escapeKeyPlugin: KeyboardPlugin = {
    key: "Escape",
    handler: (event, context) => {
        // If date picker is open, close it first
        if (context.state.dateTriggerInfo?.isTriggerFound) {
            event.preventDefault();
            context.actions.closeDatePicker();
            return;
        }

        // If context suggestion box is open, close it
        if (context.state.contextBracketInfo?.isInsideBrackets) {
            event.preventDefault();
            context.actions.closeContextSuggestions();
            return;
        }
    },
};

/**
 * Backspace key handler plugin
 *
 * Handles backspace key for auto-deleting bracket pairs.
 */
const backspaceKeyPlugin: KeyboardPlugin = {
    key: "Backspace",
    handler: (event, context) => {
        const currentValue = context.state.content;
        const cursorPosition = event.currentTarget.selectionStart;

        if (cursorPosition === 0) {
            return;
        }

        const charBeforeCursor = currentValue.substring(
            cursorPosition - 1,
            cursorPosition
        );

        const deleteResult = handleAutoDeleteBracketPair(
            currentValue,
            cursorPosition,
            charBeforeCursor,
            BRACKET_PAIRS
        );

        if (deleteResult) {
            event.preventDefault();
            context.actions.setContent(deleteResult.newValue);

            // Update draft for new notes
            if (!context.state.isEditMode) {
                context.actions.updateDraftContent(deleteResult.newValue);
            }

            requestAnimationFrame(() => {
                if (context.textareaRef.current) {
                    context.textareaRef.current.setSelectionRange(
                        deleteResult.newCursorPosition,
                        deleteResult.newCursorPosition
                    );
                }
            });
        }
    },
};

// Plugin registry - easily extensible
const pluginRegistry: KeyboardPlugin[] = [
    enterKeyPlugin,
    leftSquareBracketPlugin,
    leftParenPlugin,
    leftCurlyBracePlugin,
    leftAngleBracketPlugin,
    dateTriggerPipePlugin,
    dateTriggerBackslashPlugin,
    escapeKeyPlugin,
    backspaceKeyPlugin,
    // Future plugins can be added here
];

/**
 * Check if event modifiers match plugin requirements
 */
function modifiersMatch(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    required?: KeyboardPlugin["modifiers"]
): boolean {
    if (!required) return true;

    return (
        (required.shift === undefined || event.shiftKey === required.shift) &&
        (required.ctrl === undefined || event.ctrlKey === required.ctrl) &&
        (required.alt === undefined || event.altKey === required.alt) &&
        (required.meta === undefined || event.metaKey === required.meta)
    );
}

/**
 * Process keyboard events through registered plugins
 *
 * Iterates through all registered plugins and executes matching handlers.
 *
 * @param event - The keyboard event to process
 * @param context - Editor context containing state and actions
 */
export async function processKeyboardEvent(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    context: EditorContext
): Promise<void> {
    const pressedKey = event.key;

    for (const plugin of pluginRegistry) {
        if (
            plugin.key === pressedKey &&
            modifiersMatch(event, plugin.modifiers)
        ) {
            await plugin.handler(event, context);

            if (plugin.stopPropagation) {
                return;
            }
        }
    }
}

/**
 * Register a new keyboard plugin
 * @param plugin - The plugin to register
 */
export function registerKeyboardPlugin(plugin: KeyboardPlugin): void {
    pluginRegistry.push(plugin);
}

/**
 * Unregister a keyboard plugin
 * @param key - The key pattern to remove
 */
export function unregisterKeyboardPlugin(key: string): void {
    const index = pluginRegistry.findIndex((plugin) => plugin.key === key);
    if (index > -1) {
        pluginRegistry.splice(index, 1);
    }
}
