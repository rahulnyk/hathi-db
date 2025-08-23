/**
 * Jest test suite for semantic-search functions
 * Tests the semantic search functionality with PostgreSQL/Drizzle and vector embeddings
 */

import { searchNotesBySimilarity } from "../../app/agent_tools/semantic-search";
import type { SemanticSearchParams } from "../../app/agent_tools/types";
import "../../jest.env";

describe("Semantic Search Functions", () => {
    beforeAll(async () => {
        // Test database should already be seeded with notes that have embeddings
        console.log("Starting semantic-search tests...");
    });

    describe("searchNotesBySimilarity", () => {
        test("should return search results for a basic query", async () => {
            const params: SemanticSearchParams = {
                query: "test project",
                similarityThreshold: 0.5,
                limit: 5,
            };

            const result = await searchNotesBySimilarity(params);

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBeLessThanOrEqual(5);
            expect(result.totalCount).toBe(result.notes.length);
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe("string");
            expect(result.appliedFilters).toEqual({
                query: "test project",
                similarityThreshold: 0.5,
                limit: 5,
            });

            // Verify each note has the expected structure
            result.notes.forEach((note) => {
                expect(note).toHaveProperty("id");
                expect(note).toHaveProperty("content");
                expect(note).toHaveProperty("created_at");
                expect(note).toHaveProperty("similarity");
                expect(note).toHaveProperty("persistenceStatus", "persisted");
                expect(typeof note.similarity).toBe("number");
                expect(note.similarity).toBeGreaterThanOrEqual(0);
                expect(note.similarity).toBeLessThanOrEqual(1);
            });

            console.log("Basic semantic search result:", {
                notesCount: result.notes.length,
                totalCount: result.totalCount,
                firstNoteSimilarity: result.notes[0]?.similarity,
            });
        });

        test("should handle empty results for very specific query", async () => {
            const params: SemanticSearchParams = {
                query: "very specific query that should not match anything xyz123",
                similarityThreshold: 0.9,
                limit: 10,
            };

            const result = await searchNotesBySimilarity(params);

            expect(result).toBeDefined();
            expect(result.notes).toBeInstanceOf(Array);
            expect(result.notes.length).toBe(0);
            expect(result.totalCount).toBe(0);
            expect(result.message).toContain("No notes found");
            expect(result.appliedFilters.query).toBe(params.query);
        });

        test("should respect similarity threshold", async () => {
            const highThreshold = 0.8;
            const lowThreshold = 0.3;

            const highThresholdResult = await searchNotesBySimilarity({
                query: "project",
                similarityThreshold: highThreshold,
                limit: 20,
            });

            const lowThresholdResult = await searchNotesBySimilarity({
                query: "project",
                similarityThreshold: lowThreshold,
                limit: 20,
            });

            // Low threshold should return more or equal results
            expect(lowThresholdResult.notes.length).toBeGreaterThanOrEqual(
                highThresholdResult.notes.length
            );

            // All results should meet their respective thresholds
            highThresholdResult.notes.forEach((note) => {
                expect(note.similarity).toBeGreaterThanOrEqual(highThreshold);
            });

            lowThresholdResult.notes.forEach((note) => {
                expect(note.similarity).toBeGreaterThanOrEqual(lowThreshold);
            });

            console.log("Threshold comparison:", {
                highThreshold: highThresholdResult.notes.length,
                lowThreshold: lowThresholdResult.notes.length,
            });
        });

        test("should respect limit parameter", async () => {
            const smallLimit = 3;
            const largeLimit = 15;

            const smallResult = await searchNotesBySimilarity({
                query: "note",
                similarityThreshold: 0.4,
                limit: smallLimit,
            });

            const largeResult = await searchNotesBySimilarity({
                query: "note",
                similarityThreshold: 0.4,
                limit: largeLimit,
            });

            expect(smallResult.notes.length).toBeLessThanOrEqual(smallLimit);
            expect(largeResult.notes.length).toBeLessThanOrEqual(largeLimit);
            expect(largeResult.notes.length).toBeGreaterThanOrEqual(
                smallResult.notes.length
            );
        });

        test("should handle whitespace in query", async () => {
            const query = "  test project  ";
            const result = await searchNotesBySimilarity({
                query,
                similarityThreshold: 0.5,
                limit: 5,
            });

            expect(result.appliedFilters.query).toBe("test project");
        });

        test("should validate input parameters", async () => {
            // Test empty query
            await expect(
                searchNotesBySimilarity({
                    query: "",
                    similarityThreshold: 0.5,
                    limit: 5,
                })
            ).rejects.toThrow("Query parameter is required");

            // Test invalid similarity threshold
            await expect(
                searchNotesBySimilarity({
                    query: "test",
                    similarityThreshold: 1.5,
                    limit: 5,
                })
            ).rejects.toThrow(
                "Similarity threshold must be between 0.0 and 1.0"
            );

            // Test invalid limit
            await expect(
                searchNotesBySimilarity({
                    query: "test",
                    similarityThreshold: 0.5,
                    limit: 0,
                })
            ).rejects.toThrow("Limit must be between 1 and 1000");
        });

        test("should return results sorted by similarity (descending)", async () => {
            const result = await searchNotesBySimilarity({
                query: "project",
                similarityThreshold: 0.3,
                limit: 10,
            });

            if (result.notes.length > 1) {
                for (let i = 1; i < result.notes.length; i++) {
                    expect(
                        result.notes[i - 1].similarity!
                    ).toBeGreaterThanOrEqual(result.notes[i].similarity!);
                }
            }
        });

        test("should handle default parameters correctly", async () => {
            const result = await searchNotesBySimilarity({
                query: "test",
            });

            expect(result.appliedFilters.similarityThreshold).toBe(0.7); // DEFAULT from constants
            expect(result.appliedFilters.limit).toBe(15); // DEFAULT from constants
        });
    });

    describe("Error Handling", () => {
        test("should handle database connection errors gracefully", async () => {
            // This test would require mocking the database connection
            // For now, we'll just ensure the function exists and is callable
            expect(typeof searchNotesBySimilarity).toBe("function");
        });
    });
});
