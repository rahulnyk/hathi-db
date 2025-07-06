import ReactMarkdown from "react-markdown";
import { TextUIPart } from "@ai-sdk/ui-utils";

// Text part component
export function TextPartRenderer({ part }: { part: TextUIPart }) {
    if (!part.text) return null;

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{part.text}</ReactMarkdown>
        </div>
    );
}
