"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
} from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useChatAnalytics } from "./chat-loggers/client-chat-logger";
import { useAppSelector } from "@/store";
import { useChat } from "@ai-sdk/react";

interface ChatContextValue {
    chat: Chat<UIMessage>;
    clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function createChat() {
    return new Chat<UIMessage>({
        transport: new DefaultChatTransport({
            api: "/api/chat",
        }),
    });
}

export function ChatProvider({ children }: { children: ReactNode }) {
    const [chat, setChat] = useState(() => createChat());
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    const clearChat = () => {
        setChat(createChat());
    };

    const chatHook = useChat({ chat });

    // Analytics //
    const analytics = useChatAnalytics(chatHook);
    useEffect(() => {
        if (chatMode) {
            analytics.logCustomEvent("chat_mode_activated");
        } else {
            analytics.logCustomEvent("chat_mode_deactivated");
        }
    }, [chatMode, analytics]);
    //

    return (
        <ChatContext.Provider
            value={{
                chat,
                clearChat,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useSharedChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error(
            "useSharedChatContext must be used within a ChatProvider"
        );
    }
    return context;
}
