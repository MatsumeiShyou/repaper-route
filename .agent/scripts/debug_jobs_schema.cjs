const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- Checking Unassigned Jobs ---");

    // 1. Total Jobs
    const { count: total, error: totalError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Jobs: ${total}`);

    // 2. Unassigned Jobs (Frontend Query)
    const { data: unassigned, error: unassignedError } = await supabase
        .from('jobs')
        .select('id, job_title, driver_id')
        .is('driver_id', null);

    if (unassignedError) {
        console.error("❌ Error fetching unassigned:", unassignedError);
    } else {
        console.log(`Unassigned Jobs (driver_id is null): ${unassigned.length}`);
        if (unassigned.length === 0) {
            console.log("👉 The list is empty because all jobs have a driver_id!");
        } else {
            console.log("👉 There SHOULD be pending jobs in the UI.");
            console.log(JSON.stringify(unassigned.slice(0, 3), null, 2));
        }
    }
}

check();
