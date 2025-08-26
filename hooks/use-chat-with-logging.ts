/**
 * Simple chat analytics and logging utilities
 */

import { useEffect, useRef } from "react";
import { UIMessage } from "ai";

interface ChatLogEntry {
    timestamp: string;
    event: string;
    chatId?: string;
    messageId?: string;
    data?: any;
    duration?: number;
}

/**
 * Hook to add analytics to any chat hook
 */
export function useChatAnalytics(
    chatHook: {
        id?: string;
        messages: UIMessage[];
        status: string;
        error?: Error;
    },
    options: {
        enableLogging?: boolean;
        logToConsole?: boolean;
        logToLocalStorage?: boolean;
    } = {}
) {
    const {
        enableLogging = true,
        logToConsole = true,
        logToLocalStorage = false,
    } = options;

    // Refs for timing and state tracking
    const startTimeRef = useRef<number | undefined>(undefined);
    const previousMessageCountRef = useRef(0);
    const previousStatusRef = useRef(chatHook.status);
    const sessionStartRef = useRef<number>(Date.now());

    /**
     * Log an event
     */
    const logEvent = (event: string, data?: any) => {
        if (!enableLogging) return;

        const logEntry: ChatLogEntry = {
            timestamp: new Date().toISOString(),
            event,
            chatId: chatHook.id || undefined,
            data,
            ...data,
        };

        if (logToConsole) {
            console.log(`[CHAT-CLIENT] ${event}:`, logEntry);
        }

        if (logToLocalStorage) {
            try {
                const logs = JSON.parse(
                    localStorage.getItem("chat-logs") || "[]"
                );
                logs.push(logEntry);

                // Keep only last 100 logs to prevent storage overflow
                if (logs.length > 100) {
                    logs.splice(0, logs.length - 100);
                }

                localStorage.setItem("chat-logs", JSON.stringify(logs));
            } catch (error) {
                console.warn("Failed to save log to localStorage:", error);
            }
        }
    };

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
    }, [chatHook.status]);

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
    }, [chatHook.messages]);

    // Monitor errors
    useEffect(() => {
        if (chatHook.error) {
            logEvent("chat_error_state", {
                error: chatHook.error.message,
                errorType: chatHook.error.constructor.name,
            });
        }
    }, [chatHook.error]);

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
        logCustomEvent: (event: string, data?: any) => {
            logEvent(event, data);
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

        /**
         * Get logs from localStorage
         */
        getLogs: () => {
            if (!logToLocalStorage) return [];
            try {
                return JSON.parse(localStorage.getItem("chat-logs") || "[]");
            } catch {
                return [];
            }
        },

        /**
         * Clear logs from localStorage
         */
        clearLogs: () => {
            if (logToLocalStorage) {
                localStorage.removeItem("chat-logs");
            }
        },

        /**
         * Export logs as CSV
         */
        exportLogsAsCSV: () => {
            if (!logToLocalStorage) return "";

            const logs = (() => {
                if (!logToLocalStorage) return [];
                try {
                    return JSON.parse(
                        localStorage.getItem("chat-logs") || "[]"
                    );
                } catch {
                    return [];
                }
            })();

            if (logs.length === 0) return "";

            const headers = [
                "timestamp",
                "event",
                "chatId",
                "messageId",
                "data",
            ];
            const csvContent = [
                headers.join(","),
                ...logs.map((log: ChatLogEntry) =>
                    [
                        log.timestamp,
                        log.event,
                        log.chatId || "",
                        log.messageId || "",
                        JSON.stringify(log.data || "").replace(/"/g, '""'),
                    ].join(",")
                ),
            ].join("\n");

            return csvContent;
        },

        /**
         * Get analytics summary
         */
        getAnalytics: () => {
            const logs = (() => {
                if (!logToLocalStorage) return [];
                try {
                    return JSON.parse(
                        localStorage.getItem("chat-logs") || "[]"
                    );
                } catch {
                    return [];
                }
            })();

            return {
                totalSessions: new Set(
                    logs.map((log: ChatLogEntry) => log.chatId)
                ).size,
                totalMessages: logs.filter(
                    (log: ChatLogEntry) => log.event === "message_added"
                ).length,
                totalErrors: logs.filter((log: ChatLogEntry) =>
                    log.event.includes("error")
                ).length,
                messagesByRole: logs
                    .filter(
                        (log: ChatLogEntry) => log.event === "message_added"
                    )
                    .reduce(
                        (acc: Record<string, number>, log: ChatLogEntry) => {
                            const role = log.data?.messageRole || "unknown";
                            acc[role] = (acc[role] || 0) + 1;
                            return acc;
                        },
                        {}
                    ),
                errorTypes: logs
                    .filter((log: ChatLogEntry) => log.event.includes("error"))
                    .reduce(
                        (acc: Record<string, number>, log: ChatLogEntry) => {
                            const errorType = log.data?.errorType || "unknown";
                            acc[errorType] = (acc[errorType] || 0) + 1;
                            return acc;
                        },
                        {}
                    ),
            };
        },
    };
}
