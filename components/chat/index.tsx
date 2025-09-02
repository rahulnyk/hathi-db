"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { HashLoader } from "react-spinners";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    setStatus,
    selectDisplayToolInfo,
    selectIsProcessing,
    AgentStatus,
} from "@/store/agentSlice";
import { useSharedChatContext } from "@/lib/chat-context";

import { HathiIcon } from "../icon";
import { TextPartRenderer } from "./renderers/text-part-renderer";
import { ToolResultRenderer } from "./renderers/tool-results-renderer";
import type {
    UIMessagePart,
    UIDataTypes,
    UITools,
    ToolUIPart,
    DynamicToolUIPart,
    TextUIPart,
} from "ai";
import { ReasoningPart } from "@ai-sdk/provider-utils";
import Placeholder from "./placeholder";
import { AnswerRenderer } from "./renderers/answer-tool-renderer";
import { AnswerToolInput } from "@/app/agent_tools/types";

export interface ChatComponentProps {
    className?: string;
    showHeader?: boolean; // Control whether to show the header
    showInput?: boolean; // Control whether to show the input
}

export function ChatComponent({ className }: ChatComponentProps) {
    const dispatch = useAppDispatch();
    const displayToolInfo = useAppSelector(selectDisplayToolInfo);
    const isProcessing = useAppSelector(selectIsProcessing);

    // Always use shared chat context
    const { chat } = useSharedChatContext();
    const chatHook = useChat({ chat });

    // Use the chatHook from shared context
    const { messages, status, error } = chatHook;

    // Auto-scroll refs and logic
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);
    const prevIsProcessingRef = useRef(isProcessing);

    console.log("Chat status:", status);
    console.log("Chat messages:", messages);

    // Update Redux state when chat status changes
    useEffect(() => {
        dispatch(setStatus(status as AgentStatus));
    }, [status, dispatch]);

    // Function to scroll to bottom
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;

            // Helper function to perform the actual scroll
            const performScroll = () => {
                const lastMessage =
                    container.lastElementChild?.lastElementChild;
                if (lastMessage) {
                    lastMessage.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                    });
                } else {
                    // Fallback to container scroll
                    container.scrollTop = container.scrollHeight;
                }
            };

            // Use requestAnimationFrame to ensure DOM is updated before scrolling
            requestAnimationFrame(() => {
                performScroll();
                // Add a small delay for any dynamic content (like tool results) to render
                setTimeout(performScroll, 100);
            });
        }
    };

    // Auto-scroll when new messages are added
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            scrollToBottom();
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Auto-scroll when processing completes (response is fully streamed)
    useEffect(() => {
        if (prevIsProcessingRef.current && !isProcessing) {
            // Processing just finished, scroll to see the complete response
            scrollToBottom();
        }
        prevIsProcessingRef.current = isProcessing;
    }, [isProcessing]);

    return (
        <div
            className={cn(
                "w-full flex flex-col min-h-0 overflow-hidden",
                className ||
                    "max-w-4xl mx-auto h-[100dvh] sm:h-[700px] sm:max-h-[80vh]"
            )}
        >
            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 p-2 sm:p-4 overflow-y-auto min-h-0 smooth-scroll"
            >
                <div className="space-y-3 sm:space-y-4">
                    {messages.length === 0 && <Placeholder />}

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
                        />
                    </div>
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
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                <div
                    className={cn("accent-font text-bold text-sm sm:text-base")}
                >
                    {message.role === "user" ? "You" : "Hathi"}
                </div>

                <div className="space-y-2 sm:space-y-3">
                    {message.parts.map((part, index) => (
                        <MessagePartRenderer
                            key={`${message.id}-${index}`}
                            part={part}
                            displayToolInfo={displayToolInfo}
                            isUserMessage={message.role === "user"}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Message part renderer with proper type handling
function MessagePartRenderer({
    part,
    displayToolInfo,
    isUserMessage,
}: {
    part: UIMessagePart<UIDataTypes, UITools>; // Use the actual UIMessage part type
    displayToolInfo: boolean;
    isUserMessage: boolean;
}) {
    console.log("Rendering message part:", part);

    // Handle text and reasoning parts
    if (part.type === "text" || part.type === "reasoning") {
        return (
            <TextPartRenderer
                part={part as TextUIPart | ReasoningPart}
                isUserMessage={isUserMessage}
            />
        );
    }

    // Handle tool parts (pattern: tool-{toolName} or dynamic-tool)
    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
        return (
            <ToolPartComponent
                part={part as ToolUIPart | DynamicToolUIPart}
                displayToolInfo={displayToolInfo}
            />
        );
    }

    // Handle data parts (pattern: data-{dataType})
    if (part.type.startsWith("data-")) {
        // For now, we don't render data parts, but you can add handling here
        return null;
    }

    // Handle source-like parts
    const sourceTypes = ["source-url", "source-document", "file", "step-start"];
    if (sourceTypes.includes(part.type)) {
        // For now, we don't render source parts, but you can add handling here
        return null;
    }

    // Fallback for unknown part types
    console.warn("Unknown message part type:", part.type, part);
    return null;
}

// Tool part component for AI SDK 5
function ToolPartComponent({
    part,
    displayToolInfo,
}: {
    part: ToolUIPart | DynamicToolUIPart; // Tool part with type 'tool-${toolName}' or 'data-${string}'
    displayToolInfo: boolean;
}) {
    console.log("Rendering tool part:", part);

    // Extract tool name from type (remove 'tool-' prefix)
    const toolName = part.type.startsWith("tool-")
        ? part.type.substring(5)
        : part.type;

    switch (part.state) {
        case "input-streaming":
        case "input-available":
            if (part.type === "tool-answer") {
                return (
                    <AnswerRenderer inputs={part.input as AnswerToolInput} />
                );
            }
            return displayToolInfo && <ToolCallIndicator toolName={toolName} />;
        case "output-available":
            return (
                <ToolResultRenderer
                    toolName={toolName}
                    result={part.output}
                    displayToolInfo={displayToolInfo}
                />
            );
        case "output-error":
            return <div>Error: {part.errorText}</div>;
    }
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
