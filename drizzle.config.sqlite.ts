import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./db/embedded/schema.ts",
    out: "./db/embedded/migrate",
    dialect: "sqlite",
    dbCredentials: {
        url: "./data/hathi.db",
    },
    verbose: true,
    strict: true,
});
