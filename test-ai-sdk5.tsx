// Simple test file to verify AI SDK 5 compatibility
import React from "react";
import { UIMessage } from "ai";
import { ChatComponent } from "./components/chat/index";

// Mock useChat hook for testing
const mockChatHook = {
    messages: [
        {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "Hello, how are you?" }],
        },
        {
            id: "2",
            role: "assistant" as const,
            parts: [
                { type: "text" as const, text: "I am doing well, thank you!" },
                {
                    type: "tool-getWeather" as const,
                    state: "output-available" as const,
                    input: { location: "San Francisco" },
                    output: { temperature: 72, conditions: "sunny" },
                },
            ],
        },
    ] as UIMessage[],
    sendMessage: () => {},
    status: "idle" as const,
};

// Test component
export function TestChatComponent() {
    return (
        <ChatComponent
            chatHook={mockChatHook}
            showHeader={true}
            showInput={true}
        />
    );
}
