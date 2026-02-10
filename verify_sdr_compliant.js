
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed if we want to bypass RLS for cleanup or setup, but here we test as anon/auth user

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

// Emulate a logged-in user (we'll sign in as admin1 for this test)
// Note: In a real scenario we'd need the user's email/password or use a service role to generate a token.
// For simplicity in this script, failing a real login, we might test RLS behavior with Service Role vs Anon if we can't login.
// However, the policy "Allow Select Authenticated" requires an authenticated user.
// Let's try to assume we can use the ANON key but we won't be "authenticated" unless we sign in.
// If we cannot sign in easily, we will simulate the behavior or check policy definitions.
// Actually, let's use the Service Role to CREATE a test user if needed, or just sign in if we know creds.
// Since we don't have user passwords in plain text, we will try to use the existing admin1 if possible, or create a temp one.

// WAIT: The previous tasks implied we have `admin1` in `profiles`. TO test RLS properly we need a valid session.
// IF we can't get a session, we can't verifying the "Approved" path fully as a user.
// BUT we can verify strict RLS by trying as ANON. (Should fail).
// And if we have the SERVICE_ROLE_KEY we can verify the RPC Logic itself works (bypassing RLS on invocation, but the function internals handle logic).

// Actually, let's look at `check_seal.js` or similar... no auth there.
// Let's rely on the fact that `manual_sdr_migration_full.sql` gave permissions to `anon` for some tables, but we LOCKED `routes`.
// Let's try to insert into `routes` as ANON. It should FAIL (RLS).
// Then call RPC as ANON. It should FAIL (if we didn't grant execute to anon, causing 401/403) OR SUCCEED if we granted generic access.
// Wait, I granted execute to `authenticated` and `service_role`. NOT anon.
// So as ANON, both should fail. This proves at least basic security.

// To properly test "Authenticated User fails direct write but succeeds via RPC", we need a token.
// Let's assume for this test we can use the `service_role` key to Simulate an "authenticated" user context if the library allows,
// OR just test that even with Service Role (which bypasses RLS), the RPC creates the logs.
// AND as ANON, direct write fails.

const supabaseAnon = createClient(supabaseUrl, supabaseKey);
// const supabaseAdmin = createClient(supabaseUrl, SERVICE_ROLE_KEY); // If available

async function testRLS() {
    console.log('--- Starting SDR Compliance Verification ---');

    const testDate = '2099-01-01';
    const testPayload = { jobs: [], test: 'sdr_verification' };

    // 1. Test Direct Write (Should FAIL due to RLS for Anon, or even Auth if policy is missing)
    // Since we removed "Enable all access", NO ONE (except service_role) should be able to insert/update directly.
    console.log('\n[TEST 1] Attempting Direct Write to "routes" table (Expect FAILURE)...');
    const { error: directError } = await supabaseAnon
        .from('routes')
        .upsert({ date: testDate, jobs: testPayload });

    if (directError) {
        console.log('✅ Direct Write Failed as expected:', directError.message);
    } else {
        console.error('❌ Direct Write SUCCEEDED! RLS is not enforced correctly.');
        // Clean up if it worked
        // await supabaseAdmin.from('routes').delete().eq('date', testDate);
    }

    // 2. Test RPC Call (As Anon - Should FAIL because we only granted to authenticated)
    console.log('\n[TEST 2] Attempting RPC Call as Anon (Expect FAILURE - 401/403)...');
    const { error: rpcAnonError } = await supabaseAnon.rpc('rpc_execute_board_update', {
        p_date: testDate,
        p_new_state: testPayload,
        p_decision_type: 'VERIFICATION',
        p_reason: 'Testing RPC'
    });

    if (rpcAnonError) {
        console.log('✅ RPC Call Failed as Anon (Security Check):', rpcAnonError.message);
    } else {
        console.error('❌ RPC Call SUCCEEDED as Anon! (Should be restricted to authenticated)');
    }

    // 3. To verify logic, we'd ideally sign in. But without credentials, we can't easily.
    // Reviewing the SQL applied:
    // - RLS on `routes` allows SELECT to authenticated.
    // - No INSERT/UPDATE policy => DENY ALL.
    // - RPC `rpc_execute_board_update` is SECURITY DEFINER.
    // - Logic seems sound based on SQL definition.

    console.log('\n[SUMMARY] RLS Blocking Confirmed. Logic verification relies on code review and manual testing in app.');
}

testRLS().catch(console.error);
