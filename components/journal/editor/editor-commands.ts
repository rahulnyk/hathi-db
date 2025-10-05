/**
 * Editor Command Manager
 * Extensible system for handling editor commands in a plugin-like manner
 */

import type { EditorContext } from "@/hooks/editor-context";

// Q&A and Notes command constants
export const QA_COMMAND = "/q or qq";
export const NOTES_COMMAND = "/n or nn";

/**
 * Command interface for extensibility
 *
 * Defines the structure for editor commands that can be processed
 * when users type specific patterns.
 */
export interface EditorCommand {
    /** Command patterns to match */
    patterns: string[];
    /** Maximum length for command recognition */
    maxLength: number;
    /** Handler function that receives editor context */
    handler: (context: EditorContext) => boolean;
}

/**
 * Switch to assistant/chat mode command
 *
 * Activates chat mode and clears current content.
 */
const chatModeCommand: EditorCommand = {
    patterns: ["/q", "qq"],
    maxLength: 3,
    handler: (context) => {
        context.actions.setChatMode(true);
        context.actions.setContent("");
        context.actions.clearDraft();
        return true;
    },
};

/**
 * Switch to notes mode command
 *
 * Deactivates chat mode and clears current content.
 */
const notesModeCommand: EditorCommand = {
    patterns: ["/n", "nn"],
    maxLength: 3,
    handler: (context) => {
        setTimeout(() => {
            context.actions.setChatMode(false);
            context.actions.setContent("");
            context.actions.clearDraft();
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
 * Processes editor commands based on user input
 *
 * Checks if the input matches any registered command patterns and executes
 * the corresponding handler if found.
 *
 * @param input - The current input value to check for commands
 * @param context - Editor context for command execution
 * @returns true if a command was processed, false otherwise
 */
export function processEditorCommands(
    input: string,
    context: EditorContext
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
            return command.handler(context);
        }
    }

    return false;
}

/**
 * Add a new command to the registry (for future extensibility)
 *
 * @param command - The command to add to the registry
 */
export function registerCommand(command: EditorCommand): void {
    commandRegistry.push(command);
}

/**
 * Remove a command from the registry
 *
 * @param patterns - Command patterns to remove from the registry
 */
export function unregisterCommand(patterns: string[]): void {
    const index = commandRegistry.findIndex((cmd) =>
        cmd.patterns.some((pattern) => patterns.includes(pattern))
    );
    if (index > -1) {
        commandRegistry.splice(index, 1);
    }
}
