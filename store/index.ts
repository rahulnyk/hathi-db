import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import notesReducer from "./notesSlice";
import uiReducer from "./uiSlice";
import notesMetadataReducer from "./notesMetadataSlice";
import aiReducer from "./aiSlice";
import agentReducer from "./agentSlice";
import draftReducer from "./draftSlice";
import journalReducer from "./journalSlice";
import editorReducer from "./editorSlice";
import { notesMiddleware } from "./middleware/notesMiddleware";

// Persist configuration for draft slice only
const draftPersistConfig = {
    key: "draft",
    storage,
    whitelist: ["content"], // Only persist the content field
};

const persistedDraftReducer = persistReducer(draftPersistConfig, draftReducer);

export const store = configureStore({
    reducer: {
        notes: notesReducer,
        ui: uiReducer,
        notesMetadata: notesMetadataReducer,
        ai: aiReducer,
        agent: agentReducer,
        draft: persistedDraftReducer,
        journal: journalReducer,
        editor: editorReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
        }).prepend(notesMiddleware.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
