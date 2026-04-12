import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ENV_PATH = path.join(process.cwd(), '.env');
const TEST_EMAIL = 'admin@example.com';

function loadEnv() {
    if (!fs.existsSync(ENV_PATH)) throw new Error(`.env file not found at: ${ENV_PATH}`);
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let val = match[2] || '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            env[match[1]] = val;
        }
    });
    return env;
}

async function run() {
    try {
        const env = loadEnv();
        const dbPw = env.VITE_SUPABASE_DATABASE_PW;
        const projectId = env.VITE_SUPABASE_PROJECT_ID;

        if (!dbPw || !projectId) {
            console.error('Missing VITE_SUPABASE_DATABASE_PW or VITE_SUPABASE_PROJECT_ID in .env');
            process.exit(1);
        }

        const connectionString = `postgresql://postgres:${dbPw}@db.${projectId}.supabase.co:5432/postgres`;
        
        // Red Team 防御策: Supabase Cloud は SSL 必須のため、明示的に設定 (rejectUnauthorized は開発環境のため false)
        const client = new Client({ 
            connectionString,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000 // 10秒でタイムアウト
        });

        console.log(`\x1b[36m[AUTH-INIT] Connecting to Supabase (SSL Enabled): ${projectId}\x1b[0m`);
        await client.connect();
        
        const sql = `
            DO $$
            DECLARE
                v_uid UUID;
            BEGIN
                SELECT id INTO v_uid FROM auth.users WHERE email = '${TEST_EMAIL}';
                IF v_uid IS NOT NULL THEN
                    INSERT INTO public.staffs (id, name, role, allowed_apps)
                    VALUES (v_uid, '開発管理者', 'admin', '["dxos-board"]')
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name, 
                        role = EXCLUDED.role, 
                        allowed_apps = EXCLUDED.allowed_apps;
                    RAISE NOTICE 'SUCCESS: Linked staff record for UID %', v_uid;
                ELSE
                    RAISE EXCEPTION 'User ${TEST_EMAIL} not found. Please log in once in the browser first.';
                END IF;
            END $$;
        `;

        await client.query(sql);
        console.log(`\x1b[32m[SUCCESS]\x1b[0m Database synchronization complete.`);

        await client.end();
    } catch (err) {
        console.error(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
        process.exit(1);
    }
}

run();
