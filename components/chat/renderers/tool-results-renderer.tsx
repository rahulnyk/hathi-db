import {
    SearchToolResponse,
    SummarizeToolResponse,
    AnswerToolResponse,
} from "@/app/agent_tools/types";

import { AnswerRenderer } from "./answer-tool-renderer";
import { SummaryRenderer } from "./summary-tool-renderer";
import { SearchResultsRenderer } from "./search-tool-renderer";
// Tool result renderer with switch case
export function ToolResultRenderer({
    toolName,
    result,
    displayToolInfo,
}: {
    toolName: string;
    result: unknown;
    displayToolInfo: boolean;
}) {
    // Tool info header (only shown if displayToolInfo is true)
    const toolInfoHeader = displayToolInfo && (
        <>
            <div className="text-xs text-muted-foreground/60 font-mono mb-2">
                {toolName}
            </div>
            <hr className="border-t border-muted-foreground/20 mb-3" />
        </>
    );

    switch (toolName) {
        case "filterNotes":
        case "searchNotesBySimilarity":
            return (
                <SearchResultsRenderer
                    result={result as SearchToolResponse}
                    toolInfoHeader={toolInfoHeader}
                />
            );

        case "summarizeNotes":
            return (
                <SummaryRenderer
                    result={result as SummarizeToolResponse}
                    toolInfoHeader={toolInfoHeader}
                />
            );

        case "answer":
            return (
                <AnswerRenderer
                    result={result as AnswerToolResponse}
                    toolInfoHeader={toolInfoHeader}
                />
            );

        case "getFilterOptions":
            // Don't display filter options to user
            return null;

        default:
            return displayToolInfo ? (
                <div>
                    {toolInfoHeader}
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                        Unknown tool: {toolName}
                    </div>
                </div>
            ) : null;
    }
}
