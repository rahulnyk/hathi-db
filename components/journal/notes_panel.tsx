"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { AssistantPanel } from "./assistant-panel";
import { NotesPanelHeader } from "./notes-panel-header";
import { useAppSelector, useAppDispatch } from "@/store";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";
import {
    uiMessageToStoredMessage,
    storedMessagesToUIMessages,
} from "@/lib/chat-message-utils";
import {
    initializeChat,
    setMessage,
    selectChatId,
    selectChatMessages,
    selectIsChatInitialized,
} from "@/store/chatSlice";
import { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChatAnalytics } from "@/lib/chat-loggers/client-chat-logger";

export function NotesPanel() {
    const dispatch = useAppDispatch();
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    // Redux chat state
    const chatId = useAppSelector(selectChatId);
    const storedMessages = useAppSelector(selectChatMessages);
    const isChatInitialized = useAppSelector(selectIsChatInitialized);

    // Convert stored messages to UIMessage format for useChat
    const initialMessages: UIMessage[] =
        storedMessagesToUIMessages(storedMessages);

    // Create chat hook for assistant mode with persistence:
    // - `id` is used to identify the chat session for persistence.
    // - `initialMessages` initializes the chat with stored messages.
    const chatHook = useChat({
        // api: "/api/chat",
        transport: new DefaultChatTransport({
            api: "/api/chat",
        }),
        id: chatId || undefined,
        messages: initialMessages,
        onFinish: ({ message }) => {
            // Convert the finished message to stored format and append to Redux
            const messageToStore = uiMessageToStoredMessage(message);
            dispatch(setMessage(messageToStore));
        },
    });

    // Add analytics logging to the chat hook
    const analytics = useChatAnalytics(chatHook);

    // Initialize chat on first render
    useEffect(() => {
        if (!isChatInitialized) {
            dispatch(initializeChat());
        }
    }, [dispatch, isChatInitialized]);

    // Log custom events for significant interactions
    useEffect(() => {
        if (chatMode) {
            analytics.logCustomEvent("chat_mode_activated");
        } else {
            analytics.logCustomEvent("chat_mode_deactivated");
        }
    }, [chatMode, analytics]);

    return (
        <div
            className={cn(
                "flex flex-col h-screen w-full md:max-w-screen-lg md:mx-auto"
            )}
        >
            <NotesPanelHeader />
            {chatMode ? <AssistantPanel chatHook={chatHook} /> : <Thread />}
            <InputPanel chatHook={chatHook} />
        </div>
    );
}
