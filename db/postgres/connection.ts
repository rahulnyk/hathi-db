import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

/**
 * Database connection configuration
 */
const connectionConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "hathi-db-123!",
    database: process.env.POSTGRES_DB || "hathi_db",
};

/**
 * Create a new database client
 */
export function createClient() {
    return new Client(connectionConfig);
}

/**
 * Create a Drizzle database instance
 */
export function createDb() {
    const client = createClient();
    return drizzle(client, { schema });
}

/**
 * Test database connection
 */
export async function testConnection() {
    const client = createClient();
    try {
        await client.connect();
        console.log("✅ Database connection successful!");
        const result = await client.query("SELECT version()");
        console.log("PostgreSQL version:", result.rows[0].version);
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    } finally {
        await client.end();
    }
}
