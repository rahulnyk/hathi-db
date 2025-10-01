# Journal Date Indication Feature

This feature provides visual indicators in the calendar to show which dates have associated notes. When users open the date picker, they can see small dots under dates that contain journal entries.

## Architecture

### Server Action (`app/actions/journal.ts`)

-   `getDatesWithNotes()`: Fetches distinct date slugs that have notes
-   Uses efficient GLOB filtering followed by regex validation
-   Returns date slugs in 'dd-month-yyyy' format

### Redux State Management (`store/journalSlice.ts`)

-   Manages caching of dates with notes to avoid redundant database queries
-   Provides loading states and error handling
-   Includes refresh functionality for cache invalidation

### UI Components

#### `DatePicker` (`components/ui/date-picker.tsx`)

-   Accepts `datesWithNotes` prop to highlight specific dates
-   Shows small blue dots under dates that have notes
-   Uses efficient Set-based lookups for performance

#### `DateContextPicker` (`components/journal/date_context_picker.tsx`)

-   Fetches dates with notes when calendar opens
-   Handles loading and error states
-   Passes date information to DatePicker component

### Cache Management

The Redux slice provides built-in actions for cache management:

-   `clearDatesCache`: Clears cache and resets state to idle
-   `fetchDatesWithNotes({ forceRefresh: true })`: Forces fresh data fetch regardless of cache state
-   `refreshDatesWithNotes(dispatch)`: Convenience function that wraps the above

## Usage

### Basic Usage

The feature works automatically when users open the date picker. No additional setup is required.

### Cache Management

To refresh the cache when notes are modified:

```typescript
import { useAppDispatch } from "@/store";
import {
    clearDatesCache,
    fetchDatesWithNotes,
    refreshDatesWithNotes,
} from "@/store/journalSlice";

const dispatch = useAppDispatch();

// Option 1: Clear cache and fetch fresh data
dispatch(clearDatesCache());
dispatch(fetchDatesWithNotes({ forceRefresh: true }));

// Option 2: Use convenience function
refreshDatesWithNotes(dispatch);
```

### Manual Refresh

To force a refresh of the dates:

```typescript
import { useAppDispatch } from "@/store";
import {
    fetchDatesWithNotes,
    refreshDatesWithNotes,
} from "@/store/journalSlice";

const dispatch = useAppDispatch();

// Option 1: Direct thunk call with forceRefresh
dispatch(fetchDatesWithNotes({ forceRefresh: true }));

// Option 2: Use convenience function
refreshDatesWithNotes(dispatch);
```

## Performance Considerations

1. **Caching**: Data is cached in Redux to prevent repeated database queries
2. **Efficient Filtering**: Uses GLOB for initial filtering, regex for precision
3. **Set-based Lookups**: O(1) lookups in the DatePicker component
4. **Lazy Loading**: Only fetches data when calendar is opened

## Visual Design

-   Small blue rounded lines (2px height, 16px width) appear below date numbers
-   Only visible on unselected dates that have notes
-   Positioned at the bottom center of each date button
-   Includes subtle shadow for better visibility
-   Rounded ends provide a clean, modern appearance

## Error Handling

-   Server errors return empty array to prevent crashes
-   Redux slice handles loading and error states
-   Failed requests can be retried automatically
-   Comprehensive error logging for debugging

## Integration Points

This feature integrates with:

-   Journal page date navigation
-   Note creation/deletion workflows
-   Calendar date selection
-   Context-based note organization

## Future Enhancements

-   Add note count indicators
-   Show different colors for different note types
-   Preview note content on hover
-   Bulk date operations
