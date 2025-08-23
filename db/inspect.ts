#!/usr/bin/env tsx

import { createClient, testConnection } from "./connection";

/**
 * Database inspection utility
 * Provides commands to inspect database structure
 */

/**
 * List all tables in the database
 */
async function listTables() {
    console.log("📋 Listing database tables...");

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        if (result.rows.length === 0) {
            console.log("   No tables found in the public schema.");
            return;
        }

        console.log(
            "\n┌─────────────────┬─────────────┬─────────┬─────────┬──────────┐"
        );
        console.log(
            "│ Table Name      │ Owner       │ Indexes │ Rules   │ Triggers │"
        );
        console.log(
            "├─────────────────┼─────────────┼─────────┼─────────┼──────────┤"
        );

        result.rows.forEach((row) => {
            const tableName = row.tablename.padEnd(15);
            const owner = row.tableowner.padEnd(11);
            const hasIndexes = (row.hasindexes ? "✓" : "✗").padEnd(7);
            const hasRules = (row.hasrules ? "✓" : "✗").padEnd(7);
            const hasTriggers = (row.hastriggers ? "✓" : "✗").padEnd(8);

            console.log(
                `│ ${tableName} │ ${owner} │ ${hasIndexes} │ ${hasRules} │ ${hasTriggers} │`
            );
        });

        console.log(
            "└─────────────────┴─────────────┴─────────┴─────────┴──────────┘"
        );
        console.log(
            `\nFound ${result.rows.length} table(s) in the public schema.`
        );
    } catch (error) {
        console.error("❌ Error listing tables:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Show detailed schema for a specific table or all tables
 */
async function listSchema(tableName?: string) {
    console.log(
        tableName
            ? `📊 Showing schema for table: ${tableName}`
            : "📊 Showing database schema..."
    );

    const client = createClient();

    try {
        await client.connect();

        const whereClause = tableName ? `AND c.relname = '${tableName}'` : "";

        const result = await client.query(`
      SELECT 
        c.relname AS table_name,
        a.attname AS column_name,
        t.typname AS data_type,
        a.attlen AS max_length,
        a.attnotnull AS not_null,
        a.atthasdef AS has_default,
        pg_get_expr(d.adbin, d.adrelid) AS default_value,
        a.attnum AS ordinal_position
      FROM pg_class c
      JOIN pg_attribute a ON c.oid = a.attrelid
      JOIN pg_type t ON a.atttypid = t.oid
      LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
      WHERE c.relkind = 'r'
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND a.attnum > 0
        AND NOT a.attisdropped
        ${whereClause}
      ORDER BY c.relname, a.attnum;
    `);

        if (result.rows.length === 0) {
            console.log(
                tableName
                    ? `   Table '${tableName}' not found.`
                    : "   No tables found in the public schema."
            );
            return;
        }

        let currentTable = "";

        result.rows.forEach((row) => {
            if (row.table_name !== currentTable) {
                if (currentTable !== "") console.log(""); // Empty line between tables

                currentTable = row.table_name;
                console.log(`\n🔍 Table: ${currentTable}`);
                console.log(
                    "┌─────────────────────────┬─────────────────┬─────────┬─────────────────────────┐"
                );
                console.log(
                    "│ Column                  │ Type            │ Null?   │ Default                 │"
                );
                console.log(
                    "├─────────────────────────┼─────────────────┼─────────┼─────────────────────────┤"
                );
            }

            const columnName = row.column_name.padEnd(23);
            const dataType = row.data_type.padEnd(15);
            const nullable = (row.not_null ? "NOT NULL" : "NULL").padEnd(7);
            const defaultValue = (row.default_value || "").padEnd(23);

            console.log(
                `│ ${columnName} │ ${dataType} │ ${nullable} │ ${defaultValue} │`
            );
        });

        console.log(
            "└─────────────────────────┴─────────────────┴─────────┴─────────────────────────┘"
        );
    } catch (error) {
        console.error("❌ Error listing schema:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * List all functions in the database
 */
async function listFunctions() {
    console.log("⚙️ Listing database functions...");

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(`
      SELECT 
        n.nspname AS schema_name,
        p.proname AS function_name,
        pg_catalog.pg_get_function_result(p.oid) AS return_type,
        pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
        CASE p.prokind
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'a' THEN 'aggregate'
          WHEN 'w' THEN 'window'
          ELSE 'unknown'
        END AS function_type,
        l.lanname AS language
      FROM pg_proc p
      LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
      LEFT JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'sql_%'
      ORDER BY p.proname;
    `);

        if (result.rows.length === 0) {
            console.log("   No custom functions found in the public schema.");
            return;
        }

        console.log(`\nFound ${result.rows.length} custom function(s):\n`);

        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. 🔧 ${row.function_name}()`);
            console.log(`   Type: ${row.function_type}`);
            console.log(`   Language: ${row.language}`);
            console.log(`   Arguments: ${row.arguments || "none"}`);
            console.log(`   Returns: ${row.return_type}`);
            console.log("");
        });
    } catch (error) {
        console.error("❌ Error listing functions:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * List all indexes in the database
 */
async function listIndexes(tableName?: string) {
    console.log(
        tableName
            ? `📇 Listing indexes for table: ${tableName}`
            : "📇 Listing database indexes..."
    );

    const client = createClient();

    try {
        await client.connect();

        const whereClause = tableName ? `AND t.relname = '${tableName}'` : "";

        const result = await client.query(`
      SELECT 
        t.relname AS table_name,
        i.relname AS index_name,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary,
        a.amname AS index_method,
        pg_get_indexdef(ix.indexrelid) AS definition,
        pg_size_pretty(pg_relation_size(i.oid)) AS size
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_class t ON t.oid = ix.indrelid
      LEFT JOIN pg_am a ON i.relam = a.oid
      WHERE t.relkind = 'r'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ${whereClause}
      ORDER BY t.relname, i.relname;
    `);

        if (result.rows.length === 0) {
            console.log(
                tableName
                    ? `   No indexes found for table '${tableName}'.`
                    : "   No indexes found in the public schema."
            );
            return;
        }

        let currentTable = "";
        let tableCount = 0;

        result.rows.forEach((row) => {
            if (row.table_name !== currentTable) {
                if (currentTable !== "") console.log(""); // Empty line between tables

                currentTable = row.table_name;
                tableCount++;
                console.log(`\n🗂️  Table: ${currentTable}`);
            }

            const indexType = row.is_primary
                ? "🔑 PRIMARY"
                : row.is_unique
                ? "🔒 UNIQUE"
                : "📊 INDEX";

            console.log(
                `   ${indexType} ${
                    row.index_name
                } (${row.index_method.toUpperCase()}) - ${row.size}`
            );

            // Show definition for non-standard indexes
            if (
                row.index_method !== "btree" ||
                row.definition.includes("WHERE")
            ) {
                console.log(
                    `      ${row.definition
                        .replace(
                            /^CREATE [^\\s]+ INDEX [^\\s]+ ON [^\\s]+ /,
                            ""
                        )
                        .replace(/;$/, "")}`
                );
            }
        });

        console.log(
            `\nFound ${result.rows.length} index(es) across ${tableCount} table(s).`
        );
    } catch (error) {
        console.error("❌ Error listing indexes:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Show last N rows from a table
 */
async function showTableData(tableName: string, limit: number = 10) {
    console.log(`📄 Showing last ${limit} rows from table: ${tableName}`);

    const client = createClient();

    try {
        await client.connect();

        // First, check if table exists
        const tableCheck = await client.query(
            `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            );
        `,
            [tableName]
        );

        if (!tableCheck.rows[0].exists) {
            console.log(
                `   ❌ Table '${tableName}' not found in the public schema.`
            );
            return;
        }

        // Get table schema first to understand column structure
        const schemaResult = await client.query(
            `
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position;
        `,
            [tableName]
        );

        if (schemaResult.rows.length === 0) {
            console.log(`   ❌ No columns found for table '${tableName}'.`);
            return;
        }

        // Get the data - order by primary key or first column if no explicit order
        const dataResult = await client.query(
            `
            SELECT * FROM ${tableName} 
            ORDER BY ${schemaResult.rows[0].column_name} DESC 
            LIMIT $1;
        `,
            [limit]
        );

        if (dataResult.rows.length === 0) {
            console.log(`   📭 Table '${tableName}' is empty.`);
            return;
        }

        // Display table header
        console.log(
            `\n🔍 Table: ${tableName} (${dataResult.rows.length} rows shown)`
        );

        // Create dynamic column headers
        const columns = schemaResult.rows.map((col) => col.column_name);
        const maxWidths = columns.map((col) => Math.max(col.length, 15)); // Minimum width of 15

        // Adjust widths based on actual data
        dataResult.rows.forEach((row) => {
            columns.forEach((col, index) => {
                const value = row[col];
                const displayValue = formatValue(value);
                maxWidths[index] = Math.max(
                    maxWidths[index],
                    displayValue.length
                );
            });
        });

        // Cap maximum width to prevent overly wide tables
        const cappedWidths = maxWidths.map((width) => Math.min(width, 50));

        // Create table borders
        const topBorder =
            "┌" + cappedWidths.map((w) => "─".repeat(w + 2)).join("┬") + "┐";
        const headerSeparator =
            "├" + cappedWidths.map((w) => "─".repeat(w + 2)).join("┼") + "┤";
        const bottomBorder =
            "└" + cappedWidths.map((w) => "─".repeat(w + 2)).join("┴") + "┘";

        console.log(topBorder);

        // Print headers
        const headerRow =
            "│" +
            columns
                .map((col, i) => ` ${col.padEnd(cappedWidths[i])} `)
                .join("│") +
            "│";
        console.log(headerRow);
        console.log(headerSeparator);

        // Print data rows
        dataResult.rows.forEach((row) => {
            const dataRow =
                "│" +
                columns
                    .map((col, i) => {
                        const value = row[col];
                        const displayValue = formatValue(value);
                        const truncated =
                            displayValue.length > cappedWidths[i]
                                ? displayValue.substring(
                                      0,
                                      cappedWidths[i] - 3
                                  ) + "..."
                                : displayValue;
                        return ` ${truncated.padEnd(cappedWidths[i])} `;
                    })
                    .join("│") +
                "│";
            console.log(dataRow);
        });

        console.log(bottomBorder);

        // Show additional info
        const totalRowsResult = await client.query(
            `SELECT COUNT(*) as total FROM ${tableName}`
        );
        const totalRows = totalRowsResult.rows[0].total;
        console.log(`\n📊 Total rows in table: ${totalRows}`);

        if (totalRows > limit) {
            console.log(
                `   Showing last ${limit} rows (ordered by ${schemaResult.rows[0].column_name} DESC)`
            );
        }
    } catch (error) {
        console.error("❌ Error showing table data:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Format value for display in table
 */
function formatValue(value: any): string {
    if (value === null || value === undefined) {
        return "NULL";
    }

    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }

    if (Array.isArray(value)) {
        return `[${value.join(", ")}]`;
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    if (typeof value === "string" && value.length > 100) {
        return value.substring(0, 97) + "...";
    }

    return String(value);
}

/**
 * Show database overview (all information)
 */
async function showOverview() {
    console.log("🔍 Database Overview");
    console.log("=".repeat(50));

    await listTables();
    console.log("\n" + "=".repeat(50));

    await listSchema();
    console.log("\n" + "=".repeat(50));

    await listFunctions();
    console.log("\n" + "=".repeat(50));

    await listIndexes();
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];
    const target = process.argv[3];

    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest) {
        console.error(
            "❌ Cannot connect to database. Please check your configuration."
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
            case "functions":
                await listFunctions();
                break;
            case "indexes":
                await listIndexes(target);
                break;
            case "data":
                if (!target) {
                    console.error("❌ Table name required for data command");
                    console.log(
                        "Usage: tsx db/inspect.ts data <table_name> [limit]"
                    );
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
Database Inspection Utility

Usage: tsx db/inspect.ts <command> [target] [options]

Commands:
  tables              List all tables in the database
  schema [table]      Show schema for all tables or specific table
  functions           List all custom functions
  indexes [table]     List all indexes or indexes for specific table
  data <table> [limit] Show last N rows from table (default: 10)
  overview            Show complete database overview

Examples:
  tsx db/inspect.ts tables
  tsx db/inspect.ts schema notes
  tsx db/inspect.ts functions
  tsx db/inspect.ts indexes notes
  tsx db/inspect.ts data notes
  tsx db/inspect.ts data notes 20
  tsx db/inspect.ts overview

Environment variables:
  POSTGRES_HOST      Database host (default: localhost)
  POSTGRES_PORT      Database port (default: 5432)
  POSTGRES_USER      Database user (default: postgres)
  POSTGRES_PASSWORD  Database password
  POSTGRES_DB        Database name (default: hathi_db)
        `);
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
