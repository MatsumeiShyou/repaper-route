const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMockQuery() {
    let output = "--- App Logic Query Verification ---\n";

    // Attempt query exactly as in useBoardData.js
    const { data: unassignedJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .is('driver_id', null);

    if (jobsError) {
        output += `Query Error: ${JSON.stringify(jobsError)}\n`;
    } else {
        output += `Query Success. Count: ${unassignedJobs.length}\n`;
        if (unassignedJobs.length > 0) {
            output += `First Job: ${JSON.stringify(unassignedJobs[0], null, 2)}\n`;
        }
    }

    fs.writeFileSync('.agent/scripts/debug_app_query.txt', output);
    console.log("App query check complete.");
}

verifyMockQuery();
