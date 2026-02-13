const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log("--- Resetting Routes Data for Today ---");

    // 1. Determine Today
    // Adjust timezone if necessary, but usually YYYY-MM-DD matches local date
    const today = new Date();
    // Format YYYY-MM-DD manually to be safe
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    console.log(`Target Date: ${dateKey}`);

    // 2. Check Existence
    const { data: existing, error: checkError } = await supabase
        .from('routes')
        .select('*')
        .eq('date', dateKey)
        .maybeSingle();

    if (checkError) {
        console.error("❌ Error checking routes:", checkError);
        return;
    }

    if (existing) {
        console.log("✅ Found existing route record.");
        console.log("   Pending Jobs Count:", existing.pending ? existing.pending.length : 0);
        console.log("   Assigned Jobs Count:", existing.jobs ? existing.jobs.length : 0);

        // 3. Delete Record to force re-fetch
        console.log("👉 DELETING record to force fresh load from 'jobs' table...");
        const { error: deleteError } = await supabase
            .from('routes')
            .delete()
            .eq('date', dateKey);

        if (deleteError) {
            console.error("❌ Delete Failed:", deleteError);
        } else {
            console.log("✅ Delete Successful. Please reload the app.");
        }

    } else {
        console.log("ℹ️ No route record found for today. The issue might be something else.");
    }
}

reset();
