import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the agent status type
export type AgentStatus = "idle" | "submitted" | "streaming" | "error";

// Define the agent slice state
export interface AgentState {
    status: AgentStatus;
    displayToolInfo: boolean;
    isProcessing: boolean;
}

// Initial state
const initialState: AgentState = {
    status: "idle",
    displayToolInfo: false,
    isProcessing: false,
};

// Create the agent slice
const agentSlice = createSlice({
    name: "agent",
    initialState,
    reducers: {
        setStatus: (state, action: PayloadAction<AgentStatus>) => {
            state.status = action.payload;
            state.isProcessing =
                action.payload === "submitted" ||
                action.payload === "streaming";
        },
        setDisplayToolInfo: (state, action: PayloadAction<boolean>) => {
            state.displayToolInfo = action.payload;
        },
        toggleDisplayToolInfo: (state) => {
            state.displayToolInfo = !state.displayToolInfo;
        },
        resetAgent: (state) => {
            state.status = "idle";
            state.isProcessing = false;
        },
    },
});

// Export actions
export const {
    setStatus,
    setDisplayToolInfo,
    toggleDisplayToolInfo,
    resetAgent,
} = agentSlice.actions;

// Export selectors
export const selectAgentStatus = (state: { agent: AgentState }) =>
    state.agent.status;
export const selectDisplayToolInfo = (state: { agent: AgentState }) =>
    state.agent.displayToolInfo;
export const selectIsProcessing = (state: { agent: AgentState }) =>
    state.agent.isProcessing;

// Export reducer
export default agentSlice.reducer;
