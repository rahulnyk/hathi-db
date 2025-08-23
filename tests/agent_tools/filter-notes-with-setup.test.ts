/**
 * Jest test suite for filter-notes functions with database setup
 * Tests the core filtering functionality with PostgreSQL/Drizzle
 */

import {
    filterNotes,
    getFilterOptions,
} from "../../app/agent_tools/filter-notes";
import { exec } from "child_process";
import { promisify } from "util";
import "../../jest.env";

const execAsync = promisify(exec);

describe("Filter Notes Functions with Database Setup", () => {
    beforeAll(async () => {
        console.log("🧹 Truncating test database tables...");
        try {
            // Truncate all tables to ensure clean state
            await execAsync(
                "cd /Users/rahulnayak/TechWork/hathi-db && yarn db:test:truncate"
            );
            console.log("✅ Tables truncated successfully");

            console.log("🌱 Seeding test database with necessary data...");
            // Seed with minimal test data (no AI required)
            await execAsync(
                "cd /Users/rahulnayak/TechWork/hathi-db && yarn db:test:seed"
            );
            console.log("✅ Test data seeded successfully");
        } catch (error) {
            console.error("❌ Failed to setup test database:", error);
            throw error;
        }
    }, 60000); // 1 minute timeout for database operations

    afterAll(async () => {
        console.log("🧹 Cleaning up test database after tests...");
        try {
            // Truncate tables after all tests complete
            await execAsync(
                "cd /Users/rahulnayak/TechWork/hathi-db && yarn db:test:truncate"
            );
            console.log("✅ Test database cleaned up successfully");
        } catch (error) {
            console.error("⚠️  Failed to cleanup test database:", error);
            // Don't throw error in cleanup to avoid masking test failures
        }
    });

    describe("getFilterOptions", () => {
        test("should retrieve available filter options", async () => {
            const options = await getFilterOptions();

            expect(options).toBeDefined();
            expect(options.availableContexts).toBeInstanceOf(Array);
            expect(options.availableHashtags).toBeInstanceOf(Array);
            expect(options.availableNoteTypes).toBeInstanceOf(Array);
            expect(options.availableStatuses).toBeInstanceOf(Array);

            console.log("Filter options retrieved:", {
                contexts: options.availableContexts.length,
                hashtags: options.availableHashtags.length,
                noteTypes: options.availableNoteTypes.length,
                statuses: options.availableStatuses.length,
            });

            // With fresh seeded data, we should have some options available
            expect(
                options.availableContexts.length +
                    options.availableNoteTypes.length
            ).toBeGreaterThan(0);
        });
    });

    describe("filterNotes", () => {
        test("should filter notes with basic limit", async () => {
            const result = await filterNotes({ limit: 5 });

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBeLessThanOrEqual(5);
            expect(result.totalCount).toBeGreaterThan(0); // Should have seeded data
            expect(result.appliedFilters.limit).toBe(5);

            console.log("Basic filter result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
                appliedLimit: result.appliedFilters.limit,
            });
        });

        test("should return notes with valid structure", async () => {
            const result = await filterNotes({ limit: 1 });

            expect(result.notes.length).toBeGreaterThan(0); // Should have seeded data

            const note = result.notes[0];
            expect(note).toBeDefined();
            expect(typeof note.id).toBe("string");
            expect(typeof note.content).toBe("string");
            expect(typeof note.created_at).toBe("string");
            expect(note.created_at).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
            ); // ISO date format

            console.log("Note structure verified:", {
                id: note.id.substring(0, 8) + "...",
                contentLength: note.content.length,
                created_at: note.created_at.split("T")[0],
            });
        });

        test("should handle date range filters", async () => {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const result = await filterNotes({
                createdAfter: weekAgo.toISOString(),
                limit: 10,
            });

            expect(result.notes).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
            expect(result.appliedFilters.createdAfter).toBe(
                weekAgo.toISOString()
            );

            console.log("Date filter result:", {
                createdAfter: weekAgo.toISOString().split("T")[0],
                notesCount: result.notes.length,
                totalCount: result.totalCount,
            });
        });

        test("should filter by context when available", async () => {
            const options = await getFilterOptions();

            if (options.availableContexts.length > 0) {
                const context = options.availableContexts[0];
                const result = await filterNotes({
                    contexts: [context],
                    limit: 5,
                });

                expect(result.notes).toBeInstanceOf(Array);
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
    });
});
