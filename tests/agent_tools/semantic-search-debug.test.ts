/**
 * Simple test to check if AI API and database are working
 */

import { generateQueryEmbedding } from "../../app/actions/ai";
import { createDb } from "../../db/connection";
import { sql } from "drizzle-orm";
import "../../jest.env";

describe("Semantic Search Components Test", () => {
    test("should generate embedding from AI API", async () => {
        try {
            console.log("Testing AI API...");
            const embedding = await generateQueryEmbedding({
                question: "test",
            });

            expect(embedding).toBeDefined();
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBeGreaterThan(0);

            console.log(
                "✅ AI API working, embedding length:",
                embedding.length
            );
        } catch (error) {
            console.error("❌ AI API failed:", error);
            throw error;
        }
    }, 15000);

    test("should connect to database", async () => {
        const db = createDb();

        try {
            console.log("Testing database connection...");

            // Connect the client before using it
            await db.$client.connect();

            const result = await db.execute(sql`SELECT 1 as test`);

            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows[0]).toHaveProperty("test", 1);

            console.log("✅ Database connection working");
        } catch (error) {
            console.error("❌ Database connection failed:", error);
            throw error;
        } finally {
            await db.$client.end();
        }
    }, 10000);

    test("should call semantic search function", async () => {
        const db = createDb();

        try {
            console.log("Testing PostgreSQL semantic search function...");

            // Connect the client before using it
            await db.$client.connect();

            // Create a simple mock embedding
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

            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();

            console.log(
                "✅ PostgreSQL function working, found",
                result.rows.length,
                "results"
            );
        } catch (error) {
            console.error("❌ PostgreSQL function failed:", error);
            throw error;
        } finally {
            await db.$client.end();
        }
    }, 10000);
});
