import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    const { data, error, count } = await supabase
        .from('drivers')
        .select('driver_name', { count: 'exact' });

    if (error) {
        console.error('Error fetching drivers:', error);
    } else {
        console.log(`✅ Total Drivers: ${count}`);
        console.log('Names:', data.map(d => d.driver_name).join(', '));
    }
}

verify();
