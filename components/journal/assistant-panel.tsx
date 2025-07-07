"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function AssistantPanel() {
    return (
        <div className="w-full flex-grow overflow-y-auto px-4 md:px-6 py-8 md:py-10 smooth-scroll">
            <div className="flex-grow flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">AI Assistant</h3>
                        <p className="text-sm opacity-70">
                            Chat functionality will be implemented in the next
                            commit
                        </p>
                    </div>
                    <div className="pt-4 text-xs opacity-50 space-y-2">
                        <p>
                            Type{" "}
                            <code className="bg-accent px-1 rounded">/q</code>{" "}
                            or{" "}
                            <code className="bg-accent px-1 rounded">qq</code>{" "}
                            to open assistant
                        </p>
                        <p>
                            Type{" "}
                            <code className="bg-accent px-1 rounded">/n</code>{" "}
                            or{" "}
                            <code className="bg-accent px-1 rounded">nn</code>{" "}
                            to switch back to notes
                        </p>
                        <p>Or use the toggle button in the header</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
