/**
 * SQLite Database Connection Management
 *
 * This module handles SQLite database connections using better-sqlite3
 * and loads the sqlite-vec extension for vector operations using manual
 * extension loading for better compatibility with Next.js applications.
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
let migrationsCompleted = false;

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
        // Manual extension loading approach for better compatibility
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

        const extensionPath = path.join(
            process.cwd(),
            "node_modules",
            platformPkg,
            libFile
        );

        // Verify the extension file exists
        if (!fs.existsSync(extensionPath)) {
            throw new Error(
                `sqlite-vec extension file not found at: ${extensionPath}`
            );
        }

        // Load the extension using better-sqlite3's loadExtension method
        db.loadExtension(extensionPath);

        extensionLoaded = true;
        console.log("✅ sqlite-vec extension loaded successfully");
    } catch (error) {
        console.error("❌ Failed to load sqlite-vec extension:", error);
        console.error(
            "💡 Make sure platform-specific sqlite-vec package is installed (e.g., sqlite-vec-darwin-arm64)"
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

    // Register shutdown handlers
    registerShutdownHandlers();

    console.log(`✓ SQLite database connected at: ${dbPath}`);

    return dbInstance;
}

/**
 * Register process signal handlers for graceful shutdown
 */
function registerShutdownHandlers() {
    // Handle graceful shutdown
    const handleShutdown = (signal: string) => {
        console.log(`\nReceived ${signal}. Closing SQLite connection...`);
        closeSqliteConnection();
        process.exit(0);
    };

    // Register handlers if not already registered (checking exact listeners is tricky, 
    // but better-sqlite3 usually survives multiple opens/closes if handled right. 
    // We'll just add them, worst case they run twice on restart but process.exit stops that).
    // Actually, to avoid duplicate listeners in dev mode, we can check listener count or just depend on module caching.
    
    // We only want to register these once per process usually.
    if (process.listenerCount('SIGINT') === 0) {
        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGQUIT', () => handleShutdown('SIGQUIT'));
        process.on('SIGHUP', () => handleShutdown('SIGHUP'));
    }
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
        try {
            console.log("Closing SQLite database connection...");
            dbInstance.close();
            console.log("SQLite connection closed successfully");
        } catch (error) {
            console.error("Error closing SQLite connection:", error);
        }
        dbInstance = null;
        drizzleInstance = null;
        extensionLoaded = false;
        migrationsCompleted = false;
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
 * Run database migrations
 */
export function runMigrations(): void {
    // Check if migrations have already been run
    if (migrationsCompleted) {
        return;
    }

    const db = createSqliteConnection();

    try {
        const result = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='contexts'"
            )
            .get();
        if (result) {
            migrationsCompleted = true;
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

    migrationsCompleted = true;
    console.log("✓ All SQLite migrations completed");
}
