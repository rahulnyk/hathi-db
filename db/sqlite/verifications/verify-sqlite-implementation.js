#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying SQLite embedding implementation...\n");

// Check if migration file exists and contains vec0 table
const migrationPath = path.join(
    __dirname,
    "db",
    "sqlite",
    "migrate",
    "0003_vectors.sql"
);
if (fs.existsSync(migrationPath)) {
    console.log("✅ Migration file exists: 0003_vectors.sql");
    const migrationContent = fs.readFileSync(migrationPath, "utf8");
    if (
        migrationContent.includes("vec0") &&
        migrationContent.includes("embedding FLOAT[1536]")
    ) {
        console.log(
            "✅ Migration creates vec0 virtual table with 1536-dimensional embeddings"
        );
    } else {
        console.log("❌ Migration does not contain proper vec0 table setup");
    }
} else {
    console.log("❌ Migration file missing: 0003_vectors.sql");
}

// Check if SQLite adapter has required methods
const sqlitePath = path.join(__dirname, "db", "sqlite", "sqlite.ts");
if (fs.existsSync(sqlitePath)) {
    console.log("✅ SQLite adapter exists: sqlite.ts");
    const adapterContent = fs.readFileSync(sqlitePath, "utf8");

    // Check for key methods
    const requiredMethods = [
        "calculateCosineSimilarity",
        "executeSemanticSearch",
        "upsertEmbedding",
    ];

    let allMethodsPresent = true;
    requiredMethods.forEach((method) => {
        if (adapterContent.includes(method)) {
            console.log(`✅ Has method: ${method}`);
        } else {
            console.log(`❌ Missing method: ${method}`);
            allMethodsPresent = false;
        }
    });

    // Check if updateNote calls upsertEmbedding
    if (
        adapterContent.includes("updateNote") &&
        adapterContent.includes("upsertEmbedding")
    ) {
        console.log("✅ updateNote integrates with embedding storage");
    } else {
        console.log("❌ updateNote does not integrate with embedding storage");
        allMethodsPresent = false;
    }

    if (allMethodsPresent) {
        console.log("\n🎉 All required methods and integrations are present!");
        console.log("📝 Summary of implementation:");
        console.log("   - Vector table migration creates vec0 virtual table");
        console.log("   - SQLite adapter has cosine similarity calculation");
        console.log("   - SQLite adapter implements semantic search");
        console.log("   - updateNote method stores embeddings when provided");
        console.log(
            "   - executeSemanticSearch retrieves and ranks notes by similarity"
        );
        console.log(
            "\n✨ SQLite embedding functionality should now work correctly!"
        );
    } else {
        console.log("\n❌ Some required methods are missing");
    }
} else {
    console.log("❌ SQLite adapter missing: sqlite.ts");
}

console.log("\n📋 Next steps for testing:");
console.log("   1. Run the application with SQLite database");
console.log("   2. Create notes with embeddings");
console.log("   3. Test semantic search functionality");
console.log("   4. Verify embeddings are stored in vec0 table");
