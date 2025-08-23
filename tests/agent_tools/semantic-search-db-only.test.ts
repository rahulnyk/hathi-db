/**
 * Jest test suite for semantic-search database operations
 * Tests that verify database connectivity and PostgreSQL function calls
 */

import { createDb } from "../../db/connection";
import { sql } from "drizzle-orm";
import "../../jest.env";

describe("Semantic Search Database Operations", () => {
    beforeAll(async () => {
        console.log("Starting semantic-search database tests...");
    });

    describe("Database Connectivity", () => {
        test("should successfully call search_notes_by_similarity PostgreSQL function", async () => {
            const db = createDb();

            try {
                // Create a mock embedding (1536 dimensions filled with zeros)
                const mockEmbedding = new Array(1536).fill(0.1);

                // Test the PostgreSQL function call directly
                const result = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(mockEmbedding)}::vector,
                            ${0.1}::float,
                            ${5}::integer
                        )
                    `
                );

                expect(result).toBeDefined();
                expect(result.rows).toBeInstanceOf(Array);

                console.log("PostgreSQL semantic search function test passed");
                console.log("Result count:", result.rows.length);

                // Test that the function returns the expected structure
                if (result.rows.length > 0) {
                    const firstRow = result.rows[0] as Record<string, unknown>;
                    expect(firstRow).toHaveProperty("id");
                    expect(firstRow).toHaveProperty("content");
                    expect(firstRow).toHaveProperty("similarity");
                    console.log(
                        "First result similarity:",
                        firstRow.similarity
                    );
                }
            } catch (error) {
                console.error("Database test error:", error);
                throw error;
            } finally {
                await db.$client.end();
            }
        });

        test("should handle empty results for very low similarity threshold", async () => {
            const db = createDb();

            try {
                // Create a mock embedding with very specific values that won't match anything
                const mockEmbedding = new Array(1536).fill(0.999);

                const result = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(mockEmbedding)}::vector,
                            ${0.99}::float,
                            ${10}::integer
                        )
                    `
                );

                expect(result).toBeDefined();
                expect(result.rows).toBeInstanceOf(Array);

                console.log("High similarity threshold test passed");
                console.log(
                    "Result count with high threshold:",
                    result.rows.length
                );
            } catch (error) {
                console.error("Database test error:", error);
                throw error;
            } finally {
                await db.$client.end();
            }
        });

        test("should respect limit parameter in PostgreSQL function", async () => {
            const db = createDb();

            try {
                const mockEmbedding = new Array(1536).fill(0.1);

                const smallLimitResult = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(mockEmbedding)}::vector,
                            ${0.1}::float,
                            ${2}::integer
                        )
                    `
                );

                const largeLimitResult = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(mockEmbedding)}::vector,
                            ${0.1}::float,
                            ${10}::integer
                        )
                    `
                );

                expect(smallLimitResult.rows.length).toBeLessThanOrEqual(2);
                expect(largeLimitResult.rows.length).toBeGreaterThanOrEqual(
                    smallLimitResult.rows.length
                );

                console.log("Limit parameter test passed");
                console.log(
                    "Small limit results:",
                    smallLimitResult.rows.length
                );
                console.log(
                    "Large limit results:",
                    largeLimitResult.rows.length
                );
            } catch (error) {
                console.error("Database test error:", error);
                throw error;
            } finally {
                await db.$client.end();
            }
        });

        test("should return results sorted by similarity descending", async () => {
            const db = createDb();

            try {
                const mockEmbedding = new Array(1536).fill(0.1);

                const result = await db.execute(
                    sql`
                        SELECT * FROM search_notes_by_similarity(
                            ${JSON.stringify(mockEmbedding)}::vector,
                            ${0.1}::float,
                            ${5}::integer
                        )
                    `
                );

                if (result.rows.length > 1) {
                    for (let i = 1; i < result.rows.length; i++) {
                        const currentRow = result.rows[i] as Record<
                            string,
                            unknown
                        >;
                        const previousRow = result.rows[i - 1] as Record<
                            string,
                            unknown
                        >;

                        expect(
                            Number(previousRow.similarity)
                        ).toBeGreaterThanOrEqual(Number(currentRow.similarity));
                    }
                }

                console.log("Sorting test passed");
            } catch (error) {
                console.error("Database test error:", error);
                throw error;
            } finally {
                await db.$client.end();
            }
        });
    });
});
