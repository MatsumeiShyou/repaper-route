const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log("--- Fetching existing profiles ---");
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role');

    if (error) {
        console.error("❌ Error accessing 'profiles' table:", error);
    } else if (data) {
        console.log("✅ Found profiles:", data.length);
        data.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.name}, Role: ${p.role}`);
        });
    } else {
        console.log("ℹ️ No profiles found.");
    }
}

checkProfiles();
