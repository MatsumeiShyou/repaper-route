
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function compareColumns() {
    const { data: tableData } = await supabase.from('master_collection_points').select('*').limit(1);
    const { data: viewData } = await supabase.from('view_master_points').select('*').limit(1);

    console.log('--- Table: master_collection_points ---');
    console.log(Object.keys(tableData?.[0] || {}));
    
    console.log('\n--- View: view_master_points ---');
    console.log(Object.keys(viewData?.[0] || {}));
}
compareColumns();
