import * as React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import type { TextareaAutosizeProps } from "react-textarea-autosize";

// Instead of an empty interface, use type alias
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextareaAutosize
                className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base",
                    "placeholder:text-muted-foreground",
                    "min-h-20 mb-4 bg-transparent border-none outline-none",
                    "focus:ring-0 focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "resize-none",
                    // "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
