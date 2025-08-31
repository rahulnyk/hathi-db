#!/usr/bin/env tsx

import { createClient } from "../connection";

async function checkFunctions() {
    const client = createClient();
    try {
        await client.connect();

        // Check for duplicate function signatures
        const result = await client.query(`
            SELECT 
                p.proname as function_name,
                pg_get_function_arguments(p.oid) as arguments,
                pg_get_function_result(p.oid) as return_type
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname IN ('get_user_context_stats_paginated', 'search_user_contexts')
            ORDER BY p.proname, p.oid;
        `);

        console.log("Function signatures found:");
        result.rows.forEach((row, index) => {
            console.log(
                `${index + 1}. ${row.function_name}(${row.arguments}) -> ${
                    row.return_type
                }`
            );
        });
    } catch (error) {
        console.error("Error checking functions:", error);
    } finally {
        await client.end();
    }
}

checkFunctions();
