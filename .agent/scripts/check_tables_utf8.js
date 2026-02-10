import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    const tables = ['drivers', 'vehicles', 'jobs', 'splits', 'routes', 'profiles'];
    let output = 'Table Check Results:\n';

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            output += `❌ ${table}: ${error.message}\n`;
        } else {
            output += `✅ ${table}: Exists (Rows: ${count})\n`;
        }
    }

    fs.writeFileSync('check_tables_utf8.txt', output);
    console.log(output);
}

checkTables();
