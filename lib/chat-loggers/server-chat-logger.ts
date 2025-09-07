/**
 * Comprehensive Chat Agent Logger
 * Uses AI SDK streamText hooks for monitoring chat interactions
 */

import fs from "fs";
import path from "path";

// Types for logging
interface ChatLogEntry {
    timestamp: string;
    eventType:
        | "chat_start"
        | "chat_finish"
        | "chat_error"
        | "step_finish"
        | "chunk_received"
        | "tool_call"
        | "abort";
    chatId?: string;
    messageId?: string;
    stepType?: "initial" | "continue" | "tool-result";
    finishReason?: string;
    duration_ms?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    toolName?: string;
    toolCallId?: string;
    errorMessage?: string;
    chunkType?: string;
    chunkSize?: number;
    status: "success" | "error" | "warning" | "info";
    metadata?: string;
}

interface ChatSessionMetrics {
    sessionStart: number;
    totalTokens: number;
    messageCount: number;
    toolCalls: number;
    errors: number;
    stepCount: number;
}

// In-memory session tracking
const activeSessions = new Map<string, ChatSessionMetrics>();

// File paths
const chatLogPath = path.join(process.cwd(), "chat_log.csv");
const sessionSummaryPath = path.join(
    process.cwd(),
    "chat_sessions_summary.csv"
);

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
    return process.env.LOG_CHAT_TO_SERVER === "true";
}

/**
 * Determine if CSV logging is enabled
 */
function shouldLogToCsv(): boolean {
    return process.env.LOG_CHAT_TO_CSV === "true";
}

/**
 * Writes log entry to CSV file
 */
async function writeLogToCsv(entry: ChatLogEntry) {
    if (!shouldLog(entry.status === "error") || !shouldLogToCsv()) {
        return;
    }

    const headers = [
        "timestamp",
        "eventType",
        "chatId",
        "messageId",
        "stepType",
        "finishReason",
        "duration_ms",
        "inputTokens",
        "outputTokens",
        "totalTokens",
        "toolName",
        "toolCallId",
        "errorMessage",
        "chunkType",
        "chunkSize",
        "status",
        "metadata",
    ];

    const row =
        headers
            .map((header) => {
                const value = entry[header as keyof ChatLogEntry];
                return value !== undefined ? String(value) : "";
            })
            .join(",") + "\n";

    try {
        if (!fs.existsSync(chatLogPath)) {
            fs.writeFileSync(chatLogPath, headers.join(",") + "\n");
        }
        fs.appendFileSync(chatLogPath, row);
    } catch (error) {
        console.error("Failed to write chat log to CSV:", error);
    }
}

/**
 * Writes session summary to CSV
 */
async function writeSessionSummary(
    chatId: string,
    metrics: ChatSessionMetrics
) {
    if (!shouldLog() || !shouldLogToCsv()) {
        return;
    }

    const duration = performance.now() - metrics.sessionStart;
    const headers = [
        "timestamp",
        "chatId",
        "sessionDuration_ms",
        "messageCount",
        "stepCount",
        "toolCalls",
        "totalTokens",
        "errors",
        "avgTokensPerMessage",
    ];

    const avgTokensPerMessage =
        metrics.messageCount > 0
            ? Math.round(metrics.totalTokens / metrics.messageCount)
            : 0;

    const summary = {
        timestamp: new Date().toISOString(),
        chatId,
        sessionDuration_ms: Math.round(duration),
        messageCount: metrics.messageCount,
        stepCount: metrics.stepCount,
        toolCalls: metrics.toolCalls,
        totalTokens: metrics.totalTokens,
        errors: metrics.errors,
        avgTokensPerMessage,
    };

    const row =
        headers
            .map((header) => summary[header as keyof typeof summary])
            .join(",") + "\n";

    try {
        if (!fs.existsSync(sessionSummaryPath)) {
            fs.writeFileSync(sessionSummaryPath, headers.join(",") + "\n");
        }
        fs.appendFileSync(sessionSummaryPath, row);
    } catch (error) {
        console.error("Failed to write session summary to CSV:", error);
    }
}

/**
 * Initialize session tracking
 */
function initializeSession(chatId: string) {
    if (!activeSessions.has(chatId)) {
        activeSessions.set(chatId, {
            sessionStart: performance.now(),
            totalTokens: 0,
            messageCount: 0,
            toolCalls: 0,
            errors: 0,
            stepCount: 0,
        });

        writeLogToCsv({
            timestamp: new Date().toISOString(),
            eventType: "chat_start",
            chatId,
            status: "info",
            metadata: "Session initialized",
        });
    }
}

