import ReactMarkdown from "react-markdown";
import { AnswerToolResponse } from "@/app/agent_tools/types";
// Answer Component
export function AnswerRenderer({
    result,
    toolInfoHeader,
}: {
    result: AnswerToolResponse;
    toolInfoHeader: React.ReactNode;
}) {
    if (!result.success || !result.answer) {
        return (
            <div>
                {toolInfoHeader}
                <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                    Failed to provide answer
                </div>
            </div>
        );
    }

    return (
        <div>
            {toolInfoHeader}
            <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>
        </div>
    );
}
