"use client";

import { Note } from "@/store/notesSlice";
import ReactMarkdown from "react-markdown";
import { AlertCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import remarkGfm from "remark-gfm";

export function NoteCard({ note }: { note: Note }) {
    return (
        <div className="p-3 sm:p-4 rounded-lg bg-muted/40 dark:bg-muted/20 relative">
            {/* Show error icon only if persistence failed */}
            {note.persistenceStatus === "failed" && (
                <div className="absolute top-3 right-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>
                                    {note.errorMessage || "Failed to save note"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Date display */}
            <div className="text-xs text-muted-foreground mb-2">
                {new Date(note.created_at).toLocaleString()}
            </div>

            {/* Note content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                </ReactMarkdown>
            </div>
        </div>
    );
}