/**
 * Update session metrics
 */
function updateSessionMetrics(
    chatId: string,
    updates: Partial<ChatSessionMetrics>
) {
    const session = activeSessions.get(chatId);
    if (session) {
        Object.assign(session, updates);
    }
}

/**
 * Complete session and write summary
 */
function completeSession(chatId: string) {
    const session = activeSessions.get(chatId);
    if (session) {
        writeSessionSummary(chatId, session);
        activeSessions.delete(chatId);
    }
}

/**
 * Create comprehensive chat logger hooks
 */
export function createChatLogger(chatId?: string) {
    const sessionId = chatId || `session_${Date.now()}`;

    // Initialize session
    initializeSession(sessionId);

    return {
        /**
         * Hook called when streaming starts
         */
        onStart: () => {
            if (shouldLogToConsole()) {
                console.log(`[CHAT] Starting chat session: ${sessionId}`);
            }

            writeLogToCsv({
                timestamp: new Date().toISOString(),
                eventType: "chat_start",
                chatId: sessionId,
                status: "info",
                metadata: "Chat streaming started",
            });
        },

        /**
         * Hook called for each chunk received during streaming
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChunk: ({ chunk }: { chunk: any }) => {
            const chunkType = chunk.type;
            const chunkSize = JSON.stringify(chunk).length;

            if (shouldLogToConsole()) {
                console.log(
                    `[CHAT] Chunk received: ${chunkType} (${chunkSize} bytes)`
                );
            }

            // Track tool calls
            if (chunkType === "tool-call") {
                updateSessionMetrics(sessionId, {
                    toolCalls:
                        (activeSessions.get(sessionId)?.toolCalls || 0) + 1,
                });

                writeLogToCsv({
                    timestamp: new Date().toISOString(),
                    eventType: "tool_call",
                    chatId: sessionId,
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    chunkType,
                    chunkSize,
                    status: "info",
                    metadata: `Tool call: ${chunk.toolName}`,
                });
            } else {
                writeLogToCsv({
                    timestamp: new Date().toISOString(),
                    eventType: "chunk_received",
                    chatId: sessionId,
                    chunkType,
                    chunkSize,
                    status: "info",
                });
            }
        },

        /**
         * Hook called when each step is finished
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStepFinish: (result: any) => {
            const {
                stepType,
                finishReason,
                usage,
                text,
                toolCalls,
                toolResults,
            } = result || {};

            if (shouldLogToConsole()) {
                console.log(
                    `[CHAT] Step finished: ${
                        stepType || "unknown"
                    } - ${finishReason}`
                );
                console.log(
                    `[CHAT] Token usage: ${usage?.totalTokens || 0} total (${
                        usage?.promptTokens || 0
                    } input, ${usage?.completionTokens || 0} output)`
                );
                console.log(
                    `[CHAT] Tool calls: ${
                        Array.isArray(toolCalls) ? toolCalls.length : 0
                    }, Tool results: ${
                        Array.isArray(toolResults) ? toolResults.length : 0
                    }`
                );
            }

            // Update session metrics
            updateSessionMetrics(sessionId, {
                stepCount: (activeSessions.get(sessionId)?.stepCount || 0) + 1,
                totalTokens:
                    (activeSessions.get(sessionId)?.totalTokens || 0) +
                    (usage?.totalTokens || 0),
            });

            writeLogToCsv({
                timestamp: new Date().toISOString(),
                eventType: "step_finish",
                chatId: sessionId,
                stepType: stepType || "unknown",
                finishReason,
                inputTokens: usage?.promptTokens,
                outputTokens: usage?.completionTokens,
                totalTokens: usage?.totalTokens,
                status: "success",
                metadata: `Text length: ${
                    typeof text === "string" ? text.length : 0
                }, Tools: ${Array.isArray(toolCalls) ? toolCalls.length : 0}/${
                    Array.isArray(toolResults) ? toolResults.length : 0
                }`,
            });
        },

        /**
         * Hook called when the entire response is finished
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onFinish: (result: any) => {
            const {
                finishReason,
                usage,
                text,
                toolCalls,
                toolResults,
                steps,
                totalUsage,
            } = result || {};
            const duration =
                performance.now() -
                (activeSessions.get(sessionId)?.sessionStart || 0);

            // Use totalUsage if available, otherwise fallback to usage
            const finalUsage = totalUsage || usage;

            if (shouldLogToConsole()) {
                console.log(`[CHAT] Chat finished: ${finishReason}`);
                console.log(
                    `[CHAT] Final token usage: ${
                        finalUsage?.totalTokens || 0
                    } total (${finalUsage?.promptTokens || 0} input, ${
                        finalUsage?.completionTokens || 0
                    } output)`
                );
                console.log(
                    `[CHAT] Final text length: ${
                        typeof text === "string" ? text.length : 0
                    } characters`
                );
                console.log(
                    `[CHAT] Session duration: ${Math.round(duration)}ms`
                );
                console.log(
                    `[CHAT] Total steps: ${
                        Array.isArray(steps) ? steps.length : 0
                    }`
                );
            }

            // Update session metrics
            updateSessionMetrics(sessionId, {
                messageCount:
                    (activeSessions.get(sessionId)?.messageCount || 0) + 1,
                totalTokens:
                    (activeSessions.get(sessionId)?.totalTokens || 0) +
                    (finalUsage?.totalTokens || 0),
            });

            writeLogToCsv({
                timestamp: new Date().toISOString(),
                eventType: "chat_finish",
                chatId: sessionId,
                finishReason,
                duration_ms: Math.round(duration),
                inputTokens: finalUsage?.promptTokens,
                outputTokens: finalUsage?.completionTokens,
                totalTokens: finalUsage?.totalTokens,
                status: "success",
                metadata: `Text: ${
                    typeof text === "string" ? text.length : 0
                }chars, Tools: ${
                    Array.isArray(toolCalls) ? toolCalls.length : 0
                }/${
                    Array.isArray(toolResults) ? toolResults.length : 0
                }, Steps: ${Array.isArray(steps) ? steps.length : 0}`,
            });

            // Complete session after a delay (in case of multiple rapid calls)
            setTimeout(() => completeSession(sessionId), 1000);
        },

        /**
         * Hook called when an error occurs
         */
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            const duration =
                performance.now() -
                (activeSessions.get(sessionId)?.sessionStart || 0);

            if (shouldLogToConsole()) {
                console.error(`[CHAT] Error occurred:`, error);
            }

            // Update session metrics
            updateSessionMetrics(sessionId, {
                errors: (activeSessions.get(sessionId)?.errors || 0) + 1,
            });

            writeLogToCsv({
                timestamp: new Date().toISOString(),
                eventType: "chat_error",
                chatId: sessionId,
                duration_ms: Math.round(duration),
                errorMessage,
                status: "error",
                metadata: `Error type: ${
                    error instanceof Error
                        ? error.constructor.name
                        : typeof error
                }`,
            });

            // Complete session on error
            setTimeout(() => completeSession(sessionId), 500);
        },

        /**
         * Hook called when streaming is aborted
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onAbort: (result: any) => {
            const duration =
                performance.now() -
                (activeSessions.get(sessionId)?.sessionStart || 0);

            const steps = result?.steps || [];

            if (shouldLogToConsole()) {
                console.log(
                    `[CHAT] Chat aborted after ${
                        Array.isArray(steps) ? steps.length : 0
                    } steps`
                );
            }

            writeLogToCsv({
                timestamp: new Date().toISOString(),
                eventType: "abort",
                chatId: sessionId,
                duration_ms: Math.round(duration),
                status: "warning",
                metadata: `Aborted after ${
                    Array.isArray(steps) ? steps.length : 0
                } steps`,
            });

            // Complete session on abort
            setTimeout(() => completeSession(sessionId), 500);
        },

        /**
         * Get current session metrics
         */
        getSessionMetrics: () => {
            return activeSessions.get(sessionId);
        },

        /**
         * Get session ID for reference
         */
        getSessionId: () => sessionId,
    };
}

/**
 * Get metrics for all active sessions
 */
export function getActiveSessionsMetrics() {
    return Object.fromEntries(activeSessions.entries());
}

/**
 * Clean up old sessions (call this periodically)
 */
export function cleanupOldSessions(maxAgeMs: number = 30 * 60 * 1000) {
    // 30 minutes default
    const now = performance.now();

    for (const [sessionId, metrics] of activeSessions.entries()) {
        if (now - metrics.sessionStart > maxAgeMs) {
            if (shouldLogToConsole()) {
                console.log(`[CHAT] Cleaning up old session: ${sessionId}`);
            }
            completeSession(sessionId);
        }
    }
}

// Export types for external use
export type { ChatLogEntry, ChatSessionMetrics };
