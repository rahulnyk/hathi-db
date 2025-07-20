"use client";

import { ChatComponent } from "@/components/chat";
import { useChat } from "@ai-sdk/react";
import { useAppSelector, useAppDispatch } from "@/store";
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

export default function ChatPage() {
    const dispatch = useAppDispatch();

    // Redux chat state - same as NotesPanel
    const chatId = useAppSelector(selectChatId);
    const storedMessages = useAppSelector(selectChatMessages);
    const isChatInitialized = useAppSelector(selectIsChatInitialized);

    // Convert stored messages to UIMessage format for useChat
    const initialMessages: UIMessage[] =
        storedMessagesToUIMessages(storedMessages);

    // Create chat hook with persistence - same as NotesPanel
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
        <div className="container mx-auto py-8">
            <div className="flex justify-center">
                <ChatComponent
                    chatHook={chatHook}
                    showHeader={true}
                    showInput={true}
                />
            </div>
        </div>
    );
}
