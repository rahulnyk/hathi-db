import { Dispatch } from "@reduxjs/toolkit";

/**
 * Bracket pairs configuration
 * Maps opening characters to their corresponding closing characters
 */
export const BRACKET_PAIRS: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "'": "'",
    "`": "`",
};

/**
 * Context passed to each plugin containing editor state and utilities
 */
export interface EditorPluginContext {
    /** Current content of the textarea */
    content: string;
    /** Current cursor position */
    cursorPosition: number;
    /** Selection start position */
    selectionStart: number;
    /** Selection end position */
    selectionEnd: number;
    /** Reference to the textarea element */
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    /** Redux dispatch function */
    dispatch: Dispatch;
    /** Whether editor is in edit mode (editing existing note) */
    isEditMode: boolean;
    /** Whether chat mode is active */
    chatMode: boolean;
    /** Whether submission is in progress */
    isSubmitting: boolean;
}

/**
 * Result returned by each plugin
 */
export interface PluginResult {
    /** Whether to continue executing remaining plugins */
    continue: boolean;
    /** Optional content replacement */
    updatedContent?: string;
    /** Optional cursor position update */
    updatedCursorPosition?: number;
    /** Whether the default event behavior should be prevented */
    preventDefault?: boolean;
}

/**
 * Plugin function signature
 * Takes event, context, and previous result, returns new result
 */
export type EditorPlugin = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    context: EditorPluginContext,
    previousResult: PluginResult
) => PluginResult;
