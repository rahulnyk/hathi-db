#!/usr/bin/env tsx

import { createClient } from "../connection";

async function checkCleanFunctions() {
    const client = createClient();
    try {
        await client.connect();

        // Check for any functions with p_user_id parameter
        const userIdFunctions = await client.query(`
            SELECT 
                p.proname as function_name,
                pg_get_function_arguments(p.oid) as arguments
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND pg_get_function_arguments(p.oid) LIKE '%p_user_id%'
            ORDER BY p.proname;
        `);

        console.log("🔍 Functions with p_user_id parameter:");
        if (userIdFunctions.rows.length === 0) {
            console.log(
                "✅ No functions with p_user_id found - database is clean!"
            );
        } else {
            userIdFunctions.rows.forEach((row, index) => {
                console.log(
                    `❌ ${index + 1}. ${row.function_name}(${row.arguments})`
                );
            });
        }

        // Check our main functions exist
        const mainFunctions = await client.query(`
            SELECT 
                p.proname as function_name,
                pg_get_function_arguments(p.oid) as arguments
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname IN ('get_user_context_stats_paginated', 'search_user_contexts', 'search_notes_by_similarity')
            ORDER BY p.proname;
        `);

        console.log("\n🎯 Our application functions:");
        mainFunctions.rows.forEach((row, index) => {
            console.log(
                `✅ ${index + 1}. ${row.function_name}(${row.arguments})`
            );
        });
    } catch (error) {
        console.error("Error checking functions:", error);
    } finally {
        await client.end();
    }
}

checkCleanFunctions();
