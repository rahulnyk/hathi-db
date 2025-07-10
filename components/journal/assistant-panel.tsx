"use client";

import React from "react";
import { useChat } from "@ai-sdk/react";
import { ChatComponent } from "../chat";

interface AssistantPanelProps {
    chatHook: ReturnType<typeof useChat>;
}

export function AssistantPanel({ chatHook }: AssistantPanelProps) {
    return (
        <div className="w-full flex-grow overflow-y-auto px-4 md:px-6 py-4 md:py-6 smooth-scroll">
            <ChatComponent
                chatHook={chatHook}
                className="h-full flex flex-col"
            />
        </div>
    );
}
