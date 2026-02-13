const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use ANON Key for now, assuming RLS allows delete or we switch to SERVICE_ROLE if needed. 
// Actually, RLS allows delete for all users in dev mode.

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteRoute() {
    const today = '2026-02-11';
    console.log(`Deleting route for date: ${today}`);

    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('date', today);

    if (error) {
        console.error('Error deleting route:', error);
    } else {
        console.log('Route deleted successfully. Pending jobs should now load from "jobs" table.');
    }
}

deleteRoute();
