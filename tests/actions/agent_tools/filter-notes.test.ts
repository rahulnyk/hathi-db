/**
 * Unit tests for filter-notes agent tool PostgreSQL migration
 *
 * These tests validate the migration from Supabase to local PostgreSQL database
 * and ensure all filtering functionality works correctly.
 */

import {
    describe,
    test,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
} from "@jest/globals";
import {
    filterNotes,
    getFilterOptions,
    NotesFilter,
} from "../../../app/agent_tools/filter-notes";
import { TodoStatus } from "../../../store/notesSlice";
import { createDb } from "../../../db/connection";
import { notes } from "../../../db/schema";
import { eq, like, sql } from "drizzle-orm";

describe("filter-notes PostgreSQL Migration Tests", () => {
    let db: ReturnType<typeof createDb>;

    // Test data for comprehensive testing
    const testNotes = [
        {
            content: "TEST_FILTER: First test note for filtering",
            key_context: "work-context",
            contexts: ["work", "project"],
            tags: ["urgent", "backend"],
            note_type: "note",
            status: TodoStatus.TODO,
            deadline: new Date("2025-08-25T10:00:00.000Z"),
            created_at: new Date("2025-08-20T10:00:00.000Z"),
            updated_at: new Date("2025-08-20T10:00:00.000Z"),
        },
        {
            content: "TEST_FILTER: AI generated note for testing",
            key_context: "ai-context",
            contexts: ["ai", "research"],
            tags: ["ml", "experiment"],
            note_type: "ai-note",
            status: TodoStatus.DOING,
            deadline: new Date("2025-08-26T15:00:00.000Z"),
            created_at: new Date("2025-08-21T08:00:00.000Z"),
            updated_at: new Date("2025-08-21T08:00:00.000Z"),
        },
        {
            content: "TEST_FILTER: Completed task note",
            key_context: "task-context",
            contexts: ["personal", "health"],
            tags: ["fitness", "completed"],
            note_type: "todo",
            status: TodoStatus.DONE,
            deadline: new Date("2025-08-23T12:00:00.000Z"),
            created_at: new Date("2025-08-19T14:00:00.000Z"),
            updated_at: new Date("2025-08-23T12:00:00.000Z"),
        },
        {
            content: "TEST_FILTER: Note without deadline",
            key_context: "general-context",
            contexts: ["work", "documentation"],
            tags: ["docs", "reference"],
            note_type: "note",
            status: null,
            deadline: null,
            created_at: new Date("2025-08-22T09:00:00.000Z"),
            updated_at: new Date("2025-08-22T09:00:00.000Z"),
        },
        {
            content: "TEST_FILTER: Mixed contexts note",
            key_context: "mixed-context",
            contexts: ["work", "project", "personal"],
            tags: ["important", "review"],
            note_type: "ai-todo",
            status: TodoStatus.OBSOLETE,
            deadline: new Date("2025-08-24T18:00:00.000Z"),
            created_at: new Date("2025-08-18T16:00:00.000Z"),
            updated_at: new Date("2025-08-24T18:00:00.000Z"),
        },
    ];

    beforeAll(async () => {
        db = createDb();
        await db.$client.connect();
    });

    afterAll(async () => {
        // Clean up all test data
        try {
            await db.delete(notes).where(like(notes.content, "TEST_FILTER:%"));
        } catch (error) {
            console.error("Error cleaning up test data:", error);
        } finally {
            await db.$client.end();
        }
    });

    beforeEach(async () => {
        // Clean up any existing test data and insert fresh test data
        try {
            await db.delete(notes).where(like(notes.content, "TEST_FILTER:%"));
            await db.insert(notes).values(testNotes);
        } catch (error) {
            console.error("Error setting up test data:", error);
            throw error;
        }
    });

    describe("filterNotes function", () => {
        test("should return notes with default parameters", async () => {
            const result = await filterNotes();

            expect(result).toHaveProperty("notes");
            expect(result).toHaveProperty("totalCount");
            expect(result).toHaveProperty("appliedFilters");
            expect(Array.isArray(result.notes)).toBe(true);
            expect(typeof result.totalCount).toBe("number");
            expect(result.appliedFilters.limit).toBe(20);
        });

        test("should apply limit filter correctly", async () => {
            const result = await filterNotes({ limit: 2 });

            expect(result.notes.length).toBeLessThanOrEqual(2);
            expect(result.appliedFilters.limit).toBe(2);
        });

        test("should enforce maximum limit of 50", async () => {
            const result = await filterNotes({ limit: 100 });

            expect(result.appliedFilters.limit).toBe(50);
        });

        test("should filter by creation date range", async () => {
            const filters: NotesFilter = {
                createdAfter: "2025-08-20T00:00:00.000Z",
                createdBefore: "2025-08-22T00:00:00.000Z",
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.createdAfter).toBe(
                filters.createdAfter
            );
            expect(result.appliedFilters.createdBefore).toBe(
                filters.createdBefore
            );

            // Verify all returned notes are within date range
            result.notes.forEach((note) => {
                const createdAt = new Date(note.created_at);
                expect(createdAt.getTime()).toBeGreaterThanOrEqual(
                    new Date(filters.createdAfter!).getTime()
                );
                expect(createdAt.getTime()).toBeLessThanOrEqual(
                    new Date(filters.createdBefore!).getTime()
                );
            });
        });

        test("should filter by single context", async () => {
            const filters: NotesFilter = {
                contexts: ["work"],
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.contexts).toEqual(["work"]);

            // Verify all returned notes contain the specified context
            result.notes.forEach((note) => {
                expect(note.contexts).toContain("work");
            });
        });

        test("should filter by multiple contexts (AND operation)", async () => {
            const filters: NotesFilter = {
                contexts: ["work", "project"],
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.contexts).toEqual(["work", "project"]);

            // Verify all returned notes contain ALL specified contexts
            result.notes.forEach((note) => {
                expect(note.contexts).toContain("work");
                expect(note.contexts).toContain("project");
            });
        });

        test("should filter by note type", async () => {
            const filters: NotesFilter = {
                noteType: "ai-note",
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.noteType).toBe("ai-note");

            // Verify all returned notes have the specified type
            result.notes.forEach((note) => {
                expect(note.note_type).toBe("ai-note");
            });
        });

        test("should filter by TODO status", async () => {
            const filters: NotesFilter = {
                status: TodoStatus.DONE,
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.status).toBe(TodoStatus.DONE);

            // Verify all returned notes have the specified status
            result.notes.forEach((note) => {
                expect(note.status).toBe(TodoStatus.DONE);
            });
        });

        test("should filter by deadline date range", async () => {
            const filters: NotesFilter = {
                deadlineAfter: "2025-08-24T00:00:00.000Z",
                deadlineBefore: "2025-08-27T00:00:00.000Z",
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.deadlineAfter).toBe(
                filters.deadlineAfter
            );
            expect(result.appliedFilters.deadlineBefore).toBe(
                filters.deadlineBefore
            );

            // Verify all returned notes have deadlines within range
            result.notes.forEach((note) => {
                if (note.deadline) {
                    const deadline = new Date(note.deadline);
                    expect(deadline.getTime()).toBeGreaterThanOrEqual(
                        new Date(filters.deadlineAfter!).getTime()
                    );
                    expect(deadline.getTime()).toBeLessThanOrEqual(
                        new Date(filters.deadlineBefore!).getTime()
                    );
                }
            });
        });

        test("should filter by specific deadline date", async () => {
            const filters: NotesFilter = {
                deadlineOn: "2025-08-25",
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.deadlineOn).toBe("2025-08-25");

            // Verify all returned notes have deadline on the specified date
            result.notes.forEach((note) => {
                if (note.deadline) {
                    const deadline = new Date(note.deadline);
                    expect(deadline.getUTCDate()).toBe(25);
                    expect(deadline.getUTCMonth() + 1).toBe(8); // Month is 0-indexed
                    expect(deadline.getUTCFullYear()).toBe(2025);
                }
            });
        });

        test("should combine multiple filters correctly", async () => {
            const filters: NotesFilter = {
                contexts: ["work"],
                noteType: "note",
                status: TodoStatus.TODO,
                limit: 10,
            };

            const result = await filterNotes(filters);

            expect(result.appliedFilters.contexts).toEqual(["work"]);
            expect(result.appliedFilters.noteType).toBe("note");
            expect(result.appliedFilters.status).toBe(TodoStatus.TODO);
            expect(result.appliedFilters.limit).toBe(10);

            // Verify all conditions are met
            result.notes.forEach((note) => {
                expect(note.contexts).toContain("work");
                expect(note.note_type).toBe("note");
                expect(note.status).toBe(TodoStatus.TODO);
            });
        });

        test("should return proper note structure with required fields", async () => {
            const result = await filterNotes({ limit: 1 });

            if (result.notes.length > 0) {
                const note = result.notes[0];

                // Verify required fields
                expect(note).toHaveProperty("id");
                expect(note).toHaveProperty("content");
                expect(note).toHaveProperty("persistenceStatus");
                expect(note).toHaveProperty("created_at");

                // Verify types
                expect(typeof note.id).toBe("string");
                expect(typeof note.content).toBe("string");
                expect(note.persistenceStatus).toBe("persisted");
                expect(typeof note.created_at).toBe("string");

                // Verify optional fields have correct types when present
                if (note.contexts) {
                    expect(Array.isArray(note.contexts)).toBe(true);
                }
                if (note.tags) {
                    expect(Array.isArray(note.tags)).toBe(true);
                }
                if (note.suggested_contexts) {
                    expect(Array.isArray(note.suggested_contexts)).toBe(true);
                }
            }
        });

        test("should handle empty result set gracefully", async () => {
            const filters: NotesFilter = {
                contexts: ["nonexistent-context"],
                noteType: "nonexistent-type",
            };

            const result = await filterNotes(filters);

            expect(result.notes).toEqual([]);
            expect(result.totalCount).toBe(0);
            expect(result.appliedFilters.contexts).toEqual([
                "nonexistent-context",
            ]);
            expect(result.appliedFilters.noteType).toBe("nonexistent-type");
        });

        test("should sort notes by created_at in descending order", async () => {
            const result = await filterNotes({ limit: 5 });

            if (result.notes.length > 1) {
                for (let i = 0; i < result.notes.length - 1; i++) {
                    const currentDate = new Date(result.notes[i].created_at);
                    const nextDate = new Date(result.notes[i + 1].created_at);
                    expect(currentDate.getTime()).toBeGreaterThanOrEqual(
                        nextDate.getTime()
                    );
                }
            }
        });

        test("should handle notes with null values correctly", async () => {
            const filters: NotesFilter = {
                status: null as any, // Test null status filter
            };

            const result = await filterNotes(filters);

            // Should not crash and should handle null gracefully
            expect(result).toHaveProperty("notes");
            expect(result).toHaveProperty("totalCount");
        });
    });

    describe("getFilterOptions function", () => {
        test("should return all available filter options with correct structure", async () => {
            const result = await getFilterOptions();

            expect(result).toHaveProperty("availableContexts");
            expect(result).toHaveProperty("availableHashtags");
            expect(result).toHaveProperty("availableNoteTypes");
            expect(result).toHaveProperty("availableStatuses");

            expect(Array.isArray(result.availableContexts)).toBe(true);
            expect(Array.isArray(result.availableHashtags)).toBe(true);
            expect(Array.isArray(result.availableNoteTypes)).toBe(true);
            expect(Array.isArray(result.availableStatuses)).toBe(true);
        });

        test("should include test data contexts", async () => {
            const result = await getFilterOptions();

            expect(result.availableContexts).toContain("work");
            expect(result.availableContexts).toContain("ai");
            expect(result.availableContexts).toContain("personal");
            expect(result.availableContexts).toContain("research");
        });

        test("should include test data hashtags/tags", async () => {
            const result = await getFilterOptions();

            expect(result.availableHashtags).toContain("urgent");
            expect(result.availableHashtags).toContain("ml");
            expect(result.availableHashtags).toContain("fitness");
            expect(result.availableHashtags).toContain("docs");
        });

        test("should include test data note types", async () => {
            const result = await getFilterOptions();

            expect(result.availableNoteTypes).toContain("note");
            expect(result.availableNoteTypes).toContain("ai-note");
            expect(result.availableNoteTypes).toContain("todo");
            expect(result.availableNoteTypes).toContain("ai-todo");
        });

        test("should include test data statuses", async () => {
            const result = await getFilterOptions();

            expect(result.availableStatuses).toContain(TodoStatus.TODO);
            expect(result.availableStatuses).toContain(TodoStatus.DOING);
            expect(result.availableStatuses).toContain(TodoStatus.DONE);
            expect(result.availableStatuses).toContain(TodoStatus.OBSOLETE);
        });

        test("should return sorted arrays", async () => {
            const result = await getFilterOptions();

            // Test that contexts are sorted
            const sortedContexts = [...result.availableContexts].sort();
            expect(result.availableContexts).toEqual(sortedContexts);

            // Test that hashtags are sorted
            const sortedHashtags = [...result.availableHashtags].sort();
            expect(result.availableHashtags).toEqual(sortedHashtags);

            // Test that note types are sorted
            const sortedNoteTypes = [...result.availableNoteTypes].sort();
            expect(result.availableNoteTypes).toEqual(sortedNoteTypes);

            // Test that statuses are sorted
            const sortedStatuses = [...result.availableStatuses].sort();
            expect(result.availableStatuses).toEqual(sortedStatuses);
        });

        test("should filter out empty and null values", async () => {
            // Insert a note with empty/null values for testing
            const emptyNote = {
                content: "TEST_FILTER: Note with empty values",
                key_context: null,
                contexts: ["", "  ", "valid-context"],
                tags: ["", "  ", "valid-tag"],
                note_type: "",
                status: null,
                deadline: null,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const insertResult = await db
                .insert(notes)
                .values(emptyNote)
                .returning({ id: notes.id });
            const insertedId = insertResult[0].id;

            const result = await getFilterOptions();

            // Should not include empty strings or whitespace-only strings
            expect(result.availableContexts).not.toContain("");
            expect(result.availableContexts).not.toContain("  ");
            expect(result.availableHashtags).not.toContain("");
            expect(result.availableHashtags).not.toContain("  ");
            expect(result.availableNoteTypes).not.toContain("");

            // Should include valid values
            expect(result.availableContexts).toContain("valid-context");
            expect(result.availableHashtags).toContain("valid-tag");

            // Clean up
            await db.delete(notes).where(eq(notes.id, insertedId));
        });

        test("should handle empty database gracefully", async () => {
            // Temporarily remove all test data
            await db.delete(notes).where(like(notes.content, "TEST_FILTER:%"));

            const result = await getFilterOptions();

            // Should still have the structure but may contain other data from the database
            expect(Array.isArray(result.availableContexts)).toBe(true);
            expect(Array.isArray(result.availableHashtags)).toBe(true);
            expect(Array.isArray(result.availableNoteTypes)).toBe(true);
            expect(Array.isArray(result.availableStatuses)).toBe(true);

            // Should not contain our test data
            expect(result.availableContexts).not.toContain("work");
            expect(result.availableContexts).not.toContain("ai");
            expect(result.availableHashtags).not.toContain("urgent");
            expect(result.availableHashtags).not.toContain("ml");

            // Restore test data for other tests
            await db.insert(notes).values(testNotes);
        });
    });

    describe("Integration Tests", () => {
        test("should work together: filter options and actual filtering", async () => {
            // Get available options
            const options = await getFilterOptions();

            // Use first available context to filter
            if (options.availableContexts.length > 0) {
                const context = options.availableContexts[0];
                const filterResult = await filterNotes({ contexts: [context] });

                // All returned notes should have this context
                filterResult.notes.forEach((note) => {
                    expect(note.contexts).toContain(context);
                });
            }

            // Use first available note type to filter
            if (options.availableNoteTypes.length > 0) {
                const noteType = options.availableNoteTypes[0];
                const filterResult = await filterNotes({ noteType });

                // All returned notes should have this type
                filterResult.notes.forEach((note) => {
                    expect(note.note_type).toBe(noteType);
                });
            }
        });

        test("should handle complex multi-filter scenarios", async () => {
            const complexFilter: NotesFilter = {
                contexts: ["work"],
                createdAfter: "2025-08-18T00:00:00.000Z",
                createdBefore: "2025-08-23T00:00:00.000Z",
                limit: 3,
            };

            const result = await filterNotes(complexFilter);

            // Verify all filters are applied correctly
            expect(result.appliedFilters.contexts).toEqual(["work"]);
            expect(result.appliedFilters.createdAfter).toBe(
                complexFilter.createdAfter
            );
            expect(result.appliedFilters.createdBefore).toBe(
                complexFilter.createdBefore
            );
            expect(result.appliedFilters.limit).toBe(3);

            // Verify result constraints
            expect(result.notes.length).toBeLessThanOrEqual(3);

            result.notes.forEach((note) => {
                expect(note.contexts).toContain("work");
                const createdAt = new Date(note.created_at);
                expect(createdAt.getTime()).toBeGreaterThanOrEqual(
                    new Date(complexFilter.createdAfter!).getTime()
                );
                expect(createdAt.getTime()).toBeLessThanOrEqual(
                    new Date(complexFilter.createdBefore!).getTime()
                );
            });
        });
    });

    describe("Error Handling", () => {
        test("should handle database connection issues gracefully", async () => {
            // Test with an extremely large limit that might cause resource issues
            const problematicFilter: NotesFilter = {
                limit: 999999999, // This should be capped to 50 by the function
            };

            const result = await filterNotes(problematicFilter);

            // Should cap the limit to maximum allowed (50)
            expect(result.appliedFilters.limit).toBe(50);
            expect(result.notes.length).toBeLessThanOrEqual(50);
        });

        test("should handle invalid filter parameters gracefully", async () => {
            const invalidFilters: NotesFilter = {
                createdAfter: "invalid-date",
                deadlineAfter: "another-invalid-date",
            };

            // Should throw an error for invalid dates
            await expect(async () => {
                await filterNotes(invalidFilters);
            }).rejects.toThrow();
        });
    });
});
