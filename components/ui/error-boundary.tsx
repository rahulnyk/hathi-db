"use client";

import React, { Component, ReactNode } from "react";
import { useToast, ToastProps } from "@/components/ui/toast";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error Boundary class component (required for error boundaries)
class ErrorBoundaryClass extends Component<
    ErrorBoundaryProps & { addToast?: (toast: ToastProps) => void },
    ErrorBoundaryState
> {
    constructor(
        props: ErrorBoundaryProps & {
            addToast?: (toast: ToastProps) => void;
        }
    ) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error Boundary caught an error:", error, errorInfo);

        // Show toast notification
        if (this.props.addToast) {
            this.props.addToast({
                type: "error" as const,
                message: `Application Error: ${error.message}`,
                duration: 8000,
            });
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Return custom fallback UI or default error message
            return (
                this.props.fallback || (
                    <div className="flex items-center justify-center h-64 text-center">
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-red-600">
                                Something went wrong
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please refresh the page or try again later
                            </p>
                            <button
                                onClick={() =>
                                    this.setState({ hasError: false })
                                }
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

// Wrapper component to access toast context
export function ErrorBoundary(props: ErrorBoundaryProps) {
    return (
        <ErrorBoundaryWrapper {...props}>{props.children}</ErrorBoundaryWrapper>
    );
}

// Functional wrapper to access hooks
function ErrorBoundaryWrapper(props: ErrorBoundaryProps) {
    const { addToast } = useToast();

    return <ErrorBoundaryClass {...props} addToast={addToast} />;
}
