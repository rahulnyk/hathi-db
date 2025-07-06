"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteCard } from "@/components/journal/note_card/notes-card";
import ReactMarkdown from "react-markdown";
import { useAppDispatch } from "@/store";
import {
    addSearchResultNotes,
    clearSearchResultNotes,
} from "@/store/notesSlice";
import {
    SearchToolResponse,
    SearchResultNote,
    SummarizeToolResponse,
    AnswerToolResponse,
} from "@/app/agent_tools/types";

import { hasNonEmptyParts } from "./utils";
import { UIMessage } from "ai";

// Component to handle search results and temporary notes
function SearchResultsDisplay({
    searchResult,
    toolInfoHeader,
}: {
    searchResult: SearchToolResponse;
    toolInfoHeader: React.ReactNode;
}) {
    const dispatch = useAppDispatch();

    // Add search results to the store as search result notes so they can be edited
    useEffect(() => {
        const tempNotes = searchResult.notes.map((note: SearchResultNote) => ({
            ...note,
            persistenceStatus: "persisted" as const,
        }));
        dispatch(addSearchResultNotes(tempNotes));

        // Cleanup function to remove these specific search result notes when component unmounts
        return () => {
            const noteIds = tempNotes.map((note) => note.id);
            dispatch(clearSearchResultNotes(noteIds));
        };
    }, [searchResult.notes, dispatch]);

    return (
        <div>
            {toolInfoHeader}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResult.notes.map((note: SearchResultNote) => (
                    <div key={note.id} className="relative">
                        <NoteCard note={note} />
                        {note.similarity && (
                            <div className="absolute top-2 right-2 text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                {(note.similarity * 100).toFixed(0)}% match
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Tool invocation data types
interface ToolInvocationData {
    toolName: string;
    state: "call" | "result";
    result?: unknown;
    args?: Record<string, unknown>;
}

// Message part types
interface ToolInvocationPart {
    type: "tool-invocation";
    toolInvocation: ToolInvocationData;
}

interface TextPart {
    type: "text";
    text: string;
}

type MessagePart =
    | ToolInvocationPart
    | TextPart
    | { type: string; [key: string]: unknown };

export function ChatComponent() {
    const [displayToolInfo, setDisplayToolInfo] = useState(false);

    const { messages, input, handleInputChange, handleSubmit, status } =
        useChat({
            api: "/api/chat",
        });

    const isProcessing = status === "submitted" || status === "streaming";

    return (
        <div className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
            {/* Header with settings */}
            <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisplayToolInfo(!displayToolInfo)}
                    className="flex items-center gap-2"
                >
                    <Settings className="h-4 w-4" />
                    {displayToolInfo ? "Hide" : "Show"} Tool Info
                </Button>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="mb-2">
                                Start a conversation with the AI assistant
                            </p>
                            <div className="text-xs space-y-1">
                                <p>Try asking:</p>
                                <div className="space-y-1 text-muted-foreground/70">
                                    <p>• Show me notes from last week</p>
                                    <p>• Find notes about React</p>
                                    <p>• What contexts do I have?</p>
                                    <p>• Show me all my todo notes</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            displayToolInfo={displayToolInfo}
                        />
                    ))}

                    {isProcessing && (
                        <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-foreground text-muted flex items-center justify-center">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="text-sm text-muted-foreground">
                                    AI Assistant
                                </div>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-muted-foreground">
                                        {status === "submitted"
                                            ? "Thinking..."
                                            : "Generating response..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input area */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask me to find your notes... (e.g., 'show me notes from last week about work')"
                        disabled={isProcessing}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isProcessing || !input.trim()}
                        size="icon"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// Individual chat message component
function ChatMessage({
    message,
    displayToolInfo,
}: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    message: any;
    displayToolInfo: boolean;
}) {
    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg",
                message.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"
            )}
        >
            <div
                className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground text-muted"
                )}
            >
                {message.role === "user" ? (
                    <User className="h-4 w-4" />
                ) : (
                    <Bot className="h-4 w-4" />
                )}
            </div>
            <div className="flex-1 space-y-3">
                <div className="text-sm text-muted-foreground">
                    {message.role === "user" ? "You" : "AI Assistant"}
                </div>
                <MessageContent
                    message={message}
                    displayToolInfo={displayToolInfo}
                />
            </div>
        </div>
    );
}

// Message content renderer
function MessageContent({
    message,
    displayToolInfo,
}: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    message: UIMessage;
    displayToolInfo: boolean;
}) {
    if (hasNonEmptyParts(message)) {
        return (
            <div className="space-y-3">
                {renderMessageParts(message.parts, displayToolInfo)}
            </div>
        );
    }

    if (message.content) {
        return (
            <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content}
            </div>
        );
    }

    return null;
}

