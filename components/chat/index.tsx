"use client";

import React, { useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { MessagePart, messageHasParts } from "./utils";
import { ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import { HashLoader } from "react-spinners";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    setStatus,
    toggleDisplayToolInfo,
    selectDisplayToolInfo,
    selectIsProcessing,
    AgentStatus,
} from "@/store/agentSlice";

import { HathiIcon } from "../icon";
import { TextPartRenderer } from "./renderers/text-part-renderer";
import { ToolResultRenderer } from "./renderers/tool-results-renderer";

export interface ChatComponentProps {
    chatHook?: ReturnType<typeof useChat>;
    className?: string;
}

export function ChatComponent({ chatHook, className }: ChatComponentProps) {
    const dispatch = useAppDispatch();
    const displayToolInfo = useAppSelector(selectDisplayToolInfo);
    const isProcessing = useAppSelector(selectIsProcessing);

    const { messages, input, handleInputChange, handleSubmit, status } =
        chatHook ||
        useChat({
            api: "/api/chat",
        });

    console.log("Chat status:", status);
    console.log("Chat messages:", messages);

    // Update Redux state when chat status changes
    useEffect(() => {
        dispatch(setStatus(status as AgentStatus));
    }, [status, dispatch]);

    return (
        <div
            className={cn(
                "w-full flex flex-col",
                className || "max-w-4xl mx-auto h-[700px]"
            )}
        >
            {!chatHook && (
                <div className="border-b p-4 flex justify-between items-center min-h-[60px]">
                    {/* Header with settings */}
                    <div className="flex items-center gap-3">
                        <HathiIcon className="hathi-icon h-8 w-8 text-muted-foreground" />
                        {isProcessing && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="text-xs whitespace-nowrap">
                                    {status === "submitted"
                                        ? "Thinking..."
                                        : "Generating response..."}
                                </span>
                                <HashLoader
                                    size={20}
                                    color="currentColor"
                                    loading={true}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <div className="flex items-center">
                            <span className="text-sm mr-2">Tool Info</span>
                            <button
                                onClick={() =>
                                    dispatch(toggleDisplayToolInfo())
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    displayToolInfo ? "bg-primary" : "bg-input"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 rounded-full bg-background transition-transform ${
                                        displayToolInfo
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                    {messages.map((message: UIMessage) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            displayToolInfo={displayToolInfo}
                        />
                    ))}
                </div>
            </div>

            {/* Input area */}
            {!chatHook && (
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
            )}
        </div>
    );
}

// Chat message component
function ChatMessage({
    message,
    displayToolInfo,
}: {
    message: UIMessage;
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
    message: UIMessage;
    displayToolInfo: boolean;
}) {
    if (messageHasParts(message)) {
        return (
            <div className="space-y-3">
                {message.parts.map((part, index) => (
                    <MessagePartRenderer
                        key={index}
                        part={part}
                        displayToolInfo={displayToolInfo}
                    />
                ))}
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

// Message part renderer with switch case
function MessagePartRenderer({
    part,
    displayToolInfo,
}: {
    part: MessagePart;
    displayToolInfo: boolean;
}) {
    const displayText = {
        reasoning: "Thinking",
        source: "...",
        file: "...",
        "step-start": "Thinking...",
    };
    switch (part.type) {
        case "text":
            return <TextPartRenderer part={part} />;

        case "tool-invocation":
            return (
                <ToolInvocationPartComponent
                    part={part as ToolInvocationUIPart}
                    displayToolInfo={displayToolInfo}
                />
            );

        case "reasoning":
        case "source":
        case "file":
        case "step-start":
            // Handle other part types if needed
            return displayToolInfo ? (
                <div className="text-muted-foreground text-xs p-2 bg-muted/30 rounded border-b-2 border-muted-foreground/20">
                    {displayText[part.type]} - {part.type}
                </div>
            ) : null;

        default:
            return (
                <div className="text-xs text-muted-foreground">
                    Unknown part type
                </div>
            );
    }
}

// Tool invocation part component
function ToolInvocationPartComponent({
    part,
    displayToolInfo,
}: {
    part: ToolInvocationUIPart;
    displayToolInfo: boolean;
}) {
    const { toolName, state } = part.toolInvocation;
    const result =
        "result" in part.toolInvocation
            ? part.toolInvocation.result
            : undefined;

    // Show tool call indicator if enabled
    if (state === "call" && displayToolInfo) {
        return <ToolCallIndicator toolName={toolName} />;
    }

    if (toolName === "answer") {
        return (
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">Hathi:</span> Done
            </div>
        );
    }

    // Show tool result
    if (state === "result" && result) {
        return (
            <ToolResultRenderer
                toolName={toolName}
                result={result}
                displayToolInfo={displayToolInfo}
            />
        );
    }

    return null;
}

// Tool call indicator
function ToolCallIndicator({ toolName }: { toolName: string }) {
    // const agentStatus = useAppSelector((state) => state.agent.status);
    const agentStatus = useAppSelector((state) => state.agent.status);
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
            case "answer":
                return "Done";
            default:
                return "Processing...";
        }
    };

    return (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-center gap-2">
            {agentStatus != "error" && agentStatus != "idle" && (
                <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {getToolMessage(toolName)}
                </>
            )}
        </div>
    );
}

export default ChatComponent;
