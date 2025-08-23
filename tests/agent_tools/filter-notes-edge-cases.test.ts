/**
 * Jest test suite for edge cases in filter-notes functions
 * Tests boundary conditions and error handling
 */

import {
    filterNotes,
    getFilterOptions,
} from "../../app/agent_tools/filter-notes";
import { resetTestDatabase } from "../utils/db-helpers";
import "../../jest.env";

describe("Filter Notes Edge Cases", () => {
    beforeAll(async () => {
        // Reset test database with fresh data before running tests
        await resetTestDatabase();
    });

    describe("Empty and Default Parameters", () => {
        test("should handle empty filter parameters", async () => {
            const result = await filterNotes({});

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
            expect(result.appliedFilters.limit).toBeDefined(); // Should have a default limit

            console.log("Empty filters result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
                defaultLimit: result.appliedFilters.limit,
            });
        });

        test("should handle undefined parameters gracefully", async () => {
            const result = await filterNotes({
                contexts: undefined,
                noteType: undefined,
                status: undefined,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Invalid Date Filters", () => {
        test("should handle future date filters", async () => {
            const futureDate = new Date("2026-01-01").toISOString();
            const result = await filterNotes({
                createdAfter: futureDate,
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0); // Should return no results for future dates
            expect(result.totalCount).toBe(0);

            console.log("Future date filter result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
            });
        });

        test("should handle invalid date strings", async () => {
            const result = await filterNotes({
                createdAfter: "invalid-date-string",
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            // Should either handle gracefully or return all results
        });

        test("should handle createdBefore filter", async () => {
            const pastDate = new Date("2020-01-01").toISOString();
            const result = await filterNotes({
                createdBefore: pastDate,
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.appliedFilters.createdBefore).toBe(pastDate);
        });
    });

    describe("Non-existent Values", () => {
        test("should handle non-existent context", async () => {
            const result = await filterNotes({
                contexts: ["non-existent-context-xyz"],
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0); // Should return no results
            expect(result.totalCount).toBe(0);

            console.log("Non-existent context result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
            });
        });

        test("should handle non-existent note type", async () => {
            const result = await filterNotes({
                noteType: "non-existent-note-type",
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0); // Should return no results
            expect(result.totalCount).toBe(0);
        });

        test("should handle non-existent hashtag", async () => {
            const result = await filterNotes({
                hashtags: ["#non-existent-hashtag"],
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0); // Should return no results
            expect(result.totalCount).toBe(0);
        });
    });

    describe("Extreme Values", () => {
        test("should handle very large limit", async () => {
            const result = await filterNotes({
                limit: 999999,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
            // Should handle large limits gracefully
        });

        test("should handle zero limit", async () => {
            const result = await filterNotes({
                limit: 0,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0); // Should return no notes with limit 0
        });

        test("should handle negative limit", async () => {
            const result = await filterNotes({
                limit: -1,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            // Should either handle gracefully or apply a default limit
        });
    });

    describe("Empty Arrays", () => {
        test("should handle empty contexts array", async () => {
            const result = await filterNotes({
                contexts: [],
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });

        test("should handle empty hashtags array", async () => {
            const result = await filterNotes({
                hashtags: [],
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Mixed Valid and Invalid Values", () => {
        test("should handle mix of valid and invalid contexts", async () => {
            const options = await getFilterOptions();
            const contexts =
                options.availableContexts.length > 0
                    ? [options.availableContexts[0], "non-existent-context"]
                    : ["non-existent-context"];

            const result = await filterNotes({
                contexts: contexts,
                limit: 5,
            });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });
    });
});
