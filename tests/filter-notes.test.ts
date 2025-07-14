/**
 * Test file for the note filtering functionality
 *
 * This file contains examples and test cases for the filterNotes function
 * Note: These tests require authentication and actual data in the database
 */

import { filterNotes, getFilterOptions } from "../app/agent_tools/filter-notes";
import { TodoStatus } from "../store/notesSlice";

// Example usage of the filterNotes function
export async function testFilterNotes() {
    try {
        // Test 1: Get recent notes
        console.log("Test 1: Recent notes");
        const recentNotes = await filterNotes({
            limit: 5,
        });
        console.log(`Found ${recentNotes.notes.length} recent notes`);

        // Test 2: Filter by date range
        console.log("\nTest 2: Notes from last week");
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const weeklyNotes = await filterNotes({
            createdAfter: lastWeek.toISOString(),
            limit: 10,
        });
        console.log(`Found ${weeklyNotes.notes.length} notes from last week`);

        // Test 3: Filter by context
        console.log("\nTest 3: Notes with specific context");
        const contextNotes = await filterNotes({
            contexts: ["work", "project"],
            limit: 10,
        });
        console.log(`Found ${contextNotes.notes.length} work/project notes`);

        // Test 4: Filter by note type
        console.log("\nTest 4: AI notes only");
        const aiNotes = await filterNotes({
            noteType: "ai-note",
            limit: 5,
        });
        console.log(`Found ${aiNotes.notes.length} AI-generated notes`);

        // Test 5: Filter TODO notes by status
        console.log("\nTest 5: TODO notes by status");
        const todoNotes = await filterNotes({
            noteType: "todo",
            status: TodoStatus.TODO,
            limit: 10,
        });
        console.log(
            `Found ${todoNotes.notes.length} TODO notes with status: TODO`
        );

        // Test 6: Filter by deadline
        console.log("\nTest 6: Notes with upcoming deadlines");
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcomingDeadlines = await filterNotes({
            deadlineAfter: today.toISOString(),
            deadlineBefore: nextWeek.toISOString(),
            limit: 10,
        });
        console.log(
            `Found ${upcomingDeadlines.notes.length} notes with deadlines in the next week`
        );

        // Test 7: Filter by specific deadline date
        console.log("\nTest 7: Notes due today");
        const todayDateOnly = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        const dueTodayNotes = await filterNotes({
            deadlineOn: todayDateOnly,
            limit: 10,
        });
        console.log(`Found ${dueTodayNotes.notes.length} notes due today`);

        // Test 8: Complex filter combination with new fields
        console.log("\nTest 8: Complex filter with new fields");
        const complexFilter = await filterNotes({
            contexts: ["work"],
            noteType: "todo",
            status: TodoStatus.DOING,
            limit: 5,
        });
        console.log(
            `Found ${complexFilter.notes.length} work TODO notes currently in progress`
        );

        // Test 9: Get filter options
        console.log("\nTest 9: Available filter options");
        const options = await getFilterOptions();
        console.log(`Available contexts: ${options.availableContexts.length}`);
        console.log(`Available hashtags: ${options.availableHashtags.length}`);
        console.log(
            `Available note types: ${options.availableNoteTypes.length}`
        );
        console.log(`Available statuses: ${options.availableStatuses.length}`);
        console.log(
            `Available statuses: ${options.availableStatuses.join(", ")}`
        );
    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Example filter scenarios for common use cases
export const commonFilterExamples = {
    // Find today's notes
    todayNotes: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return filterNotes({
            createdAfter: today.toISOString(),
            limit: 20,
        });
    },

    // Find notes from this week
    thisWeekNotes: () => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return filterNotes({
            createdAfter: startOfWeek.toISOString(),
            limit: 20,
        });
    },

    // Find work-related notes
    workNotes: () =>
        filterNotes({
            contexts: ["work", "office", "business"],
            limit: 20,
        }),

    // Find important notes
    importantNotes: () =>
        filterNotes({
            hashtags: ["important", "urgent", "priority"],
            limit: 20,
        }),

    // Find todos with specific status
    todoNotes: () =>
        filterNotes({
            noteType: "todo",
            limit: 20,
        }),

    // Find todos with specific status
    todoNotesInProgress: () =>
        filterNotes({
            noteType: "todo",
            status: TodoStatus.DOING,
            limit: 20,
        }),

    // Find overdue todos
    overdueTodos: () => {
        const today = new Date().toISOString();
        return filterNotes({
            noteType: "todo",
            deadlineBefore: today,
            status: TodoStatus.TODO,
            limit: 20,
        });
    },

    // Find todos due today
    todosDueToday: () => {
        const today = new Date().toISOString().split("T")[0];
        return filterNotes({
            noteType: "todo",
            deadlineOn: today,
            limit: 20,
        });
    },

    // Find AI-generated content
    aiGeneratedNotes: () =>
        filterNotes({
            noteType: "ai-note",
            limit: 10,
        }),
};

// Utility function to format filter results for display
export function formatFilterResults(
    result: Awaited<ReturnType<typeof filterNotes>>
) {
    const { notes, totalCount, appliedFilters } = result;

    let summary = `Found ${notes.length} notes`;
    if (totalCount > notes.length) {
        summary += ` (showing first ${notes.length} of ${totalCount} total)`;
    }

    const filters = [];
    if (appliedFilters.createdAfter)
        filters.push(`after ${appliedFilters.createdAfter}`);
    if (appliedFilters.createdBefore)
        filters.push(`before ${appliedFilters.createdBefore}`);
    if (appliedFilters.contexts)
        filters.push(`contexts: ${appliedFilters.contexts.join(", ")}`);
    if (appliedFilters.noteType)
        filters.push(`type: ${appliedFilters.noteType}`);
    if (appliedFilters.deadlineAfter)
        filters.push(`deadline after: ${appliedFilters.deadlineAfter}`);
    if (appliedFilters.deadlineBefore)
        filters.push(`deadline before: ${appliedFilters.deadlineBefore}`);
    if (appliedFilters.deadlineOn)
        filters.push(`deadline on: ${appliedFilters.deadlineOn}`);
    if (appliedFilters.status) filters.push(`status: ${appliedFilters.status}`);

    if (filters.length > 0) {
        summary += `\nFilters applied: ${filters.join(", ")}`;
    }

    return {
        summary,
        notes: notes.map((note) => ({
            id: note.id,
            preview:
                note.content.substring(0, 100) +
                (note.content.length > 100 ? "..." : ""),
            created: new Date(note.created_at).toLocaleDateString(),
            contexts: note.contexts || [],
            tags: note.tags || [],
            type: note.note_type || "note",
            deadline: note.deadline
                ? new Date(note.deadline).toLocaleDateString()
                : null,
            status: note.status || null,
        })),
    };
}
