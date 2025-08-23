/**
 * Jest test suite for database-only filter operations
 * Tests that verify database connectivity and basic operations
 */

import {
    filterNotes,
    getFilterOptions,
} from "../../app/agent_tools/filter-notes";
import { resetTestDatabase } from "../utils/db-helpers";
import "../../jest.env";

describe("Filter Notes Database Operations", () => {
    beforeAll(async () => {
        // Reset test database with fresh data before running tests
        await resetTestDatabase();
    });

    describe("Database Connectivity", () => {
        test("should successfully connect to test database", async () => {
            // This test verifies that we can connect to the database
            const result = await filterNotes({ limit: 1 });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(typeof result.totalCount).toBe("number");
            expect(result.appliedFilters).toBeDefined();

            console.log("Database connection test passed");
        });

        test("should retrieve filter options from database", async () => {
            const options = await getFilterOptions();

            expect(options).toBeDefined();
            expect(Array.isArray(options.availableContexts)).toBe(true);
            expect(Array.isArray(options.availableHashtags)).toBe(true);
            expect(Array.isArray(options.availableNoteTypes)).toBe(true);
            expect(Array.isArray(options.availableStatuses)).toBe(true);

            console.log("Filter options retrieval test passed");
        });
    });

    describe("Data Consistency", () => {
        test("should return consistent total count", async () => {
            const result1 = await filterNotes({});
            const result2 = await filterNotes({ limit: 999999 });

            expect(result1.totalCount).toBe(result2.totalCount);
            console.log(
                "Total count consistency test passed:",
                result1.totalCount
            );
        });

        test("should respect limit parameter", async () => {
            const limit = 3;
            const result = await filterNotes({ limit });

            expect(result.notes.length).toBeLessThanOrEqual(limit);
            expect(result.appliedFilters.limit).toBe(limit);

            console.log(
                `Limit respect test passed: requested ${limit}, got ${result.notes.length}`
            );
        });

        test("should return notes with valid structure", async () => {
            const result = await filterNotes({ limit: 1 });

            if (result.notes.length > 0) {
                const note = result.notes[0];

                expect(note).toBeDefined();
                expect(typeof note.id).toBe("string");
                expect(typeof note.content).toBe("string");
                expect(typeof note.created_at).toBe("string");
                expect(note.created_at).toMatch(
                    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
                ); // ISO date format

                console.log("Note structure test passed");
            } else {
                console.log("No notes available for structure test");
            }
        });
    });

    describe("Filter Operations", () => {
        test("should filter by date range correctly", async () => {
            const now = new Date();
            const oneWeekAgo = new Date(
                now.getTime() - 7 * 24 * 60 * 60 * 1000
            );

            const result = await filterNotes({
                createdAfter: oneWeekAgo.toISOString(),
                limit: 10,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);

            // Verify all returned notes are after the specified date
            result.notes.forEach((note) => {
                const noteDate = new Date(note.created_at);
                expect(noteDate.getTime()).toBeGreaterThanOrEqual(
                    oneWeekAgo.getTime()
                );
            });

            console.log(
                `Date range filter test passed: ${result.notes.length} notes found`
            );
        });

        test("should handle complex filter combinations", async () => {
            const options = await getFilterOptions();

            if (options.availableContexts.length > 0) {
                const result = await filterNotes({
                    contexts: [options.availableContexts[0]],
                    createdAfter: new Date("2020-01-01").toISOString(),
                    limit: 5,
                });

                expect(result).toBeDefined();
                expect(result.notes).toBeInstanceOf(Array);
                expect(result.appliedFilters.contexts).toContain(
                    options.availableContexts[0]
                );

                console.log(
                    `Complex filter test passed: ${result.notes.length} notes found`
                );
            } else {
                console.log("No contexts available for complex filter test");
            }
        });
    });

    describe("Performance", () => {
        test("should complete filter operation within reasonable time", async () => {
            const startTime = Date.now();

            const result = await filterNotes({ limit: 50 });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            expect(result).toBeDefined();

            console.log(
                `Performance test passed: operation completed in ${duration}ms`
            );
        });

        test("should handle multiple concurrent filter operations", async () => {
            const [result1, result2, options] = await Promise.all([
                filterNotes({ limit: 10 }),
                filterNotes({ limit: 5 }),
                getFilterOptions(),
            ]);

            expect(result1.notes).toBeInstanceOf(Array);
            expect(result2.notes).toBeInstanceOf(Array);
            expect(options.availableContexts).toBeInstanceOf(Array);

            console.log("Concurrent operations test passed");
        });
    });
});
