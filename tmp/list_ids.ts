
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function listPoints() {
    const { data } = await supabase
        .from('master_collection_points')
        .select('location_id, display_name')
        .limit(10);
    console.log(data);
}
listPoints();
