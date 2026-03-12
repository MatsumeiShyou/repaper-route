
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data, error } = await supabase
        .from('master_collection_points')
        .select('location_id, display_name, collection_days')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- DB Data Inspection ---');
    data?.forEach(row => {
        console.log(`ID: ${row.location_id}, Name: ${row.display_name}`);
        console.log(`Type: ${typeof row.collection_days}`);
        console.log(`IsArray: ${Array.isArray(row.collection_days)}`);
        console.log('Content:', JSON.stringify(row.collection_days, null, 2));
        console.log('---------------------------');
    });
}

checkData();
