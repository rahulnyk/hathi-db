import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
    updateNoteOptimistically,
    createNoteOptimistically,
    patchNote,
    addNote,
    updateNotePersistenceStatus,
} from "../notesSlice";
import {
    generateSuggestedContexts,
    generateEmbeddingThunk,
} from "../aiSlice";
import {
    setEditingNoteId,
    storeOriginalNoteState,
    clearOriginalNoteState,
} from "../uiSlice";
import { extractMetadata } from "@/lib/noteUtils";
import { areArraysEqual } from "@/lib/utils";
import { RootState } from "../index";
// import { refreshContextsMetadata } from "../notesMetadataSlice";

// Create the listener middleware
export const notesMiddleware = createListenerMiddleware();

// Handle optimistic note editing with immediate persistence
notesMiddleware.startListening({
    actionCreator: updateNoteOptimistically,
    effect: async (action, listenerApi) => {
        const { noteId, patches } = action.payload;
        const state = listenerApi.getState() as RootState;

        // Find the note to get current data
        // Find the note to get current data
        const note =
            state.notes.contextNotes.find((n) => n.id === noteId) ||
            state.notes.searchResultNotes.find((n) => n.id === noteId);
        if (!note) return;

        try {
            // Get the latest state to ensure we have the most recent data
            const currentState = listenerApi.getState() as RootState;
            const currentNote =
                currentState.notes.contextNotes.find((n) => n.id === noteId) ||
                currentState.notes.searchResultNotes.find(
                    (n) => n.id === noteId
                );

            if (!currentNote) return;

            // Extract metadata from content if content was updated
            let finalPatches = { ...patches };
            if (patches.content) {
                const { contexts: extractedContexts, tags: extractedTags } =
                    extractMetadata(patches.content);

                // Merge existing contexts with extracted ones
                const existingContexts = currentNote.contexts || [];
                const mergedContexts = [
                    ...new Set([...existingContexts, ...extractedContexts]),
                ];

                // Merge existing tags with extracted ones
                const existingTags = currentNote.tags || [];
                const mergedTags = [
                    ...new Set([...existingTags, ...extractedTags]),
                ];

                finalPatches = {
                    ...finalPatches,
                    contexts: mergedContexts,
                    tags: mergedTags,
                };
            }

            // Persist to database immediately
            await listenerApi.dispatch(
                patchNote({
                    noteId,
                    patches: finalPatches,
                })
            );

            // Generate embedding if content, contexts, or tags were updated
            if (
                finalPatches.content ||
                finalPatches.contexts ||
                finalPatches.tags
            ) {
                // We need the full note data for embedding generation
                // Merge current note with patches
                const updatedNote = {
                    ...currentNote,
                    ...finalPatches,
                };

                listenerApi.dispatch(
                    generateEmbeddingThunk({
                        noteId,
                        content: updatedNote.content,
                        contexts: updatedNote.contexts,
                        tags: updatedNote.tags,
                        noteType: updatedNote.note_type || "note",
                    })
                );
            }
        } catch (error) {
            console.error("Failed to persist note update:", error);
            listenerApi.dispatch(
                updateNotePersistenceStatus({
                    id: noteId,
                    status: "failed",
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                })
            );
        }
    },
});

// Handle optimistic note creation with immediate persistence
notesMiddleware.startListening({
    actionCreator: createNoteOptimistically,
    effect: async (action, listenerApi) => {
        const { note, autoSave } = action.payload;

        if (!autoSave) return;

        try {
            const state = listenerApi.getState() as RootState;
            const currentContext = state.notes.currentContext;

            // Persist to database using the note's UUID
            const result = await listenerApi.dispatch(
                addNote({
                    id: note.id, // Pass the existing UUID from optimistic note
                    content: note.content,
                    key_context: currentContext,
                    contexts: note.contexts,
                    tags: note.tags,
                    note_type: note.note_type,
                })
            );

            // If note was successfully added, generate context suggestions and embedding
            if (addNote.fulfilled.match(result)) {
                const persistedNote = result.payload;
                const allUserContexts = state.notesMetadata.contexts.map(
                    (ctx) => ctx.context
                );

                // Generate context suggestions
                listenerApi.dispatch(
                    generateSuggestedContexts({
                        noteId: persistedNote.id,
                        content: persistedNote.content,
                        userContexts: allUserContexts,
                    })
                );

                // Generate embedding
                listenerApi.dispatch(
                    generateEmbeddingThunk({
                        noteId: persistedNote.id,
                        content: persistedNote.content,
                        contexts: persistedNote.contexts,
                        tags: persistedNote.tags,
                        noteType: persistedNote.note_type || "note",
                    })
                );
            }
        } catch (error) {
            console.error("Failed to persist note creation:", error);
            listenerApi.dispatch(
                updateNotePersistenceStatus({
                    id: note.id,
                    status: "failed",
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                })
            );
        }
    },
});

// Handle storing original state when entering edit mode and embedding generation when exiting
notesMiddleware.startListening({
    actionCreator: setEditingNoteId,
    effect: async (action, listenerApi) => {
        const editingNoteId = action.payload;
        const state = listenerApi.getState() as RootState;

        if (editingNoteId !== null) {
            // Entering edit mode - store original state
            // Entering edit mode - store original state
            const note =
                state.notes.contextNotes.find((n) => n.id === editingNoteId) ||
                state.notes.searchResultNotes.find(
                    (n) => n.id === editingNoteId
                );

            if (note) {
                listenerApi.dispatch(
                    storeOriginalNoteState({
                        noteId: editingNoteId,
                        originalState: {
                            content: note.content,
                            contexts: note.contexts || [],
                            tags: note.tags || [],
                        },
                    })
                );
            }
        } else {
            // Exiting edit mode - check for changes and generate embedding if needed
            const prevState = listenerApi.getOriginalState() as RootState;
            const previousEditingNoteId = prevState.ui.editingNoteId;

            if (!previousEditingNoteId) return;

            // Find the note that was being edited
            // Find the note that was being edited
            const note =
                state.notes.contextNotes.find(
                    (n) => n.id === previousEditingNoteId
                ) ||
                state.notes.searchResultNotes.find(
                    (n) => n.id === previousEditingNoteId
                );
            if (!note) return;

            // Get the original state from UI state
            const originalState =
                state.ui.originalNoteStates[previousEditingNoteId];
            if (!originalState) return;

            // Check if content, contexts, or tags have changed
            const contentChanged = note.content !== originalState.content;
            const contextsChanged = !areArraysEqual(
                note.contexts || [],
                originalState.contexts
            );
            const tagsChanged = !areArraysEqual(
                note.tags || [],
                originalState.tags
            );

            // Clean up the stored original state
            listenerApi.dispatch(clearOriginalNoteState(previousEditingNoteId));

            // Only generate embedding if something actually changed
            if (contentChanged || contextsChanged || tagsChanged) {
                listenerApi.dispatch(
                    generateEmbeddingThunk({
                        noteId: note.id,
                        content: note.content,
                        contexts: note.contexts || [],
                        tags: note.tags || [],
                        noteType: note.note_type || "note",
                    })
                );
            }
        }
    },
});
