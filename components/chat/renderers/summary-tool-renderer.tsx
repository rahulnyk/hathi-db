import { SummarizeToolResponse } from "@/app/agent_tools/types";
import ReactMarkdown from "react-markdown";
// Summary Component
export function SummaryRenderer({
    result,
    toolInfoHeader,
}: {
    result: SummarizeToolResponse;
    toolInfoHeader: React.ReactNode;
}) {
    if (!result.success || !result.summary) {
        return (
            <div>
                {toolInfoHeader}
                <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                    {result.message || "Failed to generate summary"}
                </div>
            </div>
        );
    }

    return (
        <div>
            {toolInfoHeader}
            <div className="prose prose-sm max-w-none dark:prose-invert p-2 sm:p-3 bg-card rounded border text-sm sm:text-base break-words">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
            </div>
        </div>
    );
}
