
import { PostgreSQLAdapter } from "../db/postgres/adapter/postgresql";
import { SqliteAdapter } from "../db/sqlite/sqlite";
import { createClient } from "../db/postgres/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import { contexts, notesContexts, schema } from "../db/postgres/schema"; 
import { contexts as sqliteContexts, notesContexts as sqliteNotesContexts } from "../db/sqlite/schema"; 
import { inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createSqliteDb } from "../db/sqlite/connection";
import "../jest.env";

describe("Context Rename merge logic", () => {
    const contextA = "test-context-a";
    const contextB = "test-context-b";

    // helper to run the test for a specific adapter
    const runTest = async (adapterName: string, adapter: any, setup: () => Promise<any>, cleanup: () => Promise<any>) => {
        console.log(`Testing ${adapterName} adapter...`);
        let noteId1: string;
        let noteId2: string;
        let noteId3: string;

        try {
            console.log(`[${adapterName}] Running setup...`);
            await setup();

            // 1. Create Context A and B implicitly by creating notes
            console.log(`[${adapterName}] Creating Note 1...`);
            noteId1 = uuidv4();
            await adapter.createNote({
                id: noteId1,
                content: `Note 1 in [[Test Context A]]`,
                contexts: [contextA],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            console.log(`[${adapterName}] Creating Note 2...`);
            noteId2 = uuidv4();
            await adapter.createNote({
                id: noteId2,
                content: `Note 2 in [[Test Context B]]`,
                contexts: [contextB],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            console.log(`[${adapterName}] Creating Note 3...`);
            noteId3 = uuidv4();
            await adapter.createNote({
                id: noteId3,
                content: `Note 3 in [[Test Context A]] and [[Test Context B]]`,
                contexts: [contextA, contextB],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            // Verify initial state
            console.log(`[${adapterName}] Verifying initial state...`);
            let resultsA = await adapter.fetchNotes({ contexts: [contextA] });
            expect(resultsA.length).toBe(2); 

            let resultsB = await adapter.fetchNotes({ contexts: [contextB] });
            expect(resultsB.length).toBe(2); 

            // 2. Rename Context A -> Context B
            console.log(`[${adapterName}] Renaming context...`);
            await adapter.renameContext(contextA, contextB);

            // 3. Verify Merger
            console.log(`[${adapterName}] Verifying merger...`);
            resultsA = await adapter.fetchNotes({ contexts: [contextA] });
            expect(resultsA.length).toBe(0);

            resultsB = await adapter.fetchNotes({ contexts: [contextB] });
            expect(resultsB.length).toBe(3); 

            // Verify content updates
            console.log(`[${adapterName}] Verifying content updates...`);
            const notes = await adapter.fetchNotesByIds([noteId1, noteId3]);
            
            const updatedNote1 = notes.find((n: any) => n.id === noteId1);
            expect(updatedNote1?.content).toContain(`[[Test Context B]]`);
            expect(updatedNote1?.content).not.toContain(`[[Test Context A]]`);

            const updatedNote3 = notes.find((n: any) => n.id === noteId3);
            expect(updatedNote3?.content).toContain(`[[Test Context B]]`);
            expect(updatedNote3?.content).not.toContain(`[[Test Context A]]`);
        } catch (error) {
            console.error(`[${adapterName}] Test failed:`, error);
            throw error;
        } finally {
            console.log(`[${adapterName}] Running cleanup...`);
            await cleanup();
        }
    };

    test("PostgreSQL Adapter should merge contexts", async () => {
        const adapter = new PostgreSQLAdapter();
        const setup = async () => {
             const client = createClient();
             await client.connect();
             const db = drizzle(client, { schema });
             const ctxs = await db.select().from(contexts).where(inArray(contexts.name, [contextA, contextB]));
             const ctxIds = ctxs.map(c => c.id);
             if (ctxIds.length > 0) {
                 await db.delete(notesContexts).where(inArray(notesContexts.context_id, ctxIds));
                 await db.delete(contexts).where(inArray(contexts.id, ctxIds));
             }
             await client.end();
        };
        const cleanup = async () => {
            // Can repeat setup to clean
            await setup();
        };

        await runTest("PostgreSQL", adapter, setup, cleanup);
    }, 30000);

    test("SQLite Adapter should merge contexts", async () => {
        const adapter = new SqliteAdapter();
        const setup = async () => {
             const db = createSqliteDb();
             const ctxs = await db.select().from(sqliteContexts).where(inArray(sqliteContexts.name, [contextA, contextB]));
             const ctxIds = ctxs.map(c => c.id);
             if (ctxIds.length > 0) {
                 await db.delete(sqliteNotesContexts).where(inArray(sqliteNotesContexts.context_id, ctxIds));
                 await db.delete(sqliteContexts).where(inArray(sqliteContexts.id, ctxIds));
             }
        };
        const cleanup = async () => {
            await setup();
        };

        await runTest("SQLite", adapter, setup, cleanup);
    }, 30000);
});
