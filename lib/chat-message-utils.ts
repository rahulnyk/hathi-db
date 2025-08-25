import { UIMessage } from "ai";
import { StoredMessage } from "@/store/chatSlice";

/**
 * Converts a UIMessage from the AI SDK to a StoredMessage for Redux storage.
 * Handles serialization of Date objects and maintains type safety.
 * In AI SDK 5, messages always use parts array instead of content property.
 */
export function uiMessageToStoredMessage(message: UIMessage): StoredMessage {
    // Extract text from parts for backward compatibility with storage
    const textParts = message.parts.filter((part) => part.type === "text");
    const content = textParts
        .map((part) => (part as { text: string }).text)
        .join("");

    return {
        id: message.id,
        role: message.role, // AI SDK 5 removed 'data' role, only has 'user' and 'assistant'
        content: content || "",
        createdAt: (message as unknown as { createdAt?: Date }).createdAt
            ? (
                  message as unknown as { createdAt: Date }
              ).createdAt.toISOString()
            : undefined,
        parts: message.parts || undefined,
    };
}

/**
 * Converts a StoredMessage from Redux to a UIMessage for the AI SDK.
 * Handles deserialization of Date objects and maintains type safety.
 * In AI SDK 5, we always create parts array even for simple text messages.
 */
export function storedMessageToUIMessage(message: StoredMessage): UIMessage {
    // Handle messages with parts (complex AI responses)
    if (message.parts && message.parts.length > 0) {
        return {
            id: message.id,
            role: message.role,
            parts: message.parts,
        } as UIMessage;
    }

    // Handle simple text messages - convert content to parts array
    const parts = message.content
        ? [{ type: "text" as const, text: message.content }]
        : [];

    return {
        id: message.id,
        role: message.role,
        parts: parts,
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
