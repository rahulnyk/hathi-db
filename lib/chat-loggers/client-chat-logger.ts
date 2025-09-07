/**
 * Simple chat analytics and logging utilities
 */

import { useEffect, useRef, useCallback } from "react";
import { UIMessage } from "ai";

interface ChatLogEntry {
    timestamp: string;
    event: string;
    chatId?: string;
    messageId?: string;
    data?: Record<string, unknown>;
    duration?: number;
}

/**
 * Determine if logging should be enabled based on environment
 */
function shouldLog(isError: boolean = false): boolean {
    // In production, only log errors
    if (process.env.NODE_ENV === "production") {
        return isError;
    }
    // In development, log everything
    return process.env.NODE_ENV === "development";
}

/**
 * Determine if console logging is enabled
 */
function shouldLogToConsole(): boolean {
    return process.env.NEXT_PUBLIC_LOG_CHAT_TO_CONSOLE === "true";
}

/**
 * Hook to add analytics to any chat hook
 */
export function useChatAnalytics(chatHook: {
    id?: string;
    messages: UIMessage[];
    status: string;
    error?: Error;
}) {
    // Refs for timing and state tracking
    const startTimeRef = useRef<number | undefined>(undefined);
    const previousMessageCountRef = useRef(0);
    const previousStatusRef = useRef(chatHook.status);
    const sessionStartRef = useRef<number>(Date.now());

    /**
     * Log an event
     */
    const logEvent = useCallback(
        (
            event: string,
            data?: Record<string, unknown>,
            isError: boolean = false
        ) => {
            if (!shouldLog(isError)) return;

            const logEntry: ChatLogEntry = {
                timestamp: new Date().toISOString(),
                event,
                chatId: chatHook.id || undefined,
                data,
                ...data,
            };

            if (shouldLogToConsole()) {
                console.log(`[CHAT-CLIENT] ${event}:`, logEntry);
            }
        },
        [chatHook.id]
    );

    // Monitor status changes
    useEffect(() => {
        if (chatHook.status !== previousStatusRef.current) {
            logEvent("status_change", {
                from: previousStatusRef.current,
                to: chatHook.status,
            });

            // Track timing for submissions
            if (
                chatHook.status === "submitted" ||
                chatHook.status === "streaming"
            ) {
                startTimeRef.current = Date.now();
            } else if (chatHook.status === "ready" && startTimeRef.current) {
                const duration = Date.now() - startTimeRef.current;
                logEvent("request_complete", { duration });
                startTimeRef.current = undefined;
            }

            previousStatusRef.current = chatHook.status;
        }
    }, [chatHook.status, logEvent]);

    // Monitor message changes
    useEffect(() => {
        if (chatHook.messages.length !== previousMessageCountRef.current) {
            const newMessages = chatHook.messages.slice(
                previousMessageCountRef.current
            );
            newMessages.forEach((message) => {
                logEvent("message_added", {
                    messageId: message.id,
                    messageRole: message.role,
                    messageLength: message.parts?.length || 0,
                    totalMessages: chatHook.messages.length,
                });
            });
            previousMessageCountRef.current = chatHook.messages.length;
        }
    }, [chatHook.messages, logEvent]);

    // Monitor errors
    useEffect(() => {
        if (chatHook.error) {
            logEvent(
                "chat_error_state",
                {
                    error: chatHook.error.message,
                    errorType: chatHook.error.constructor.name,
                },
                true
            ); // Mark as error
        }
    }, [chatHook.error, logEvent]);

    // Log session start
    useEffect(() => {
        logEvent("session_start", {
            chatId: chatHook.id,
            timestamp: sessionStartRef.current,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    return {
        /**
         * Log a custom event
         */
        logCustomEvent: (
            event: string,
            data?: Record<string, unknown>,
            isError: boolean = false
        ) => {
            logEvent(event, data, isError);
        },

        /**
         * Get session metrics
         */
        getSessionMetrics: () => {
            const sessionDuration = Date.now() - sessionStartRef.current;
            return {
                sessionDuration,
                messageCount: chatHook.messages.length,
                currentStatus: chatHook.status,
                hasError: !!chatHook.error,
                sessionId: chatHook.id,
            };
        },
    };
}
