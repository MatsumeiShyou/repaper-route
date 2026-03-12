
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function inspectView() {
    const { data, error } = await supabase
        .from('view_master_points')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('--- View Column Names ---');
        console.log(Object.keys(data[0]));
        console.log('--- Content Sample ---');
        console.log(data[0]);
    } else {
        console.log('No data in view');
    }
}
inspectView();
