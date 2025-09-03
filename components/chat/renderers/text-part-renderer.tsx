import ReactMarkdown from "react-markdown";
import { TextUIPart } from "ai";
import { useState, useEffect } from "react";
import {
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    MessageCircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasoningPart } from "@ai-sdk/provider-utils";

// Props interface for TextPartRenderer component
interface TextPartRendererProps {
    /** The text or reasoning part to render */
    part: TextUIPart | ReasoningPart;
    /** Whether this is a user message (affects styling) */
    isUserMessage?: boolean;
    /** Whether the collapsible content should start collapsed */
    defaultCollapsed?: boolean;
}

// Text part component
export function TextPartRenderer({
    part,
    isUserMessage,
    defaultCollapsed = false,
}: TextPartRendererProps) {
    const [copied, setCopied] = useState(false);
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    // Debug logging
    console.log("TextPartRenderer:", {
        isUserMessage,
        defaultCollapsed,
        firstLine: part.text?.split("\n")[0].trim().substring(0, 50),
    });

    // Update collapsed state when defaultCollapsed prop changes
    useEffect(() => {
        setCollapsed(defaultCollapsed);
    }, [defaultCollapsed]);

    if (!part.text) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(part.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    };

    // Get the first line of the text for the header (only needed for non-user messages)
    const firstLine = part.text.split("\n")[0].trim();
    const restOfContent = part.text.split("\n").slice(1).join("\n").trim();

    return isUserMessage ? (
        // User message: simple style
        <div className="relative group">
            <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
        </div>
    ) : (
        // AI message: collapsible style
        <div className="border rounded-lg bg-neutral-100 dark:bg-neutral-900">
            {/* Collapsible Header */}
            <Button
                variant="ghost"
                onClick={() => setCollapsed(!collapsed)}
                className="w-full justify-between p-2 sm:p-3 text-left font-normal h-auto"
            >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <MessageCircleDashed className="inline-block h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {/* <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Let me see{" "}
                    </span> */}
                    <span className="text-xs text-muted-foreground truncate">
                        {firstLine}
                    </span>
                </div>
                {collapsed ? (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
            </Button>

            {/* Collapsible Content */}
            {!collapsed && (
                <div className="border-t p-2 sm:p-3">
                    <div className="relative group">
                        <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                            <ReactMarkdown>{restOfContent || ""}</ReactMarkdown>
                        </div>
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                            className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 sm:h-8 sm:w-8"
                            title={copied ? "Copied!" : "Copy to clipboard"}
                        >
                            {copied ? (
                                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
