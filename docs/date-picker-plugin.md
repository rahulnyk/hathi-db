# Date Picker Plugin

## Overview

The date picker plugin allows users to easily insert dates as contexts in their notes using trigger characters.

## Usage

### Trigger Characters

-   Type `|` (pipe character) or `\` (backslash) anywhere in your note
-   A date picker will appear above the input panel

### Selecting a Date

-   Use the date picker to navigate months and select your desired date
-   Click on a date to select it
-   Press **Enter** to insert the selected date
-   Press **Escape** to cancel and close the date picker

### Date Format

When a date is selected, it gets inserted as a context in the format:

```
[[DD Month YYYY]]
```

For example:

-   Selecting September 27, 2025 inserts: `[[27 September 2025]]`
-   This automatically creates a context slug: `27-september-2025`

### Example Usage

```
We have a meeting on | → Select date → We have a meeting on [[23 April 2025]]
```

## Features

-   **Fixed Position**: The date picker appears in a fixed position above the text editor, not at the cursor position
-   **Keyboard Navigation**:
    -   Use arrow keys to navigate the calendar
    -   Press Enter to confirm selection
    -   Press Escape to cancel
-   **Context Integration**: Selected dates are automatically formatted as contexts and will be saved with the note
-   **Non-blocking**: The date picker doesn't interfere with other editor features like context suggestions

## Implementation Details

The date picker is implemented as an editor plugin following the established plugin pattern:

### Files Created/Modified

-   `date-picker-box.tsx` - The date picker UI component
-   `editorPlugins.ts` - Added date trigger plugins
-   `helpers.ts` - Added date detection and replacement functions
-   `index.tsx` - Integrated date picker into the editor

### Plugin Architecture

-   **Date Trigger Detection**: Detects `|` and `\` characters
-   **Date Selection**: Handles date picker interaction
-   **Context Insertion**: Replaces trigger with formatted date context
-   **State Management**: Manages date picker visibility and selection state
