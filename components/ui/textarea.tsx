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
                    "bg-transparent border-none outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "resize-none",
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
