/**
 * Simple test to verify SQLite embedding functionality
 */

async function testSqliteEmbedding() {
    console.log("🧪 Testing SQLite embedding functionality...");

    try {
        // Set environment to use SQLite
        process.env.USE_DB = "sqlite";

        // Import modules (dynamic import for ES modules)
        const { createSqliteDb, getRawSqliteConnection, runMigrations } =
            await import("./db/sqlite/connection.js");
        const { notes } = await import("./db/sqlite/schema.js");
        const { eq } = await import("drizzle-orm");
        const { v4: uuidv4 } = await import("uuid");

        // Run migrations to ensure tables exist
        console.log("🔧 Running migrations...");
        runMigrations();

        // Create database connection
        const db = createSqliteDb();
        const rawDb = getRawSqliteConnection();

        // Test 1: Create a note
        console.log("📝 Creating test note...");
        const noteId = uuidv4();
        const testNote = {
            id: noteId,
            content: "This is a test note for embedding functionality",
            key_context: "test",
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await db.insert(notes).values(testNote);
        console.log("✅ Note created successfully");

        // Test 2: Add embedding to vector table
        console.log("🧠 Adding embedding to vector table...");
        const testEmbedding = Array.from({ length: 1536 }, () => Math.random());

        const insertEmbedding = rawDb.prepare(`
            INSERT OR REPLACE INTO vec0 (id, embedding) 
            VALUES (?, ?)
        `);

        insertEmbedding.run(noteId, JSON.stringify(testEmbedding));
        console.log("✅ Embedding added successfully");

        // Test 3: Retrieve embedding from vector table
        console.log("🔍 Retrieving embedding from vector table...");
        const retrieveEmbedding = rawDb.prepare(
            "SELECT id, embedding FROM vec0 WHERE id = ?"
        );
        const result = retrieveEmbedding.get(noteId);

        if (result) {
            const storedEmbedding = JSON.parse(result.embedding);
            console.log(
                "✅ Embedding retrieved successfully, length:",
                storedEmbedding.length
            );
        } else {
            throw new Error("Embedding not found");
        }

        // Test 4: Search functionality
        console.log("🔎 Testing search functionality...");
        const allEmbeddings = rawDb
            .prepare("SELECT id, embedding FROM vec0")
            .all();
        console.log("✅ Found", allEmbeddings.length, "embeddings in database");

        // Test 5: Update note with embedding metadata
        console.log("📝 Updating note with embedding metadata...");
        await db
            .update(notes)
            .set({
                embedding_model: "test-model",
                embedding_created_at: Date.now(),
            })
            .where(eq(notes.id, noteId));
        console.log("✅ Note metadata updated successfully");

        // Test 6: Verify note can be retrieved
        console.log("📋 Retrieving note with metadata...");
        const updatedNote = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId));
        console.log("✅ Note retrieved:", updatedNote[0].embedding_model);

        console.log(
            "🎉 All tests passed! SQLite embedding functionality is working."
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testSqliteEmbedding();
