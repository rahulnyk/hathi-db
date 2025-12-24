import {
    SearchToolResponse,
    SummarizeToolResponse,
} from "@/app/agent_tools/types";

import { SummaryRenderer } from "./summary-tool-renderer";
import { SearchResultsRenderer } from "./search-tool-renderer";
// Tool result renderer with switch case
export function ToolResultRenderer({
    toolName,
    result,
    displayToolInfo,
    defaultCollapsed = false,
}: {
    toolName: string;
    result: unknown;
    displayToolInfo: boolean;
    defaultCollapsed?: boolean;
}) {
    // Tool info header (only shown if displayToolInfo is true)
    const toolInfoHeader = displayToolInfo && (
        <>
            <div className="text-xs text-muted-foreground/60 font-mono mb-1 sm:mb-2 truncate">
                {toolName}
            </div>
            <hr className="border-t border-muted-foreground/20 mb-2 sm:mb-3" />
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
                    defaultCollapsed={defaultCollapsed}
                />
            );

        case "getFilterOptions":
            // Don't display filter options to user
            return null;

        default:
            return displayToolInfo ? (
                <div>
                    {toolInfoHeader}
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded break-words">
                        Unknown tool: {toolName}
                    </div>
                </div>
            ) : null;
    }
}
