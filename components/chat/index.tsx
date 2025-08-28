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
import { useChatAnalytics } from "@/lib/chat-loggers/client-chat-logger";
export interface ChatComponentProps {
    className?: string;
    showHeader?: boolean; // Control whether to show the header
    showInput?: boolean; // Control whether to show the input
}

export function ChatComponent({ className }: ChatComponentProps) {
    const chatMode = useAppSelector((state) => state.ui.chatMode);
    const dispatch = useAppDispatch();
    const displayToolInfo = useAppSelector(selectDisplayToolInfo);
    const isProcessing = useAppSelector(selectIsProcessing);

    // Always use shared chat context
    const { chat } = useSharedChatContext();
    const chatHook = useChat({ chat });

    // Analytics //
    const analytics = useChatAnalytics(chatHook);
    useEffect(() => {
        if (chatMode) {
            analytics.logCustomEvent("chat_mode_activated");
        } else {
            analytics.logCustomEvent("chat_mode_deactivated");
        }
    }, [chatMode, analytics]);
    //

    // Use the chatHook from shared context
    const { messages, status } = chatHook;

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

// Message part renderer with regex-based case handling
function MessagePartRenderer({
    part,
    displayToolInfo,
    isUserMessage,
}: {
    part: UIMessagePart<UIDataTypes, UITools>; // Use the actual UIMessage part type
    displayToolInfo: boolean;
    isUserMessage: boolean;
}) {
    const { type } = part;
    const sourceTypes = ["source-url", "source-document", "file", "step-start"];

    // Helper function to get case pattern for regex-based switching
    const getCasePattern = (type: string) => {
        if (type === "text" || type === "reasoning") return "text-like";
        if (sourceTypes.includes(type)) return "source-like";
        if (/^data-/.test(type)) return "data-like";
        if (/^tool-/.test(type) || type === "dynamic-tool") return "tool-like";
        return "unknown";
    };

    switch (getCasePattern(type)) {
        case "text-like":
            return (
                <TextPartRenderer
                    part={part as TextUIPart | ReasoningPart}
                    isUserMessage={isUserMessage}
                />
            );
        case "tool-like":
            return (
                <ToolPartComponent
                    part={part as ToolUIPart | DynamicToolUIPart}
                    displayToolInfo={displayToolInfo}
                />
            );
        case "source-like":
        case "data-like":
        default:
            return null;
    }
}

// Tool part component for AI SDK 5
function ToolPartComponent({
    part,
    displayToolInfo,
}: {
    part: ToolUIPart | DynamicToolUIPart; // Tool part with type 'tool-${toolName}' or 'data-${string}'
    displayToolInfo: boolean;
}) {
    switch (part.state) {
        case "input-streaming":
        case "input-available":
            return (
                displayToolInfo && <ToolCallIndicator toolName={part.type} />
            );
        case "output-available":
            return (
                <ToolResultRenderer
                    toolName={part.type}
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
            case "tool-filterNotes":
                return "Searching your notes...";
            case "tool-searchNotesBySimilarity":
                return "Finding related notes using AI...";
            case "tool-getFilterOptions":
                return "Getting available filter options...";
            case "tool-summarizeNotes":
                return "Generating summary...";
            case "tool-answer":
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
