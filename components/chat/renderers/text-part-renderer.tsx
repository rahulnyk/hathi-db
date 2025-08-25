import ReactMarkdown from "react-markdown";
import { TextUIPart } from "ai";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasoningPart } from "@ai-sdk/provider-utils";

// Text part component
export function TextPartRenderer({
    part,
    isUserMessage,
}: {
    part: TextUIPart | ReasoningPart;
    isUserMessage?: boolean;
}) {
    const [copied, setCopied] = useState(false);

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

    return (
        <div className="relative group">
            <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
            {!isUserMessage && (
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
            )}
        </div>
    );
}
