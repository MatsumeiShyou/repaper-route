const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_Secret_keys);

async function verify() {
    console.log("=== Phase 5 Exact Constraint Verification ===");

    // Valid driver取得
    const { data: drivers } = await supabase.from('master_drivers').select('id').limit(1);
    const validDriverId = drivers && drivers.length > 0 ? drivers[0].id : null;

    if (!validDriverId) {
        console.log("Skipping exact FK test because no drivers are found in DB.");
        return;
    }

    const invalidCustomerId = "00000000-0000-0000-0000-000000000000";

    const { error: err2 } = await supabase
        .from('jobs')
        .insert({
            job_title: "Test Orphan Job",
            customer_id: invalidCustomerId,
            driver_id: validDriverId
        });

    if (err2) {
        console.log(`Insert blocked. Error code: ${err2.code}`);
        console.log(`Error Message: ${err2.message}`);
        if (err2.message.includes('jobs_customer_id_fkey')) {
            console.log("==> PROOF: jobs_customer_id_fkey is ACTIVE and protecting the database.");
        }
    } else {
        console.log("WARNING: Insert succeeded.");
        await supabase.from('jobs').delete().eq('job_title', 'Test Orphan Job');
    }
}
verify();
