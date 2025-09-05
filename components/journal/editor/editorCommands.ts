/**
 * Editor Command Manager
 * Extensible system for handling editor commands in a plugin-like manner
 */

import { AppDispatch } from "@/store";
import { setChatMode } from "@/store/uiSlice";
import { clearDraft } from "@/store/draftSlice";

// Command interface for extensibility
export interface EditorCommand {
    // Command patterns to match
    patterns: string[];
    // Maximum length for command recognition
    maxLength: number;
    // Handler function
    handler: (
        dispatch: AppDispatch,
        setContent: (content: string) => void
    ) => boolean;
}

/**
 * Switch to assistant/chat mode command
 */
const chatModeCommand: EditorCommand = {
    patterns: ["/q", "qq"],
    maxLength: 3,
    handler: (dispatch, setContent) => {
        dispatch(setChatMode(true));
        setContent("");
        dispatch(clearDraft());
        return true;
    },
};

/**
 * Switch to notes mode command
 */
const notesModeCommand: EditorCommand = {
    patterns: ["/n", "nn"],
    maxLength: 3,
    handler: (dispatch, setContent) => {
        setTimeout(() => {
            dispatch(setChatMode(false));
            setContent("");
            dispatch(clearDraft());
        }, 100);
        return true;
    },
};

// Registry of available commands - easily extensible
const commandRegistry: EditorCommand[] = [
    chatModeCommand,
    notesModeCommand,
    // Future commands can be added here
];

/**
 * Command manager interface
 */
export interface CommandManagerContext {
    dispatch: AppDispatch;
    setContent: (content: string) => void;
}

/**
 * Processes editor commands based on user input
 * @param input - The current input value
 * @param context - Command execution context
 * @returns true if a command was processed, false otherwise
 */
export function processEditorCommands(
    input: string,
    context: CommandManagerContext
): boolean {
    const trimmedContent = input.trim().toLowerCase();

    for (const command of commandRegistry) {
        // Check if input matches any of the command patterns
        const matchesPattern = command.patterns.some(
            (pattern) => trimmedContent === pattern
        );

        // Check if input length is within acceptable range
        const withinLength = input.length <= command.maxLength;

        if (matchesPattern && withinLength) {
            return command.handler(context.dispatch, context.setContent);
        }
    }

    return false;
}

/**
 * Add a new command to the registry (for future extensibility)
 * @param command - The command to add
 */
export function registerCommand(command: EditorCommand): void {
    commandRegistry.push(command);
}

/**
 * Remove a command from the registry
 * @param patterns - Command patterns to remove
 */
export function unregisterCommand(patterns: string[]): void {
    const index = commandRegistry.findIndex((cmd) =>
        cmd.patterns.some((pattern) => patterns.includes(pattern))
    );
    if (index > -1) {
        commandRegistry.splice(index, 1);
    }
}
