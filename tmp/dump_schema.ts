
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function dump() {
    console.log('--- [SCHEMA DUMP] ---');
    
    // Check Table
    const { data: tableData } = await supabase.from('master_collection_points').select('*').limit(1);
    if (tableData && tableData[0]) {
        console.log('TABLE (points) Keys:', Object.keys(tableData[0]).join(', '));
    }

    // Check View
    const { data: viewData } = await supabase.from('view_master_points').select('*').limit(1);
    if (viewData && viewData[0]) {
        console.log('VIEW (points) Keys:', Object.keys(viewData[0]).join(', '));
    }
}

dump();
