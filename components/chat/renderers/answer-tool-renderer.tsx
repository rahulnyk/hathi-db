import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerToolInput } from "@/app/agent_tools/types";

// Answer Component
export function AnswerRenderer({ inputs }: { inputs: AnswerToolInput }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!inputs.answer) return;

        try {
            await navigator.clipboard.writeText(inputs.answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    };
    return (
        <div className="space-y-3">
            {/* Render summary if available */}
            {inputs.summary && (
                <div className="text-sm text-muted-foreground italic">
                    {inputs.summary}
                </div>
            )}

            {/* Render the main answer */}
            {inputs.answer && (
                <div className="relative group">
                    <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                        <ReactMarkdown>{inputs.answer}</ReactMarkdown>
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
            )}
        </div>
    );
}
