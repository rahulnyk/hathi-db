import ReactMarkdown from "react-markdown";
import { TextUIPart } from "@ai-sdk/ui-utils";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Text part component
export function TextPartRenderer({ part }: { part: TextUIPart }) {
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
            <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
            <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8"
                title={copied ? "Copied!" : "Copy to clipboard"}
            >
                {copied ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <Copy className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
