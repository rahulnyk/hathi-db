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
    uiMessagesToStoredMessages,
    storedMessagesToUIMessages,
} from "@/lib/chat-message-utils";
import {
    initializeChat,
    setMessages,
    selectChatId,
    selectChatMessages,
    selectIsChatInitialized,
} from "@/store/chatSlice";
import { UIMessage } from "ai";

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
        api: "/api/chat",
        id: chatId || undefined,
        initialMessages,
        sendExtraMessageFields: true,
    });

    // Initialize chat on first render
    useEffect(() => {
        if (!isChatInitialized) {
            dispatch(initializeChat());
        }
    }, [dispatch, isChatInitialized]);

    // Sync messages from useChat to Redux store
    useEffect(() => {
        if (chatHook.messages.length > 0) {
            const messagesToStore = uiMessagesToStoredMessages(
                chatHook.messages
            );
            dispatch(setMessages(messagesToStore));
        }
    }, [chatHook.messages, dispatch]);

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
