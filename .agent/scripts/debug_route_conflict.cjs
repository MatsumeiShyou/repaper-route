const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRouteConflict() {
    let output = "--- Route Conflict Check ---\n";
    const hardcodedDate = '2023-10-27';

    const { data: route, error } = await supabase
        .from('routes')
        .select('date, pending, updated_at')
        .eq('date', hardcodedDate)
        .maybeSingle();

    if (error) {
        output += `Error: ${JSON.stringify(error)}\n`;
    } else if (route) {
        output += `Route EXISTS for ${hardcodedDate}\n`;
        output += `Updated At: ${route.updated_at}\n`;
        output += `Pending Jobs Count in Route: ${route.pending ? route.pending.length : 'null'}\n`;
        if (route.pending && route.pending.length > 0) {
            output += `First Internal Job: ${JSON.stringify(route.pending[0])}\n`;
        }
    } else {
        output += `No route found for ${hardcodedDate}. Logic should have fallen back to jobs table.\n`;
    }

    // Also check today just in case
    const today = new Date().toISOString().split('T')[0];
    const { data: routeToday } = await supabase.from('routes').select('date').eq('date', today).maybeSingle();
    output += `Route for Today (${today}): ${routeToday ? 'EXISTS' : 'NOT FOUND'}\n`;

    fs.writeFileSync('.agent/scripts/debug_route_conflict.txt', output);
    console.log("Check complete.");
}

checkRouteConflict();
