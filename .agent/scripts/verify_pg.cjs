const { Client } = require('pg');

// Use direct DB connection instead of pooler
const connectionString = `postgresql://postgres:tDwqo3iozPe12W4Q@db.mjaoolcjjlxwstlpdgrg.supabase.co:5432/postgres`;

async function run() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 10000 // 10秒のタイムアウト
    });

    try {
        await client.connect();

        console.log("=== Phase 5 Verification (Raw SQL direct connection) ===");

        // 1. Orphan Check
        console.log("1. Checking for orphan records (customer_id is null or invalid)...");
        const orphanRes = await client.query(`
            SELECT id, job_title, customer_id FROM jobs 
            WHERE customer_id IS NULL OR customer_id NOT IN (SELECT location_id FROM master_collection_points);
        `);
        console.log(`Orphans found in DB: ${orphanRes.rowCount}`);

        // 2. Check Constraint existence
        console.log("\n2. Checking 'jobs_customer_id_fkey' constraint in information_schema...");
        const constRes = await client.query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'jobs' AND constraint_name = 'jobs_customer_id_fkey';
        `);
        if (constRes.rowCount > 0) {
            console.log("SUCCESS: Foreign Key constraint 'jobs_customer_id_fkey' is ACTIVE in the database.");
            console.table(constRes.rows);
        } else {
            console.log("WARNING: Foreign Key constraint NOT FOUND!");
        }

        // 3. Test Violation
        console.log("\n3. Testing physical DB insert (bypassing RLS)...");
        try {
            await client.query(`
                INSERT INTO jobs (job_title, customer_id, driver_id) 
                VALUES ('Test Direct Insert', '00000000-0000-0000-0000-000000000000', 'driver-1')
            `);
            console.log("WARNING: Insert succeeded! Constraint might not be working.");

            // cleanup if it somehow succeeded
            await client.query(`DELETE FROM jobs WHERE job_title = 'Test Direct Insert'`);
        } catch (err) {
            if (err.code === '23503') { // PostgreSQL foreign_key_violation code
                console.log(`SUCCESS: Insert blocked by DB cleanly with FOREIGN KEY VIOLATION (23503).`);
                console.log(`DB Error Message: ${err.message}`);
            } else {
                console.log(`Unexpected insert error: ${err.message} (Code: ${err.code})`);
            }
        }

    } catch (e) {
        console.error("Connection/Execution Error:", e.message);
    } finally {
        await client.end();
    }
}
run();
