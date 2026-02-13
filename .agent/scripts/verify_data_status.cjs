const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    let output = "--- Supabase Data Verification ---\n";

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('count');
    if (pError) output += `Profiles Error: ${JSON.stringify(pError)}\n`;
    else output += `Profiles Count: ${profiles[0].count}\n`;

    // 2. Check Jobs (Total)
    const { data: jobs, error: jError } = await supabase.from('jobs').select('count');
    if (jError) output += `Jobs Error: ${JSON.stringify(jError)}\n`;
    else output += `Jobs Count: ${jobs[0].count}\n`;

    // 3. Check Jobs (Pending)
    const { data: pending, error: pdError } = await supabase.from('jobs').select('count').eq('status', '未配車');
    if (pdError) output += `Pending Jobs Error: ${JSON.stringify(pdError)}\n`;
    else output += `Pending Jobs Count: ${pending[0].count}\n`;

    // 4. Sample Job (if exists)
    if (jobs && jobs[0].count > 0) {
        const { data: sample } = await supabase.from('jobs').select('*').limit(1);
        output += `Sample Job: ${JSON.stringify(sample[0], null, 2)}\n`;
    } else {
        output += "No jobs found. Data might have been reset.\n";
    }

    fs.writeFileSync('.agent/scripts/verification_result.txt', output);
    console.log("Verification complete. Results saved to .agent/scripts/verification_result.txt");
}

verifyData();
