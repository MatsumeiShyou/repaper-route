
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspectTriggers() {
    const { data: triggers, error } = await supabase.rpc('rpc_debug_query', {
        p_query: `
            SELECT 
                tgname as trigger_name,
                proname as function_name,
                tgenabled as status
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'master_collection_points';
        `
    });

    if (error) { console.error('Error:', error); return; }
    console.log('--- Triggers on master_collection_points ---');
    console.log(JSON.stringify(triggers, null, 2));
}

inspectTriggers();
