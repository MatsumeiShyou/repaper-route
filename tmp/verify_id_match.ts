
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verifyIdMatch() {
    const { data: point } = await supabase.from('master_collection_points').select('location_id, id').limit(1).single();
    const { data: viewPoint } = await supabase.from('view_master_points').select('id, name').limit(1).single();

    console.log('--- Table ---');
    console.log('location_id:', point?.location_id);
    console.log('uuid_id:', point?.id);

    console.log('\n--- View ---');
    console.log('id in view:', viewPoint?.id);
    console.log('name in view:', viewPoint?.name);
}
verifyIdMatch();
