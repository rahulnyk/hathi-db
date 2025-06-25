"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateDisplayProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorStateDisplay: React.FC<ErrorStateDisplayProps> = ({
    message,
    onRetry,
    className,
}) => (
    <div className={className || "mt-3 flex items-center justify-between"}>
        <div
            className={cn(
                "flex items-center gap-2 text-xs text-muted-foreground",
                "bg-red-200/50 dark:bg-red-600/10 p-1 px-2 rounded-full",
                "text-red-900 dark:text-red-200"
            )}
        >
            <AlertCircle className="h-3 w-3" />
            <span>{message}</span>
        </div>
        {onRetry && (
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onRetry}
            >
                <RefreshCw className="h-3 w-3" />
            </Button>
        )}
    </div>
);
