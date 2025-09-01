/**
 * Database Adapter Module
 *
 * This module provides a clean interface for database operations
 * and exports the appropriate adapter implementation based on environment.
 */

export * from "../../types";
export { PostgreSQLAdapter } from "./postgresql";

// Import the environment-aware database factory
import { db as databaseAdapter } from "../../index";

// Export the database adapter instance
export { databaseAdapter };
