import React, { useState } from "react";
import { SummarizeToolResponse } from "@/app/agent_tools/types";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

// Summary Component
export function SummaryRenderer({
    result,
    toolInfoHeader,
    defaultCollapsed = false,
}: {
    result: SummarizeToolResponse;
    toolInfoHeader: React.ReactNode;
    defaultCollapsed?: boolean;
}) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

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
            <div className="border rounded-lg bg-card">
                {/* Collapsible Header */}
                <Button
                    variant="ghost"
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full justify-between p-2 sm:p-3 text-left font-normal h-auto whitespace-normal"
                >
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <FileText className="inline-block h-4 w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">
                            Summary Generated
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
                        <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base break-words">
                            <ReactMarkdown>{result.summary}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
