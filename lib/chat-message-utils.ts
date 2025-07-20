import { UIMessage } from "ai";
import { StoredMessage } from "@/store/chatSlice";

/**
 * Converts a UIMessage from the AI SDK to a StoredMessage for Redux storage.
 * Handles serialization of Date objects and maintains type safety.
 */
export function uiMessageToStoredMessage(message: UIMessage): StoredMessage {
    return {
        id: message.id,
        // Map system and data roles to assistant for storage consistency
        role:
            message.role === "system" || message.role === "data"
                ? "assistant"
                : message.role,
        content: message.content || "",
        createdAt: message.createdAt
            ? message.createdAt.toISOString()
            : undefined,
        parts: message.parts || undefined,
    };
}

/**
 * Converts a StoredMessage from Redux to a UIMessage for the AI SDK.
 * Handles deserialization of Date objects and maintains type safety.
 */
export function storedMessageToUIMessage(message: StoredMessage): UIMessage {
    // Handle messages with parts (complex AI responses)
    if (message.parts && message.parts.length > 0) {
        return {
            id: message.id,
            role: message.role,
            createdAt: message.createdAt
                ? new Date(message.createdAt)
                : undefined,
            parts: message.parts,
        } as UIMessage;
    }

    // Handle simple text messages
    return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
    } as UIMessage;
}

/**
 * Batch conversion utilities
 */
export function uiMessagesToStoredMessages(
    messages: UIMessage[]
): StoredMessage[] {
    return messages.map(uiMessageToStoredMessage);
}

export function storedMessagesToUIMessages(
    messages: StoredMessage[]
): UIMessage[] {
    return messages.map(storedMessageToUIMessage);
}
