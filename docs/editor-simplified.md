# Simplified Notes Editor Documentation

## Overview

The NotesEditor is a streamlined text editor component for creating and editing notes within the journal application. It has been simplified to focus on core functionality while maintaining a clean and intuitive user experience.

## Core Features

### 1. Content Persistence

-   **Auto-save Draft**: Automatically saves content to Redux store as you type (for new notes)
-   **Draft Recovery**: Restores unsaved drafts when the application is reopened
-   **Redux Integration**: Uses `draftSlice` to persist content across sessions

### 2. Note Management

-   **Create Notes**: Create new notes with extracted contexts and tags
-   **Edit Notes**: Edit existing notes with original state preservation
-   **Save/Cancel**: Save changes or cancel and restore original content
-   **Context Management**: Manage note contexts through the ContextContainer component

### 3. Chat Mode

-   **AI Integration**: Switch to chat mode for AI-powered interactions
-   **Seamless Switching**: Toggle between notes mode and chat mode
-   **Message Handling**: Send messages to AI and receive responses

### 4. User Interface

-   **Markdown Support**: Write notes using Markdown formatting
-   **Keyboard Shortcuts**: Enter to submit, Shift+Enter for new lines
-   **Visual Feedback**: Loading indicators and disabled states during submission
-   **Responsive Design**: Adapts to different screen sizes

## Component Architecture

### Props Interface

```typescript
interface NotesEditorProps {
    note?: Note; // Optional note to edit. If provided, enters edit mode
}
```

### State Management

#### Redux State

-   `currentKeyContext`: Current context for organizing notes
-   `draftContent`: Auto-saved draft content for new notes
-   `originalNoteStates`: Original state of notes being edited

#### Local State

-   `content`: Current text content in the editor
-   `contexts`: Array of context tags for the note
-   `isSubmitting`: Whether a save/create operation is in progress

## Key Functions

### `handleContentChange()`

Handles text input and auto-saves drafts for new notes.

```typescript
const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setContent(newContent);

    // Auto-save draft for new notes
    if (!isEditMode) {
        dispatch(updateDraftContent(newContent));
    }
};
```

### `createNote()`

Creates a new note with extracted metadata and contexts.

```typescript
const createNote = async (): Promise<void> => {
    // Extract contexts and tags from content
    const { contexts: extractedContexts, tags } = extractMetadata(content);

    // Merge with manual contexts
    const mergedContexts = [...new Set([...contexts, ...extractedContexts])];

    // Determine note type and create optimistic note
    const noteType = determineNoteType(content);
    const optimisticNote = createOptimisticNote(
        content,
        currentKeyContext,
        noteType,
        mergedContexts,
        tags
    );

    // Dispatch to store and clear draft
    dispatch(
        createNoteOptimistically({ note: optimisticNote, autoSave: true })
    );
    setContent("");
    setContexts([]);
    dispatch(clearDraft());
};
```

### `saveEdit()`

Saves changes to an existing note.

```typescript
const saveEdit = (): void => {
    if (!note) return;

    dispatch(
        updateNoteOptimistically({
            noteId: note.id,
            patches: { content },
        })
    );

    dispatch(setEditingNoteId(null));
};
```

### `cancelEdit()`

Cancels editing and restores the original note content.

```typescript
const cancelEdit = (): void => {
    if (!note || !originalNoteState) return;

    setContent(originalNoteState.content);
    dispatch(setEditingNoteId(null));
};
```

### `handleSubmit()`

Routes form submission to the appropriate handler based on mode.

```typescript
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    // Note mode: create or update note
    if (isEditMode) {
        saveEdit();
    } else {
        await createNote();
    }
};
```

## User Interactions

### Keyboard Shortcuts

-   **Enter**: Submit form (create note, save edit, or send chat message)
-   **Shift+Enter**: Insert new line without submitting

### Visual States

1. **New Note Mode**:
    - Shows submit button with up arrow
    - Placeholder: "Use Markdown to format your notes..."
2. **Chat Mode**:
    - Shows submit button with question mark icon
    - Placeholder: "Ask me to find your notes..."
3. **Edit Mode**:
    - Shows cancel (X) and save (check) buttons
    - Displays ContextContainer for managing contexts
    - Placeholder: "Edit your note..."

## Dependencies

### Redux Slices

-   `draftSlice`: Draft content persistence
-   `notesSlice`: Note creation and updates
-   `uiSlice`: UI state management (chat mode, editing state)

### External Libraries

-   `@ai-sdk/react`: AI chat functionality
-   `react-spinners`: Loading indicators

### Utilities

-   `noteUtils`: Note metadata extraction and creation
-   `note-type-utils`: Note type determination

## Usage Example

```typescript
import { NotesEditor } from "@/components/journal/editor";

// New note creation
<NotesEditor />

// Edit existing note
<NotesEditor note={selectedNote} />
```

## Design Principles

### Simplicity

-   Removed complex plugin systems
-   Eliminated command structures
-   No context suggestion boxes
-   No date picker overlays

### Clarity

-   Clear separation between new notes, editing, and chat modes
-   Straightforward state management
-   Well-documented functions with JSDoc comments

### Maintainability

-   Single source of truth for editor functionality
-   Minimal dependencies
-   Clean, readable code structure

## Future Considerations

If additional features are needed in the future, they should be:

1. Implemented as separate, optional components
2. Integrated through props rather than complex internal systems
3. Documented clearly with their own design specifications
4. Tested independently before integration
