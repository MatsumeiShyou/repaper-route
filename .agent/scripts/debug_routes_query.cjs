const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoutes() {
    const today = '2026-02-11'; // Explicitly check today JST
    console.log(`Checking routes for date: ${today}`);

    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('date', today);

    let output = `--- Routes Table Check (${today}) ---\n`;
    if (error) {
        output += `Error: ${JSON.stringify(error)}\n`;
    } else {
        output += `Count: ${data.length}\n`;
        if (data.length > 0) {
            output += `First Route Pending Jobs Count: ${data[0].pending ? data[0].pending.length : 0}\n`;
            output += `Assigned Jobs JSON: ${JSON.stringify(data[0].jobs, null, 2)}\n`;
        } else {
            output += "No route record found for today.\n";
        }
    }

    fs.writeFileSync('.agent/scripts/debug_routes_query.txt', output);
}

checkRoutes();
