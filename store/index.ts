import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
import notesReducer from "./notesSlice";
import uiReducer from "./uiSlice";
import notesMetadataReducer from "./notesMetadataSlice";
import aiReducer from "./aiSlice";
import agentReducer from "./agentSlice";
import chatReducer from "./chatSlice";
import { notesMiddleware } from "./middleware/notesMiddleware";

export const store = configureStore({
    reducer: {
        notes: notesReducer,
        ui: uiReducer,
        notesMetadata: notesMetadataReducer,
        ai: aiReducer,
        agent: agentReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(notesMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
