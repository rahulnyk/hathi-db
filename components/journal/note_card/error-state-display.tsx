"use client";

import { AlertCircle, RefreshCw, WifiOff, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIErrorType } from "@/lib/ai/types";

interface ErrorStateDisplayProps {
    message: string;
    errorType?: AIErrorType | string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorStateDisplay: React.FC<ErrorStateDisplayProps> = ({
    message,
    errorType,
    onRetry,
    className,
}) => {
    // Determine icon and color based on error type
    let Icon = AlertCircle;
    let colorClass = "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";

    if (errorType === AIErrorType.NETWORK_ERROR) {
        Icon = WifiOff;
        colorClass = "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300";
    } else if (errorType === AIErrorType.RATE_LIMIT) {
        Icon = Clock;
        colorClass = "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300";
    } else if (errorType === AIErrorType.QUOTA_EXCEEDED) {
        Icon = ShieldAlert;
        colorClass = "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
    }

    return (
        <div className={className || "mt-3 flex items-center justify-between"}>
            <div
                className={cn(
                    "flex items-center gap-2 text-xs p-1.5 px-3 rounded-full transition-colors",
                    colorClass
                )}
            >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">{message}</span>
            </div>
            {onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs ml-2 hover:bg-secondary"
                    onClick={onRetry}
                    title="Retry"
                >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Retry
                </Button>
            )}
        </div>
    );
};
