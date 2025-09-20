# Context Suggestion Box Implementation

## Overview

This implementation adds a context suggestion box that appears when users type within double square brackets `[[]]` in the notes editor. The feature provides intelligent autocomplete for existing contexts based on user input.

## Key Features

-   ✅ Appears only when typing between `[[]]` brackets
-   ✅ **Only active in notes mode (disabled in chat mode)**
-   ✅ Shows suggestions after typing 2+ characters
-   ✅ Reuses existing context search functionality
-   ✅ Keyboard navigation (Arrow keys, Enter, Tab, Escape)
-   ✅ Mouse interaction support
-   ✅ Replaces bracketed content with selected context
-   ✅ **Transforms context slugs to sentence case when inserting**
-   ✅ Positions cursor after replacement
-   ✅ Modular and clean code architecture
-   ✅ **Displays as horizontal bar above textarea (like QuickType)**

## Files Modified

### 1. `context-suggestion-box.tsx` (NEW)

-   Standalone suggestion box component
-   Reuses `searchContexts` from existing context search
-   Debounced search (200ms) to avoid excessive API calls
-   Keyboard navigation with proper event handling
-   Styled using existing UI components

### 2. `helpers.ts` (ENHANCED)

Added two new helper functions:

-   `detectContextBrackets()` - Detects if cursor is within `[[]]`
-   `replaceContextInBrackets()` - Replaces bracketed content with selected context

### 3. `index.tsx` (ENHANCED)

-   Added context suggestion state management
-   Integrated bracket detection on content change and selection
-   Added handlers for context selection and suggestion box closing
-   Added ContextSuggestionBox component above textarea (horizontal bar layout)
-   Removed complex positioning calculations in favor of simple CSS layout

### 4. `editorPlugins.ts` (ENHANCED)

-   Extended PluginContext interface with context suggestion state
-   Added escape key plugin for closing suggestions
-   Enhanced enter key plugin to work with suggestion box

## Usage

1. Type `[[` in the editor to start a context
2. Type at least 2 characters
3. Suggestion box appears with matching contexts
4. Use arrow keys to navigate suggestions
5. Press Enter/Tab to select, or click with mouse
6. Selected context is converted to sentence case and replaces the bracketed content
7. Cursor moves to after the closing brackets

## Technical Details

### State Management

-   `contextBracketInfo`: Tracks current bracket detection state
-   Uses existing draft and content state
-   Simplified positioning with CSS-based layout

### Event Handling

-   Content change triggers bracket detection
-   Selection change updates bracket context
-   Keyboard events properly handled through plugin system
-   Suggestion box has priority for navigation keys

### Performance

-   Debounced search prevents excessive API calls
-   Only searches when 3+ characters typed
-   Efficient bracket detection algorithm
-   Minimal re-renders through proper state management

### Layout Design

-   **Horizontal bar above textarea** (similar to mobile QuickType)
-   **Flex layout** with wrapped suggestion pills
-   **Full width** spanning the textarea
-   **Clean CSS animations** for show/hide

## Design Decisions

1. **Modular Architecture**: Separate component for suggestions maintains clean separation
2. **Plugin Integration**: Uses existing editor plugin system for keyboard handling
3. **Reuse Existing Logic**: Leverages `searchContexts` and UI components
4. **Performance Optimized**: Debouncing and efficient detection algorithms
5. **Accessibility**: Full keyboard navigation support

## Future Enhancements

-   Support for nested contexts
-   Context creation from suggestion box
-   Recently used contexts prioritization
-   Custom styling options
