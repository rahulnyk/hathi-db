import { cn } from "@/lib/utils";
export function CodeBlock({
    inline,
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
    // Get language from className (e.g., "language-js")
    // const match = /language-(\w+)/.exec(className || "");
    return !inline ? (
        <code
            className={cn(
                className,
                "rounded px-2 sm:px-3 py-1 sm:py-2 overflow-x-auto my-4 sm:my-2 bg-transparent",
                "w-full max-w-full text-wrap whitespace-pre-wrap",
                "text-xs sm:text-xs"
            )}
            {...props}
        >
            {children}
        </code>
    ) : (
        <code
            className="rounded px-0.5 sm:px-1 py-0.5 w-full max-w-full sm:text-base text-wrap whitespace-pre-wrap"
            {...props}
        >
            {children}
        </code>
    );
}
