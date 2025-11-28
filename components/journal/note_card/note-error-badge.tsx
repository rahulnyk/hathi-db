"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NoteErrorBadgeProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export function NoteErrorBadge({
    message,
    onRetry,
    className,
}: NoteErrorBadgeProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-full",
                            "bg-red-100 dark:bg-red-900/30",
                            "text-red-600 dark:text-red-400",
                            "hover:bg-red-200 dark:hover:bg-red-900/50",
                            "transition-colors cursor-help",
                            className
                        )}
                    >
                        <AlertCircle size={12} />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] p-3">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {message}
                        </p>
                        {onRetry && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRetry();
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 self-start",
                                    "text-[10px] font-medium",
                                    "text-muted-foreground hover:text-foreground",
                                    "transition-colors"
                                )}
                            >
                                <RefreshCw size={10} />
                                <span>Retry</span>
                            </button>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
