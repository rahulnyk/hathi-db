/**
 * SQLite Database Connection Management
 *
 * This module handles SQLite database connections using better-sqlite3
 * and loads the sqlite-vec extension for vector operations.
 */

import Database, { Database as DatabaseInstance } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema, type Database as DatabaseType } from "./schema";
import * as path from "path";
import * as fs from "fs";

// Singleton connection instance
let dbInstance: DatabaseInstance | null = null;
let drizzleInstance: DatabaseType | null = null;
let extensionLoaded = false;

/**
 * Get database file path
 */
function getDatabasePath(): string {
    const dataDir = path.join(process.cwd(), "data");

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    return path.join(dataDir, "hathi.db");
}

/**
 * Load sqlite-vec extension
 */
function loadSqliteVecExtension(db: Database.Database): void {
    // Skip if already loaded for this instance
    if (extensionLoaded) {
        return;
    }

    try {
        let extensionPath: string;
        let usingFallback = false;

        // First, try the official sqlite-vec package method
        try {
            const sqliteVec = require("sqlite-vec");
            extensionPath = sqliteVec.getLoadablePath();
            console.log("🔍 Using sqlite-vec package path:", extensionPath);
        } catch (vecError) {
            const errorMessage =
                vecError instanceof Error ? vecError.message : String(vecError);
            console.warn(
                "⚠️  sqlite-vec.getLoadablePath() failed:",
                errorMessage
            );

            // Fallback: construct the path manually based on platform
            const path = require("path");
            const platform = process.platform;
            const arch = process.arch;

            let platformPkg: string;
            if (platform === "darwin" && arch === "arm64") {
                platformPkg = "sqlite-vec-darwin-arm64";
            } else if (platform === "darwin" && arch === "x64") {
                platformPkg = "sqlite-vec-darwin-x64";
            } else if (platform === "linux" && arch === "arm64") {
                platformPkg = "sqlite-vec-linux-arm64";
            } else if (platform === "linux" && arch === "x64") {
                platformPkg = "sqlite-vec-linux-x64";
            } else if (platform === "win32" && arch === "x64") {
                platformPkg = "sqlite-vec-windows-x64";
            } else {
                throw new Error(`Unsupported platform: ${platform}-${arch}`);
            }

            const libFile =
                platform === "win32"
                    ? "vec0.dll"
                    : platform === "darwin"
                    ? "vec0.dylib"
                    : "vec0.so";

            extensionPath = path.join(
                process.cwd(),
                "node_modules",
                platformPkg,
                libFile
            );
            usingFallback = true;
            console.log("🔧 Using fallback path:", extensionPath);
        }

        // Verify the extension file exists
        const fs = require("fs");
        if (!fs.existsSync(extensionPath)) {
            const errorMsg = `sqlite-vec extension file not found at: ${extensionPath}`;
            console.error("❌", errorMsg);

            // Try to provide helpful debugging info
            const path = require("path");
            const nodeModulesPath = path.join(process.cwd(), "node_modules");
            const vecDirs = fs
                .readdirSync(nodeModulesPath)
                .filter((dir: string) => dir.includes("sqlite-vec"));
            console.log("🔍 Available sqlite-vec directories:", vecDirs);

            throw new Error(errorMsg);
        }

        // Load the extension
        db.loadExtension(extensionPath);

        extensionLoaded = true;
        const method = usingFallback ? "fallback path" : "sqlite-vec package";
        console.log(
            `✅ sqlite-vec extension loaded successfully (via ${method})`
        );
    } catch (error) {
        console.error("❌ Failed to load sqlite-vec extension:", error);
        console.error(
            "💡 Make sure sqlite-vec and sqlite-vec-darwin-arm64 packages are installed"
        );
        throw new Error(
            "sqlite-vec extension is required for vector operations"
        );
    }
}

/**
 * Create and configure SQLite database connection
 */
export function createSqliteConnection(): Database.Database {
    if (dbInstance) {
        return dbInstance;
    }

    const dbPath = getDatabasePath();

    // Create database connection
    dbInstance = new Database(dbPath);

    // Configure SQLite for optimal performance
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("synchronous = NORMAL");
    dbInstance.pragma("cache_size = 1000000");
    dbInstance.pragma("foreign_keys = ON");
    dbInstance.pragma("temp_store = memory");

    // Load sqlite-vec extension
    loadSqliteVecExtension(dbInstance);

    console.log(`✓ SQLite database connected at: ${dbPath}`);

    return dbInstance;
}

/**
 * Create Drizzle database instance
 */
export function createSqliteDb(): DatabaseType {
    if (drizzleInstance) {
        return drizzleInstance;
    }

    const connection = createSqliteConnection();
    drizzleInstance = drizzle(connection, { schema });

    return drizzleInstance;
}

/**
 * Close database connection
 */
export function closeSqliteConnection(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        drizzleInstance = null;
        extensionLoaded = false; // Reset extension flag
    }
}

/**
 * Get raw SQLite connection for direct queries
 */
export function getRawSqliteConnection(): Database.Database {
    return createSqliteConnection();
}

/**
 * Execute raw SQL with the database
 */
export function executeSql(sql: string, params: any[] = []): any {
    const db = createSqliteConnection();
    try {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    } catch (error) {
        console.error("SQL execution error:", error);
        throw error;
    }
}

/**
 * Create vector table for embeddings
 */
export function createVectorTable(): void {
    const db = createSqliteConnection();

    try {
        // Create vector table using sqlite-vec
        db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS vec0 USING vec0(
                id TEXT PRIMARY KEY,
                embedding FLOAT[1536]
            )
        `);

        console.log("✓ Vector table created successfully");
    } catch (error) {
        console.error("Failed to create vector table:", error);
        throw error;
    }
}

/**
 * Run database migrations
 */
export function runMigrations(): void {
    const db = createSqliteConnection();

    // Check if migrations have already been run
    try {
        const result = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='contexts'"
            )
            .get();
        if (result) {
            console.log("✓ SQLite migrations already completed (tables exist)");
            return;
        }
    } catch (error) {
        // Database might not exist yet, continue with migrations
    }

    const migrationsDir = path.join(__dirname, "migrate");

    // Get all migration files in order
    const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

    console.log("Running SQLite migrations...");

    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf8");

        try {
            // Skip empty files
            if (sql.trim()) {
                db.exec(sql);
            }
            console.log(`✓ Migration ${file} completed`);
        } catch (error) {
            console.error(`✗ Migration ${file} failed:`, error);
            throw error;
        }
    }

    // Create vector table after migrations
    createVectorTable();

    console.log("✓ All SQLite migrations completed");
}
