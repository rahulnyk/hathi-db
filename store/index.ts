import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import notesReducer from "./notesSlice";
// Import other reducers as you create them

export const store = configureStore({
    reducer: {
        notes: notesReducer,
        // Add other reducers here
    },
    // Adding middleware for Redux dev tools
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types to avoid serialization errors
                ignoredActions: ["your-non-serializable-action-type"],
                // Ignore these field paths in all actions
                ignoredActionPaths: ["meta.arg", "payload.timestamp"],
                // Ignore these paths in the state
                ignoredPaths: ["items.dates"],
            },
        }),
    devTools: process.env.NODE_ENV !== "production",
});

// Optional, but recommended for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types for your application
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for better TypeScript support
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
