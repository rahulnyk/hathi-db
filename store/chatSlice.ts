import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { generateId } from "ai";
import { UIMessage } from "ai";

// Create a simplified, serializable version based on AI SDK Message type
// Pick only the essential fields that we need and can serialize
export interface StoredMessage {
    id: string;
    role: UIMessage["role"]; // Use the role type from Message
    content: string;
    createdAt?: string;
    // We'll handle complex parts separately if needed
    // Keep as any[] for now to avoid deep type issues
    parts?: any[];
}

export interface ChatState {
    id: string | null;
    messages: StoredMessage[];
    isInitialized: boolean;
}

const initialState: ChatState = {
    id: null,
    messages: [],
    isInitialized: false,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        initializeChat: (state) => {
            if (!state.id) {
                state.id = generateId();
            }
            state.isInitialized = true;
        },
        setMessages: (state, action: PayloadAction<StoredMessage[]>) => {
            state.messages = action.payload;
        },
        setMessage: (state, action: PayloadAction<StoredMessage>) => {
            // Check if message already exists (by id) to avoid duplicates
            const existingIndex = state.messages.findIndex(
                (msg) => msg.id === action.payload.id
            );
            if (existingIndex >= 0) {
                // Update existing message
                state.messages[existingIndex] = action.payload;
            } else {
                // Append new message
                state.messages.push(action.payload);
            }
        },
        addMessage: (state, action: PayloadAction<StoredMessage>) => {
            state.messages.push(action.payload);
        },
        clearChat: (state) => {
            state.id = generateId();
            state.messages = [];
        },
        resetChat: (state) => {
            state.id = null;
            state.messages = [];
            state.isInitialized = false;
        },
    },
});

export const {
    initializeChat,
    setMessages,
    setMessage,
    addMessage,
    clearChat,
    resetChat,
} = chatSlice.actions;

// Selectors
export const selectChatId = (state: { chat: ChatState }) => state.chat.id;
export const selectChatMessages = (state: { chat: ChatState }) =>
    state.chat.messages;
export const selectIsChatInitialized = (state: { chat: ChatState }) =>
    state.chat.isInitialized;

export default chatSlice.reducer;
