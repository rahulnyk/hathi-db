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
import { useAppDispatch } from "@/store";
import { setDisplayToolInfo } from "@/store/agentSlice";

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

/**
 * ChatProvider component that provides chat functionality and context to its children.
 *
 * This provider manages the chat state, handles chat clearing functionality, and initializes
 * tool display information from environment variables. It wraps the application with chat
 * context and integrates with Redux store for state management.
 *
 * @param props - The component props
 * @param props.children - React nodes to be wrapped with chat context
 *
 * @returns JSX element that provides chat context to its children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ChatProvider>
 *       <ChatInterface />
 *     </ChatProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Initializes displayToolInfo from NEXT_PUBLIC_DISPLAY_TOOL_INFO environment variable
 * - Creates a new chat instance with DefaultChatTransport using "/api/chat" endpoint
 * - Provides clearChat function to reset chat state
 * - Must be used with useSharedChatContext hook to access chat functionality
 */

export function ChatProvider({ children }: { children: ReactNode }) {
    const [chat, setChat] = useState(() => createChat());
    const dispatch = useAppDispatch();

    const clearChat = () => {
        setChat(createChat());
    };

    // Initialize displayToolInfo from environment variable
    useEffect(() => {
        const displayToolInfo =
            process.env.NEXT_PUBLIC_DISPLAY_TOOL_INFO === "true";
        dispatch(setDisplayToolInfo(displayToolInfo));

        // For development: You can override this by dispatching setDisplayToolInfo(true)
        // or calling dispatch(toggleDisplayToolInfo()) from browser console
        console.log("Tool info display initialized:", displayToolInfo);
    }, [dispatch]);

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

/**
 * Custom hook to access the shared chat context.
 *
 * This hook provides access to the ChatContext and ensures that it's being used
 * within the appropriate ChatProvider. If called outside of a ChatProvider,
 * it will throw an error to help with debugging.
 *
 * @returns {ChatContextType} The chat context object containing chat state and methods
 * @throws {Error} Throws an error if used outside of a ChatProvider
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const chatContext = useSharedChatContext();
 *   // Use chat context here
 * }
 * ```
 */
export function useSharedChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error(
            "useSharedChatContext must be used within a ChatProvider"
        );
    }
    return context;
}
