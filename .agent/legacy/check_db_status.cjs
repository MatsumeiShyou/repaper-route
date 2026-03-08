const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to bypass RLS if needed, but let's try anon first

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- Checking 'routes' table existence ---");
    const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .limit(1);

    if (routeError) {
        console.error("❌ Error accessing 'routes' table:", routeError);
    } else {
        console.log("✅ 'routes' table exists. Rows found:", routeData.length);
    }

    console.log("\n--- Checking 'rpc_execute_board_update' function ---");
    // Attempt to call RPC with dummy data
    const dummyDate = new Date().toISOString().split('T')[0];
    const dummyState = { jobs: [], drivers: [], splits: [], pending: [] };

    const { data: rpcData, error: rpcError } = await supabase
        .rpc('rpc_execute_board_update', {
            p_date: dummyDate,
            p_new_state: dummyState,
            p_decision_type: 'CHECK',
            p_reason: 'Sanity Check'
        });

    if (rpcError) {
        console.error("❌ Error calling RPC:", rpcError);
        console.error("Details:", JSON.stringify(rpcError, null, 2));
    } else {
        console.log("✅ RPC call successful. Result:", rpcData);
    }
}

check();
