import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./db/migrate",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "hathi-db-123!",
        database: process.env.POSTGRES_DB || "hathi_db",
    },
    verbose: true,
    strict: true,
});
