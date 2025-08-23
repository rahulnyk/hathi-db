/**
 * Jest test suite for filter-notes functions
 * Tests the core filtering functionality with PostgreSQL/Drizzle
 */

import {
    filterNotes,
    getFilterOptions,
} from "../../app/agent_tools/filter-notes";
import "../../jest.env";

describe("Filter Notes Functions", () => {
    beforeAll(async () => {
        // Test database should already be seeded
        console.log("Starting filter-notes tests...");
    });

    describe("getFilterOptions", () => {
        test("should retrieve available filter options", async () => {
            const options = await getFilterOptions();

            expect(options).toBeDefined();
            expect(options.availableContexts).toBeInstanceOf(Array);
            expect(options.availableHashtags).toBeInstanceOf(Array);
            expect(options.availableNoteTypes).toBeInstanceOf(Array);
            expect(options.availableStatuses).toBeInstanceOf(Array);

            // Log the actual options for debugging
            console.log("Filter options retrieved:", {
                contexts: options.availableContexts.length,
                hashtags: options.availableHashtags.length,
                noteTypes: options.availableNoteTypes.length,
                statuses: options.availableStatuses.length,
            });
        });
    });

    describe("filterNotes", () => {
        test("should filter notes with basic limit", async () => {
            const result = await filterNotes({ limit: 5 });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBeLessThanOrEqual(5);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
            expect(result.appliedFilters.limit).toBe(5);

            console.log("Basic filter result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
                appliedLimit: result.appliedFilters.limit,
            });
        });

        test("should filter notes by note type", async () => {
            const options = await getFilterOptions();

            if (options.availableNoteTypes.length > 0) {
                const noteType = options.availableNoteTypes[0];
                const result = await filterNotes({
                    noteType: noteType,
                    limit: 3,
                });

                expect(result.notes).toBeInstanceOf(Array);
                expect(result.notes.length).toBeLessThanOrEqual(3);
                expect(result.appliedFilters.noteType).toBe(noteType);

                console.log("Note type filter result:", {
                    noteType: noteType,
                    notesCount: result.notes.length,
                    totalCount: result.totalCount,
                });
            } else {
                console.log("No note types available for testing");
            }
        });

        test("should filter notes by context", async () => {
            const options = await getFilterOptions();

            if (options.availableContexts.length > 0) {
                const context = options.availableContexts[0];
                const result = await filterNotes({
                    contexts: [context],
                    limit: 3,
                });

                expect(result.notes).toBeInstanceOf(Array);
                expect(result.notes.length).toBeLessThanOrEqual(3);
                expect(result.appliedFilters.contexts).toContain(context);

                console.log("Context filter result:", {
                    context: context,
                    notesCount: result.notes.length,
                    totalCount: result.totalCount,
                });
            } else {
                console.log("No contexts available for testing");
            }
        });

        test("should filter notes by date range", async () => {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const result = await filterNotes({
                createdAfter: weekAgo.toISOString(),
                limit: 5,
            });

            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBeLessThanOrEqual(5);
            expect(result.appliedFilters.createdAfter).toBe(
                weekAgo.toISOString()
            );

            console.log("Date filter result:", {
                createdAfter: weekAgo.toISOString().split("T")[0],
                notesCount: result.notes.length,
                totalCount: result.totalCount,
            });
        });
    });
});
