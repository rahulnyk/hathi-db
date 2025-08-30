/**
 * Database Adapter Module
 *
 * This module provides a clean interface for database operations
 * and exports the appropriate adapter implementation.
 */

export * from "./types";
export { PostgreSQLAdapter } from "./postgresql";

// Create a singleton instance of the database adapter
import { PostgreSQLAdapter } from "./postgresql";
export const databaseAdapter = new PostgreSQLAdapter();
