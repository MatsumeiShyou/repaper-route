const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDetailedData() {
    let output = "--- Detailed Data Verification ---\n";

    // Date key used in frontend (assuming today or specific date logic, usually YYYY-MM-DD)
    // BoardCanvas uses local date. Let's guess today.
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    output += `Target Date Key: ${dateKey}\n`;

    // 1. Check Routes Table
    const { data: routes, error: rError } = await supabase
        .from('routes')
        .select('*')
        .eq('date', dateKey);

    if (rError) output += `Routes Error: ${JSON.stringify(rError)}\n`;
    else {
        output += `Routes Found: ${routes.length}\n`;
        if (routes.length > 0) {
            output += `Route Pending Jobs Count: ${routes[0].pending ? routes[0].pending.length : 0}\n`;
            output += `Route Updated At: ${routes[0].updated_at}\n`;
        }
    }

    // 2. Check Jobs Table (Global)
    const { data: allJobs, error: jError } = await supabase.from('jobs').select('count');
    if (jError) output += `Jobs Table Error: ${JSON.stringify(jError)}\n`;
    else output += `Total Jobs in DB: ${allJobs[0].count}\n`;

    // 3. Check Jobs (Unassigned)
    const { data: unassigned, error: uError } = await supabase
        .from('jobs')
        .select('id, job_title, status, driver_id')
        .is('driver_id', null);

    if (uError) output += `Unassigned Jobs Error: ${JSON.stringify(uError)}\n`;
    else {
        output += `Unassigned Jobs in DB (driver_id IS NULL): ${unassigned.length}\n`;
        unassigned.forEach(j => {
            output += ` - ID: ${j.id}, Title: ${j.job_title}, Status: ${j.status || 'N/A'}\n`;
        });
    }

    fs.writeFileSync('.agent/scripts/debug_visibility.txt', output);
    console.log("Debug complete. Saved to .agent/scripts/debug_visibility.txt");
}

verifyDetailedData();
