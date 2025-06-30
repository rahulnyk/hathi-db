"use client";

import React, { useState, useEffect } from "react";
import { Note } from "@/store/notesSlice";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkContextPlugin from "@/lib/remark_context_plugin";
import remarkHashtagPlugin from "@/lib/remark_hashtag_plugin";
import { useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { sentenceCaseToSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ChevronDownIcon,
    ChevronRightIcon,
    Bot as BotIcon,
} from "lucide-react";
import { DeleteNoteButton } from "./delete-note-button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CodeBlock } from "./code-block";
import { SourceNotesList } from "./source-notes-list";

interface AiNoteCardProps {
    note: Note;
}

export function AiNoteCard({ note }: AiNoteCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dispatch = useAppDispatch();

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const formattedDate = formatDistanceToNow(new Date(note.created_at), {
        addSuffix: true,
    });

    // Handle clicks for context pills and hashtags
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.classList.contains("context-pill-inline")) {
                const content =
                    target.getAttribute("data-content") ||
                    target.textContent ||
                    "";
                const context = sentenceCaseToSlug(content);
                dispatch(setCurrentContext(context));
                console.log("Context clicked:", context);
            }

            if (target.classList.contains("hashtag-pill")) {
                const content =
                    target.getAttribute("data-content") ||
                    target.textContent?.replace("#", "") ||
                    "";
                console.log("Hashtag clicked:", content);
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [dispatch]);

    return (
        <div
            data-note-id={note.id}
            className={cn(
                "ai-note-card p-3 my-2 rounded-lg relative border font-outfit transition-colors duration-500",
                isCollapsed ? "ai-note-card-collapsed" : ""
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-between mb-2",
                    isCollapsed && "ai-note-collapsed-header"
                )}
            >
                <div
                    className={cn(
                        "flex items-center",
                        isCollapsed && "ai-note-collapsed-icon-wrapper"
                    )}
                >
                    {/* BotIcon styling will be updated via CSS for blue theme */}
                    <BotIcon
                        size={22}
                        className="mr-2 ai-note-icon-color flex-shrink-0"
                    />
                    {!isCollapsed && (
                        <span className="font-semibold ai-note-title-color">
                            AI Generated Note
                        </span>
                    )}
                </div>
                <div className="flex items-center">
                    {isCollapsed && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                            {formattedDate}
                        </span>
                    )}
                    <DeleteNoteButton
                        note={note}
                        className={cn(
                            "mr-1", // Add margin to separate from collapse button
                            isCollapsed && "hidden" // Hide delete button when collapsed
                        )}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleCollapse}
                        aria-label={
                            isCollapsed ? "Expand note" : "Collapse note"
                        }
                        className="p-1 h-auto" // Removed mr-1 as it's the last button now
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon size={18} />
                        ) : (
                            <ChevronDownIcon size={18} />
                        )}
                    </Button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    <div className="ai-note-card-content prose prose-sm dark:prose-invert max-w-none mb-2 mt-4 px-4">
                        <ReactMarkdown
                            remarkPlugins={[
                                remarkGfm,
                                remarkContextPlugin,
                                remarkHashtagPlugin,
                            ]}
                            components={{
                                code: CodeBlock, // Use custom CodeBlock component
                            }}
                        >
                            {note.content}
                        </ReactMarkdown>
                    </div>

                    {/* Source Notes List */}
                    <div className="px-4">
                        <SourceNotesList aiNoteId={note.id} />
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right px-4">
                        {formattedDate}
                    </div>
                </>
            )}
        </div>
    );
}
