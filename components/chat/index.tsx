"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, Bot, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/lib/date-utils";
import type { Note } from "@/store/notesSlice";
import { NoteCard } from "@/components/journal/note_card/notes-card";
import ReactMarkdown from "react-markdown";

export function ChatComponent() {
    const { messages, input, handleInputChange, handleSubmit, status } =
        useChat({
            api: "/api/chat",
        });

    // Check if the chat is currently processing
    const isProcessing = status === "submitted" || status === "streaming";

    return (
        <div className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
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
                                    <p>• "Show me notes from last week"</p>
                                    <p>• "Find notes about React"</p>
                                    <p>• "What contexts do I have?"</p>
                                    <p>• "Show me all my todo notes"</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3 p-3 rounded-lg",
                                message.role === "user"
                                    ? "bg-primary/10 ml-8"
                                    : "bg-muted mr-8"
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
                                    {message.role === "user"
                                        ? "You"
                                        : "AI Assistant"}
                                </div>
                                {/* Render message parts */}
                                {message.parts && message.parts.length > 0 ? (
                                    <div className="space-y-3">
                                        {message.parts.map((part, index) => (
                                            <MessagePart
                                                key={index}
                                                part={part}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    // Fallback to content for backward compatibility
                                    message.content && (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            {message.content}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
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

// Component to render individual message parts
function MessagePart({ part }: { part: any }) {
    switch (part.type) {
        case "text":
            return (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {part.text}
                </div>
            );

        case "tool-invocation":
            return (
                <ToolInvocationDisplay toolInvocation={part.toolInvocation} />
            );

        case "tool-result":
            // Tool results are typically handled within tool-invocation parts
            return null;

        default:
            return null;
    }
}

// Component to render filter results
function FilterResults({ result }: { result: any }) {
    if (!result || !result.success) {
        return (
            <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                {result?.message || "Failed to filter notes"}
            </div>
        );
    }

    const { notes, totalCount, appliedFilters, message } = result;

    return (
        <div className="space-y-3">
            <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                <FileText className="h-4 w-4 inline mr-1" />
                {message}
            </div>

            {Object.keys(appliedFilters).length > 1 && (
                <div className="text-xs text-muted-foreground">
                    <strong>Applied filters:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {appliedFilters.contexts && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                Contexts: {appliedFilters.contexts.join(", ")}
                            </span>
                        )}
                        {appliedFilters.hashtags && (
                            <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                Tags: {appliedFilters.hashtags.join(", ")}
                            </span>
                        )}
                        {appliedFilters.searchTerm && (
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                Search: "{appliedFilters.searchTerm}"
                            </span>
                        )}
                        {appliedFilters.noteType && (
                            <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                                Type: {appliedFilters.noteType}
                            </span>
                        )}
                        {(appliedFilters.createdAfter ||
                            appliedFilters.createdBefore) && (
                            <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                                {formatDateRange(
                                    appliedFilters.createdAfter,
                                    appliedFilters.createdBefore
                                )}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {notes && notes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notes.map((note: Note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                    No notes found matching the criteria
                </div>
            )}
        </div>
    );
}

// Component to render tool invocations
function ToolInvocationDisplay({ toolInvocation }: { toolInvocation: any }) {
    const { toolName, state, result } = toolInvocation;

    // Handle different tool invocation states
    if (state === "call") {
        // Tool is being called
        return (
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Calling {toolName}...
            </div>
        );
    }

    if (state === "result" || result) {
        // Tool has returned a result
        if (toolName === "filterNotes") {
            return <FilterResults result={result} />;
        }

        if (toolName === "getFilterOptions") {
            if (result?.success) {
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                            Available filter options:
                        </div>
                        <div className="grid gap-2 text-xs">
                            {result.availableContexts?.length > 0 && (
                                <div>
                                    <strong>Contexts:</strong>{" "}
                                    {result.availableContexts
                                        .slice(0, 10)
                                        .join(", ")}
                                    {result.availableContexts.length > 10 &&
                                        ` (+${
                                            result.availableContexts.length - 10
                                        } more)`}
                                </div>
                            )}
                            {result.availableHashtags?.length > 0 && (
                                <div>
                                    <strong>Hashtags:</strong>{" "}
                                    {result.availableHashtags
                                        .slice(0, 10)
                                        .join(", ")}
                                    {result.availableHashtags.length > 10 &&
                                        ` (+${
                                            result.availableHashtags.length - 10
                                        } more)`}
                                </div>
                            )}
                            {result.availableNoteTypes?.length > 0 && (
                                <div>
                                    <strong>Note Types:</strong>{" "}
                                    {result.availableNoteTypes.join(", ")}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        }

        if (toolName === "summarizeNotes") {
            if (result?.success) {
                return (
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                            <FileText className="h-4 w-4 inline mr-1" />
                            {result.message}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert p-3 bg-card rounded border">
                            <ReactMarkdown>{result.summary}</ReactMarkdown>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                        {result?.message || "Failed to generate notes summary"}
                    </div>
                );
            }
        }

        // Fallback for other tools or failed results
        return (
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                Tool: {toolName} {result?.success === false && "(failed)"}
            </div>
        );
    }

    // Fallback for unknown states
    return (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            Tool: {toolName} (unknown state)
        </div>
    );
}

// Export for easier importing
export default ChatComponent;
