
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkActualColumns() {
    const { data, error } = await supabase.from('master_collection_points').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('--- Physical Table Columns ---');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('Table is empty, fetching schema...');
        const { data: cols } = await supabase.rpc('rpc_debug_query', {
            p_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'master_collection_points'"
        });
        console.log(cols?.map((c: any) => c.column_name).join(', '));
    }
}

checkActualColumns();