// Render message parts with deduplication
function renderMessageParts(parts: MessagePart[], displayToolInfo: boolean) {
    const processedTools = new Map<string, ToolInvocationData>();
    const renderedParts: React.ReactElement[] = [];

    // First pass: identify final tool states
    parts.forEach((part) => {
        if (isToolInvocationPart(part)) {
            const { toolName, state, result } = part.toolInvocation;
            if (state === "result" && result) {
                processedTools.set(toolName, part.toolInvocation);
            }
        }
    });

    // Check if we have a provideAnswer tool result
    const hasProvideAnswer = processedTools.has("provideAnswer");

    // Second pass: render parts without duplicates
    const shownToolResults = new Set<string>();

    parts.forEach((part, index) => {
        if (part.type === "text" && "text" in part) {
            // Skip text parts if we have a provideAnswer tool result,
            // as the provideAnswer tool contains the final response
            if (!hasProvideAnswer) {
                renderedParts.push(
                    <TextMessagePart
                        key={`text-${index}`}
                        part={part as TextPart}
                    />
                );
            }
        } else if (isToolInvocationPart(part)) {
            const { toolName, state } = part.toolInvocation;

            if (state === "call" && displayToolInfo) {
                renderedParts.push(
                    <ToolCallPart
                        key={`tool-call-${toolName}-${index}`}
                        toolName={toolName}
                    />
                );
            } else if (state === "result" && !shownToolResults.has(toolName)) {
                const finalResult = processedTools.get(toolName);
                if (finalResult) {
                    renderedParts.push(
                        <ToolResultPart
                            key={`tool-result-${toolName}`}
                            toolInvocation={finalResult}
                            displayToolInfo={displayToolInfo}
                        />
                    );
                    shownToolResults.add(toolName);
                }
            }
        }
    });

    return renderedParts;
}

// Text message part component
function TextMessagePart({ part }: { part: TextPart }) {
    if (!part.text) return null;

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
            {part.text}
        </div>
    );
}

// Tool call indicator component
function ToolCallPart({ toolName }: { toolName: string }) {
    const getToolMessage = (tool: string) => {
        switch (tool) {
            case "filterNotes":
                return "Searching your notes...";
            case "searchNotesBySimilarity":
                return "Finding related notes using AI...";
            case "getFilterOptions":
                return "Getting available filter options...";
            case "summarizeNotes":
                return "Generating summary...";
            case "provideAnswer":
                return "Preparing response...";
            default:
                return "Processing...";
        }
    };

    return (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            {getToolMessage(toolName)}
        </div>
    );
}

// Tool result component
function ToolResultPart({
    toolInvocation,
    displayToolInfo,
}: {
    toolInvocation: ToolInvocationData;
    displayToolInfo: boolean;
}) {
    const { toolName, result } = toolInvocation;

    // Tool info header (only shown if displayToolInfo is true)
    const toolInfoHeader = displayToolInfo && (
        <>
            <div className="text-xs text-muted-foreground/60 font-mono mb-2">
                {toolName}
            </div>
            <hr className="border-t border-muted-foreground/20 mb-3" />
        </>
    );

    // Handle search tools - render note cards
    if (toolName === "filterNotes" || toolName === "searchNotesBySimilarity") {
        const searchResult = result as SearchToolResponse;

        if (!searchResult?.success) {
            return (
                <div>
                    {toolInfoHeader}
                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                        {searchResult?.message || "Failed to search notes"}
                    </div>
                </div>
            );
        }

        if (!searchResult.notes || searchResult.notes.length === 0) {
            return (
                <div>
                    {toolInfoHeader}
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
                        No notes found matching your criteria
                    </div>
                </div>
            );
        }

        // Add search results to the store as temporary notes so they can be edited
        return (
            <SearchResultsDisplay
                searchResult={searchResult}
                toolInfoHeader={toolInfoHeader}
            />
        );
    }

    // Handle getFilterOptions - don't display to user
    if (toolName === "getFilterOptions") {
        return null;
    }

    // Handle summarizeNotes - render as markdown
    if (toolName === "summarizeNotes") {
        const summarizeResult = result as SummarizeToolResponse;

        if (!summarizeResult?.success || !summarizeResult.summary) {
            return (
                <div>
                    {toolInfoHeader}
                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                        {summarizeResult?.message ||
                            "Failed to generate summary"}
                    </div>
                </div>
            );
        }

        return (
            <div>
                {toolInfoHeader}
                <div className="prose prose-sm max-w-none dark:prose-invert p-3 bg-card rounded border">
                    <ReactMarkdown>{summarizeResult.summary}</ReactMarkdown>
                </div>
            </div>
        );
    }

    // Handle provideAnswer - render as markdown
    if (toolName === "provideAnswer") {
        const answerResult = result as AnswerToolResponse;

        if (!answerResult?.success || !answerResult.answer) {
            return (
                <div>
                    {toolInfoHeader}
                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                        Failed to provide answer
                    </div>
                </div>
            );
        }

        return (
            <div>
                {toolInfoHeader}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{answerResult.answer}</ReactMarkdown>
                </div>
            </div>
        );
    }

    // Fallback for unknown tools
    return displayToolInfo ? (
        <div>
            {toolInfoHeader}
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                Unknown tool result
            </div>
        </div>
    ) : null;
}

// Type guard for tool invocation parts
function isToolInvocationPart(part: MessagePart): part is ToolInvocationPart {
    return (
        typeof part === "object" &&
        part !== null &&
        part.type === "tool-invocation" &&
        "toolInvocation" in part &&
        typeof part.toolInvocation === "object" &&
        part.toolInvocation !== null &&
        "toolName" in part.toolInvocation &&
        "state" in part.toolInvocation &&
        typeof part.toolInvocation.toolName === "string" &&
        typeof part.toolInvocation.state === "string"
    );
}

export default ChatComponent;
