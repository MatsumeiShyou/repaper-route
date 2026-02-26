const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const connectionString = `postgresql://postgres.${process.env.VITE_SUPABASE_PROJECT_ID}:${process.env.VITE_SUPABASE_DATABASE_PW}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;

async function runMigration() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');
        const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260224000000_add_manual_injection_reasons.sql'), 'utf-8');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
        await client.end();
    }
}

runMigration();
