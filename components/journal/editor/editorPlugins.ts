/**
 * Editor Plugins - Keyboard Handler System
 * Extensible plugin system for handling keyboard events
 */

import React from "react";
import { AppDispatch } from "@/store";
import { updateDraftContent } from "@/store/draftSlice";
import {
    handleBracketInsertion,
    handleAutoDeleteBracketPair,
    BRACKET_PAIRS,
    ContextBracketInfo,
} from "./helpers";
import { useChat } from "@ai-sdk/react";

// Plugin context interface
export interface PluginContext {
    content: string;
    setContent: (content: string) => void;
    activeSelection: { start: number; end: number };
    setActiveSelection: (selection: { start: number; end: number }) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    dispatch: AppDispatch;
    isEditMode: boolean;
    isSubmitting: boolean;
    chatMode: boolean;
    chatHook?: ReturnType<typeof useChat>;
    handleSaveEdit: () => void;
    handleCreateNote: () => Promise<void>;
    // Context suggestion state
    contextBracketInfo?: ContextBracketInfo;
    handleCloseSuggestionBox?: () => void;
}

// Keyboard plugin interface
export interface KeyboardPlugin {
    // Key pattern to match
    key: string;
    // Optional modifier requirements
    modifiers?: {
        shift?: boolean;
        ctrl?: boolean;
        alt?: boolean;
        meta?: boolean;
    };
    // Handler function
    handler: (
        event: React.KeyboardEvent<HTMLTextAreaElement>,
        context: PluginContext
    ) => Promise<void> | void;
    // Whether this plugin should prevent further processing
    stopPropagation?: boolean;
}

/**
 * Enter key handler plugin
 */
const enterKeyPlugin: KeyboardPlugin = {
    key: "Enter",
    modifiers: { shift: false },
    stopPropagation: true,
    handler: async (event, context) => {
        // If context suggestion box is open, let it handle the enter key
        if (
            context.contextBracketInfo?.isInsideBrackets &&
            context.contextBracketInfo.searchTerm.length >= 2
        ) {
            // Don't prevent default here - let the suggestion box handle it
            return;
        }

        event.preventDefault();
        if (!context.content.trim() || context.isSubmitting) return;

        // If in chat mode and chatHook is provided, use chat instead of creating notes
        if (context.chatMode && context.chatHook && !context.isEditMode) {
            event.preventDefault();
            const form = event.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
            return;
        }

        if (context.isEditMode) {
            context.handleSaveEdit();
        } else {
            await context.handleCreateNote();
        }
    },
};

/**
 * Bracket key handler plugins - one for each bracket type
 */
const createBracketPlugin = (bracketKey: string): KeyboardPlugin => ({
    key: bracketKey,
    stopPropagation: true,
    handler: (event, context) => {
        event.preventDefault();

        const result = handleBracketInsertion(
            bracketKey,
            context.content,
            context.activeSelection,
            BRACKET_PAIRS
        );

        context.setContent(result.newValue);

        // Update draft for new notes
        if (!context.isEditMode) {
            context.dispatch(updateDraftContent(result.newValue));
        }

        requestAnimationFrame(() => {
            if (context.textareaRef.current) {
                context.textareaRef.current.setSelectionRange(
                    result.newSelectionStart,
                    result.newSelectionEnd
                );
                context.setActiveSelection({
                    start: result.newSelectionStart,
                    end: result.newSelectionEnd,
                });
            }
        });
    },
});

// Create individual bracket plugins
const leftSquareBracketPlugin = createBracketPlugin("[");
const leftParenPlugin = createBracketPlugin("(");
const leftCurlyBracePlugin = createBracketPlugin("{");
const leftAngleBracketPlugin = createBracketPlugin("<");

/**
 * Escape key handler plugin for context suggestions
 */
const escapeKeyPlugin: KeyboardPlugin = {
    key: "Escape",
    handler: (event, context) => {
        // If context suggestion box is open, close it
        if (
            context.contextBracketInfo?.isInsideBrackets &&
            context.handleCloseSuggestionBox
        ) {
            event.preventDefault();
            context.handleCloseSuggestionBox();
            return;
        }
    },
};

/**
 * Backspace key handler plugin
 */
const backspaceKeyPlugin: KeyboardPlugin = {
    key: "Backspace",
    handler: (event, context) => {
        const currentValue = context.content;
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
            context.setContent(deleteResult.newValue);

            // Update draft for new notes
            if (!context.isEditMode) {
                context.dispatch(updateDraftContent(deleteResult.newValue));
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
 * @param event - The keyboard event
 * @param context - Plugin execution context
 */
export async function processKeyboardEvent(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    context: PluginContext
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
