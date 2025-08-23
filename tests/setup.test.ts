/**
 * Simple Jest test to verify the setup is working
 */

describe("Jest Setup Test", () => {
    test("should run basic Jest test", () => {
        expect(1 + 1).toBe(2);
        console.log("Jest is working correctly!");
    });

    test("should have Node.js environment", () => {
        expect(typeof process).toBe("object");
        expect(process.env.NODE_ENV).toBe("test");
        console.log("Node.js environment is available");
    });

    test("should load environment variables", () => {
        // These should be set by our jest.env.ts
        expect(process.env.POSTGRES_HOST).toBe("localhost");
        expect(process.env.POSTGRES_DB).toBe("hathi_db_test");
        console.log("Environment variables loaded:", {
            host: process.env.POSTGRES_HOST,
            database: process.env.POSTGRES_DB,
        });
    });
});
