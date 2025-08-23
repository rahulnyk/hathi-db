/**
 * Test utilities for database operations
 * Provides helper functions for test setup and cleanup
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Truncates all tables in the test database
 */
export async function truncateTestDatabase(): Promise<void> {
    try {
        await execAsync("yarn db:test:truncate");
    } catch (error) {
        console.error("Failed to truncate test database:", error);
        throw error;
    }
}

/**
 * Seeds the test database with sample data
 */
export async function seedTestDatabase(): Promise<void> {
    try {
        await execAsync("yarn db:test:seed");
    } catch (error) {
        console.error("Failed to seed test database:", error);
        throw error;
    }
}

/**
 * Resets the test database (truncate + seed)
 */
export async function resetTestDatabase(): Promise<void> {
    try {
        await execAsync("yarn db:test:reset");
    } catch (error) {
        console.error("Failed to reset test database:", error);
        throw error;
    }
}
