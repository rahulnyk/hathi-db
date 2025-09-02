import ReactMarkdown from "react-markdown";
import { AnswerToolInput } from "@/app/agent_tools/types";

// Answer Component
export function AnswerRenderer({ inputs }: { inputs: AnswerToolInput }) {
    // if (!inputs.answer) {
    //     return (
    //         <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
    //             Failed to provide answer
    //         </div>
    //     );
    // }

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
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                    <ReactMarkdown>{inputs.answer}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
