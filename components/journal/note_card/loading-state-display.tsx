"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateDisplayProps {
    message: string;
    className?: string;
}

export const LoadingStateDisplay: React.FC<LoadingStateDisplayProps> = ({
    message,
    className,
}) => (
    <div
        className={
            className ||
            "mt-3 flex items-center gap-2 text-xs text-muted-foreground"
        }
    >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{message}</span>
    </div>
);
