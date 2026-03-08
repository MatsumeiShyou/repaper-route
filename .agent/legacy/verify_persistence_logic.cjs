const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("🔍 Starting Logic Verification...");

    // 1. Verify Jobs RLS Fix (Should be readable by Anon now due to GRANT)
    console.log("\n[Test 1] Fetching 'jobs' table (Verifying RLS Fix)...");
    const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title:job_title, bucket:bucket_type')
        .limit(3);

    if (jobsError) {
        console.error("❌ Test 1 Failed: Cannot fetch jobs.", jobsError.message);
    } else {
        console.log(`✅ Test 1 Passed: Fetched ${jobs.length} jobs.`);
        if (jobs.length > 0) console.log("   Sample:", JSON.stringify(jobs[0]));
        else console.warn("   ⚠️ Warning: Table is empty (but accessible).");
    }

    // 2. Verify RPC Existence (Verifying Routes Fix)
    // We expect this might fail with "Permission denied" (RLS) if not logged in,
    // BUT getting "Permission denied" PROVES the function exists!
    // If it didn't exist, we'd get "function not found".
    console.log("\n[Test 2] Calling 'rpc_execute_board_update' (Verifying RPC Existence)...");

    const dummyDate = new Date().toISOString().split('T')[0];
    const { data: rpcResult, error: rpcError } = await supabase.rpc('rpc_execute_board_update', {
        p_date: dummyDate,
        p_new_state: { jobs: [], drivers: [], splits: [], pending: [] },
        p_decision_type: 'VERIFY',
        p_reason: 'Automated Logic Test'
    });

    if (rpcError) {
        if (rpcError.message && rpcError.message.includes('not found')) {
            console.error("❌ Test 2 Failed: RPC function NOT FOUND.");
        } else if (rpcError.code === '42501' || rpcError.message.includes('permission')) {
            console.log("✅ Test 2 Passed (Indirectly): RPC exists (Permission Denied as expected for Anon).");
            console.log("   Failure details (Expected):", rpcError.message);
        } else {
            console.error("❓ Test 2 Unknown Error:", rpcError);
        }
    } else {
        console.log("✅ Test 2 Passed: RPC executed successfully.");
        console.log("   Result:", rpcResult);
    }
}

verify();
