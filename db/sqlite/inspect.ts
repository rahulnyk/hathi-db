#!/usr/bin/env tsx

import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

/**
 * SQLite database inspection utility
 * Provides commands to inspect database structure
 */

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
 * Load sqlite-vec extension for inspection
 */
function loadSqliteVecExtension(db: Database.Database): void {
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
 * Create a fresh SQLite database connection for inspection
 * Loads SQLite-Vec extension for proper functionality testing
 */
function createInspectionConnection(): Database.Database {
    const dbPath = getDatabasePath();
    const db = new Database(dbPath);

    // Configure SQLite for optimal performance
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");

    // Load sqlite-vec extension
    loadSqliteVecExtension(db);

    console.log(`✓ SQLite database connected at: ${dbPath}`);

    return db;
}

/**
 * Test SQLite database connection
 */
function testConnection(): boolean {
    try {
        const db = createInspectionConnection();
        // Simple test query
        db.prepare("SELECT 1").get();
        db.close();
        return true;
    } catch (error) {
        console.error("Connection test failed:", error);
        return false;
    }
}

/**
 * List all tables in the database
 */
async function listTables() {
    console.log("📋 Listing SQLite database tables...");

    const db = createInspectionConnection();

    try {
        const result = db
            .prepare(
                `
            SELECT 
                name as table_name,
                type,
                sql
            FROM sqlite_master 
            WHERE type = 'table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        `
            )
            .all();

        if (result.length === 0) {
            console.log("   No tables found in the database.");
            return;
        }

        console.log("\n┌─────────────────────────┬──────────┐");
        console.log("│ Table Name              │ Type     │");
        console.log("├─────────────────────────┼──────────┤");

        result.forEach((row: any) => {
            const tableName = String(row.table_name).padEnd(23);
            const type = String(row.type).padEnd(8);

            console.log(`│ ${tableName} │ ${type} │`);
        });

        console.log("└─────────────────────────┴──────────┘");
        console.log(`\nFound ${result.length} table(s) in the database.`);
    } catch (error) {
        console.error("❌ Error listing tables:", error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Show detailed schema for a specific table or all tables
 */
async function listSchema(tableName?: string) {
    console.log(
        tableName
            ? `📊 Showing schema for table: ${tableName}`
            : "📊 Showing SQLite database schema..."
    );

    const db = createInspectionConnection();

    try {
        let tables: any[] = [];

        if (tableName) {
            // Check if specific table exists
            const tableExists = db
                .prepare(
                    `
                SELECT name FROM sqlite_master 
                WHERE type = 'table' AND name = ?
            `
                )
                .get(tableName);

            if (!tableExists) {
                console.log(`   Table '${tableName}' not found.`);
                return;
            }
            tables = [{ table_name: tableName }];
        } else {
            // Get all tables
            tables = db
                .prepare(
                    `
                SELECT name as table_name 
                FROM sqlite_master 
                WHERE type = 'table' 
                AND name NOT LIKE 'sqlite_%'
                ORDER BY name;
            `
                )
                .all();
        }

        if (tables.length === 0) {
            console.log("   No tables found in the database.");
            return;
        }

        for (const table of tables) {
            console.log(`\n🔍 Table: ${table.table_name}`);

            const columns = db
                .prepare(`PRAGMA table_info(${table.table_name})`)
                .all();

            console.log(
                "┌─────────────────────────┬─────────────────┬─────────┬─────────────────────────┐"
            );
            console.log(
                "│ Column                  │ Type            │ Null?   │ Default                 │"
            );
            console.log(
                "├─────────────────────────┼─────────────────┼─────────┼─────────────────────────┤"
            );

            columns.forEach((col: any) => {
                const columnName = String(col.name).padEnd(23);
                const dataType = String(col.type).padEnd(15);
                const nullable = (col.notnull ? "NOT NULL" : "NULL").padEnd(7);
                const defaultValue = String(col.dflt_value || "").padEnd(23);

                console.log(
                    `│ ${columnName} │ ${dataType} │ ${nullable} │ ${defaultValue} │`
                );
            });

            console.log(
                "└─────────────────────────┴─────────────────┴─────────┴─────────────────────────┘"
            );

            // Show indexes for this table
            const indexes = db
                .prepare(
                    `
                SELECT name, sql 
                FROM sqlite_master 
                WHERE type = 'index' 
                AND tbl_name = ?
                AND name NOT LIKE 'sqlite_%'
            `
                )
                .all(table.table_name);

            if (indexes.length > 0) {
                console.log(`\n📋 Indexes for ${table.table_name}:`);
                indexes.forEach((idx: any) => {
                    console.log(`  • ${idx.name}`);
                });
            }
        }
    } catch (error) {
        console.error("❌ Error showing schema:", error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * List all indexes in the database
 */
async function listIndexes(tableName?: string) {
    console.log(
        tableName
            ? `📋 Listing indexes for table: ${tableName}`
            : "📋 Listing all database indexes..."
    );

    const db = createInspectionConnection();

    try {
        let whereClause = "";
        let params: any[] = [];

        if (tableName) {
            whereClause = "AND tbl_name = ?";
            params = [tableName];
        }

        const result = db
            .prepare(
                `
            SELECT 
                name as index_name,
                tbl_name as table_name,
                sql
            FROM sqlite_master 
            WHERE type = 'index' 
            AND name NOT LIKE 'sqlite_%'
            ${whereClause}
            ORDER BY tbl_name, name;
        `
            )
            .all(...params);

        if (result.length === 0) {
            console.log(
                tableName
                    ? `   No indexes found for table '${tableName}'.`
                    : "   No custom indexes found in the database."
            );
            return;
        }

        console.log("\n┌─────────────────────────┬─────────────────────────┐");
        console.log("│ Index Name              │ Table Name              │");
        console.log("├─────────────────────────┼─────────────────────────┤");

        result.forEach((row: any) => {
            const indexName = String(row.index_name).padEnd(23);
            const tableName = String(row.table_name).padEnd(23);

            console.log(`│ ${indexName} │ ${tableName} │`);
        });

        console.log("└─────────────────────────┴─────────────────────────┘");
        console.log(`\nFound ${result.length} index(es).`);
    } catch (error) {
        console.error("❌ Error listing indexes:", error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Show table data with optional limit
 */
async function showTableData(tableName: string, limit: number = 10) {
    console.log(`📄 Showing data from table: ${tableName} (limit: ${limit})`);

    const db = createInspectionConnection();

    try {
        // Check if table exists
        const tableExists = db
            .prepare(
                `
            SELECT name FROM sqlite_master 
            WHERE type = 'table' AND name = ?
        `
            )
            .get(tableName);

        if (!tableExists) {
            console.log(`   Table '${tableName}' not found.`);
            return;
        }

        // Get column info
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

        // Get row count
        const countResult = db
            .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
            .get() as any;
        const totalRows = countResult.count;

        console.log(
            `\nTable has ${totalRows} total rows. Showing first ${Math.min(
                limit,
                totalRows
            )} rows:\n`
        );

        if (totalRows === 0) {
            console.log("   No data found in table.");
            return;
        }

        // Get data
        const data = db
            .prepare(`SELECT * FROM ${tableName} LIMIT ?`)
            .all(limit);

        // Display column headers
        const headers = columns
            .map((col: any) => String(col.name).padEnd(20))
            .join(" │ ");
        console.log(`┌${"─".repeat(headers.length + 2)}┐`);
        console.log(`│ ${headers} │`);
        console.log(`├${"─".repeat(headers.length + 2)}┤`);

        // Display data rows
        data.forEach((row: any) => {
            const values = columns
                .map((col: any) => {
                    let value = row[col.name];
                    if (value === null) value = "NULL";
                    else if (typeof value === "object")
                        value = JSON.stringify(value);
                    else value = String(value);

                    // Truncate long values
                    if (value.length > 18) {
                        value = value.substring(0, 15) + "...";
                    }
                    return value.padEnd(20);
                })
                .join(" │ ");

            console.log(`│ ${values} │`);
        });

        console.log(`└${"─".repeat(headers.length + 2)}┘`);

        if (totalRows > limit) {
            console.log(`\n... and ${totalRows - limit} more rows.`);
        }
    } catch (error) {
        console.error("❌ Error showing table data:", error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Show database overview
 */
async function showOverview() {
    console.log("🔍 SQLite Database Overview");

    const db = createInspectionConnection();

    try {
        // Get database file info
        const dbPath = db.name;
        console.log(`\n📁 Database file: ${dbPath}`);

        // Get all tables
        const tables = db
            .prepare(
                `
            SELECT 
                name as table_name,
                type
            FROM sqlite_master 
            WHERE type = 'table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        `
            )
            .all();

        console.log(`\n📋 Tables (${tables.length}):`);

        for (const table of tables) {
            const tableData = table as any;
            const rowCount = db
                .prepare(
                    `SELECT COUNT(*) as count FROM ${tableData.table_name}`
                )
                .get() as any;
            const indexCount = db
                .prepare(
                    `
                SELECT COUNT(*) as count 
                FROM sqlite_master 
                WHERE type = 'index' 
                AND tbl_name = ?
                AND name NOT LIKE 'sqlite_%'
            `
                )
                .get(tableData.table_name) as any;

            console.log(
                `  • ${tableData.table_name}: ${rowCount.count} rows, ${indexCount.count} indexes`
            );
        }

        // Get all indexes
        const indexes = db
            .prepare(
                `
            SELECT COUNT(*) as count
            FROM sqlite_master 
            WHERE type = 'index' 
            AND name NOT LIKE 'sqlite_%'
        `
            )
            .get() as any;

        // Get all triggers
        const triggers = db
            .prepare(
                `
            SELECT COUNT(*) as count
            FROM sqlite_master 
            WHERE type = 'trigger'
        `
            )
            .get() as any;

        // Get all views
        const views = db
            .prepare(
                `
            SELECT COUNT(*) as count
            FROM sqlite_master 
            WHERE type = 'view'
        `
            )
            .get() as any;

        console.log(`\n📊 Database Summary:`);
        console.log(`  • Tables: ${tables.length}`);
        console.log(`  • Indexes: ${indexes.count}`);
        console.log(`  • Triggers: ${triggers.count}`);
        console.log(`  • Views: ${views.count}`);

        // Check for sqlite-vec extension
        try {
            db.prepare("SELECT vec_version()").get();
            console.log(`  • SQLite-Vec extension: ✅ Loaded`);
        } catch (err) {
            console.log(`  • SQLite-Vec extension: ❌ Not loaded`);
            console.log(`    Error: ${(err as Error).message}`);
        }
    } catch (error) {
        console.error("❌ Error showing overview:", error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Show available tables for user reference
 */
async function showAvailableTables() {
    const db = createInspectionConnection();

    try {
        const tables = db
            .prepare(
                `
            SELECT name as table_name 
            FROM sqlite_master 
            WHERE type = 'table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        `
            )
            .all();

        if (tables.length === 0) {
            console.log("   No tables found in the database.");
            return;
        }

        console.log("\n📋 Available tables:");
        tables.forEach((table: any) => {
            const rowCount = db
                .prepare(`SELECT COUNT(*) as count FROM ${table.table_name}`)
                .get() as any;
            console.log(`  • ${table.table_name} (${rowCount.count} rows)`);
        });

        console.log(`\nExample usage:`);
        const firstTable = tables[0] as any;
        console.log(`  yarn db:sqlite:data ${firstTable.table_name}`);
        console.log(`  yarn db:sqlite:data ${firstTable.table_name} 20`);
    } catch (error) {
        console.error("❌ Error listing available tables:", error);
    } finally {
        db.close();
    }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
    const command = process.argv[2];
    const target = process.argv[3];

    // Test connection first
    const connectionTest = testConnection();
    if (!connectionTest) {
        console.error(
            "❌ Cannot connect to SQLite database. Please check your configuration."
        );
        process.exit(1);
    }

    try {
        switch (command) {
            case "tables":
                await listTables();
                break;
            case "schema":
                await listSchema(target);
                break;
            case "indexes":
                await listIndexes(target);
                break;
            case "data":
                if (!target) {
                    console.error("❌ Table name required for data command");
                    console.log(
                        "Usage: yarn db:sqlite:data <table_name> [limit]"
                    );
                    await showAvailableTables();
                    process.exit(1);
                }
                const limit = process.argv[4] ? parseInt(process.argv[4]) : 10;
                await showTableData(target, limit);
                break;
            case "overview":
                await showOverview();
                break;
            default:
                console.log(`
SQLite Database Inspection Utility

Usage: tsx db/sqlite/inspect.ts <command> [target] [options]

Commands:
  tables              List all tables in the database
  schema [table]      Show schema for all tables or specific table
  indexes [table]     List all indexes or indexes for specific table
  data <table> [limit] Show table data (default limit: 10)
  overview            Show database overview

Examples:
  tsx db/sqlite/inspect.ts tables
  tsx db/sqlite/inspect.ts schema
  tsx db/sqlite/inspect.ts schema notes
  tsx db/sqlite/inspect.ts indexes
  tsx db/sqlite/inspect.ts indexes notes
  tsx db/sqlite/inspect.ts data notes
  tsx db/sqlite/inspect.ts data notes 20
  tsx db/sqlite/inspect.ts overview

Environment variables:
  USE_DB              Database type (should be 'sqlite')
                `);
                break;
        }
    } catch (error) {
        console.error("❌ Command failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
