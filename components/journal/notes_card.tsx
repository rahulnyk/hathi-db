"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Note } from "./notes";
import clsx from "clsx";

export function NoteCard({ note }: { note: Note }) {
    return (
        <div
            className={clsx(
                "p-4 bg-zinc-50 dark:bg-zinc-900 rounded-r-lg",
                "border-l-2 border-white dark:border-zinc-900",
                "hover:border-l-2 hover:border-zinc-400 dark:hover:border-zinc-600",
                "transition-colors"
            )}
        >
            <div className="text-xs text-muted-foreground mb-2">
                {new Date(note.created_at).toLocaleString()}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => (
                            <h1 className="text-2xl font-bold" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-semibold" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                            <p className="mb-2" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-4 mb-2" {...props} />
                        ),
                        li: ({ node, ...props }) => {
                            return <li className="ml-2 mb-1" {...props} />;
                        },
                        // Add more custom components as needed
                    }}
                >
                    {note.content}
                </Markdown>
            </div>
        </div>
    );
}
