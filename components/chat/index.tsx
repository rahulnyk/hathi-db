"use client";

import React, { useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
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
    const chat = useChat({
        api: "/api/chat",
    });

    const { messages, input, handleInputChange, handleSubmit, status } =
        chatHook || chat;

    console.log("Chat status:", status);
    console.log("Chat messages:", messages);

    // Update Redux state when chat status changes
    useEffect(() => {
        dispatch(setStatus(status as AgentStatus));
    }, [status, dispatch]);

    return (
        <div
            className={cn(
                "w-full flex flex-col min-h-0 overflow-hidden",
                className ||
                    "max-w-4xl mx-auto h-[100dvh] sm:h-[700px] sm:max-h-[80vh]"
            )}
        >
            {!chatHook && (
                <div className="border-b p-2 sm:p-4 flex justify-between items-center min-h-[50px] sm:min-h-[60px] flex-shrink-0">
                    {/* Header with settings */}
                    <div className="flex items-center">
                        <div className="flex items-center">
                            <span className="text-xs sm:text-sm mr-2">
                                Tool Info
                            </span>
                            <button
                                onClick={() =>
                                    dispatch(toggleDisplayToolInfo())
                                }
                                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    displayToolInfo ? "bg-primary" : "bg-input"
                                }`}
                            >
                                <span
                                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-background transition-transform ${
                                        displayToolInfo
                                            ? "translate-x-5 sm:translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 p-2 sm:p-4 overflow-y-auto min-h-0">
                <div className="space-y-3 sm:space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-4 sm:py-8 px-2">
                            <HathiIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                            <p className="mb-2 text-sm sm:text-base">
                                Start a conversation with Hathi
                            </p>
                            <div className="text-xs space-y-1">
                                <p>Try asking:</p>
                                <div className="space-y-1 text-muted-foreground/70">
                                    <p>• Show me notes from last week</p>
                                    <p>• Find notes about React</p>
                                    <p>• What contexts do I have?</p>
                                    <p className="hidden sm:block">
                                        • Show me all my todo notes
                                    </p>
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

            {/* Footer with Hathi icon and input area */}
            {isProcessing && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 flex-shrink-0">
                    <HathiIcon className="hathi-icon h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
                    {isProcessing && (
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground min-w-0">
                            <span className="text-xs whitespace-nowrap">
                                {status === "submitted"
                                    ? "Thinking..."
                                    : "Generating..."}
                            </span>
                            <HashLoader
                                size={16}
                                color="currentColor"
                                loading={true}
                                className="sm:hidden"
                            />
                            <HashLoader
                                size={20}
                                color="currentColor"
                                loading={true}
                                className="hidden sm:block"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Input area */}
            {!chatHook && (
                <div className="border-t p-2 sm:p-4 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask about your notes..."
                            disabled={isProcessing}
                            className="flex-1 text-sm sm:text-base"
                        />
                        <Button
                            type="submit"
                            disabled={isProcessing || !input.trim()}
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
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
                "flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg",
                message.role === "user"
                    ? "bg-primary/10 ml-2 sm:ml-4 md:ml-8"
                    : "bg-muted mr-2 sm:mr-4 md:mr-8"
            )}
        >
            {/* <div
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
                    <HathiIcon className="h-4 w-4" />
                )}
            </div> */}
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                <div
                    className={cn("accent-font text-bold text-sm sm:text-base")}
                >
                    {message.role === "user" ? "You" : "Hathi"}
                </div>
                <MessageContent
                    message={message}
                    displayToolInfo={displayToolInfo}
                    isUserMessage={message.role === "user"}
                />
            </div>
        </div>
    );
}

// Message content renderer
function MessageContent({
    message,
    displayToolInfo,
    isUserMessage,
}: {
    message: UIMessage;
    displayToolInfo: boolean;
    isUserMessage: boolean;
}) {
    if (messageHasParts(message)) {
        return (
            <div className="space-y-2 sm:space-y-3">
                {message.parts.map((part, index) => (
                    <MessagePartRenderer
                        key={index}
                        part={part}
                        displayToolInfo={displayToolInfo}
                        isUserMessage={isUserMessage}
                    />
                ))}
            </div>
        );
    }

    if (message.content) {
        return (
            <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
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
    isUserMessage,
}: {
    part: MessagePart;
    displayToolInfo: boolean;
    isUserMessage: boolean;
}) {
    const displayText = {
        reasoning: "Thinking",
        source: "...",
        file: "...",
        "step-start": "Thinking...",
    };
    switch (part.type) {
        case "text":
            return (
                <TextPartRenderer part={part} isUserMessage={isUserMessage} />
            );

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
                <div className="text-muted-foreground text-xs p-2 bg-muted/30 rounded border-b-2 border-muted-foreground/20 break-words">
                    {displayText[part.type]} - {part.type}
                </div>
            ) : null;

        default:
            return (
                <div className="text-xs text-muted-foreground break-words">
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
                Done gathering logs{" "}
                <span className="text-base sm:text-lg"> 🪵 </span>
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
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-center gap-1 sm:gap-2">
            {agentStatus != "error" && agentStatus != "idle" && (
                <>
                    <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                    <span className="truncate">{getToolMessage(toolName)}</span>
                </>
            )}
        </div>
    );
}

export default ChatComponent;
