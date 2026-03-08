import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// For diagnostics, using service role key if possible, but anon key might suffice if RLS allows reading jobs
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("--- Starting Diagnosis ---");

    // 1. Get all jobs
    const { data: jobs, error: err1 } = await supabase.from('jobs').select('id, job_title, customer_id, bucket_type, created_at').is('driver_id', null);
    if (err1) {
        console.error("Error fetching jobs:", err1);
        return;
    }

    // 2. Get all valid compilation points (master_collection_points)
    const { data: points, error: err2 } = await supabase.from('master_collection_points').select('location_id, name');
    if (err2) {
        console.error("Error fetching points:", err2);
        return;
    }

    const validLocationIds = new Set(points.map(p => p.location_id));

    // 3. Find invalid jobs (where location_id/customer_id doesn't exist in master)
    // In our schema evolution, jobs might use customer_id or location_id to reference points
    let invalidJobs = [];
    let validJobs = [];

    for (const job of jobs) {
        // spot jobs might not have a location_id/customer_id perfectly linked, but check anyway
        const refId = job.customer_id;

        if (!refId || !validLocationIds.has(refId)) {
            invalidJobs.push(job);
        } else {
            validJobs.push(job);
        }
    }

    console.log(`Total Unassigned Jobs Found: ${jobs.length}`);
    console.log(`Valid Jobs (Linked to Master): ${validJobs.length}`);
    console.log(`Invalid Jobs (No DB Link/Mock Data): ${invalidJobs.length}`);

    if (invalidJobs.length > 0) {
        console.log("\n--- Details of Invalid Jobs (Top 5) ---");
        invalidJobs.slice(0, 5).forEach(j => {
            console.log(`- ID: ${j.id}, Title: ${j.job_title}, Created: ${j.created_at}, RefID(Loc/Cust): ${j.customer_id || 'NULL'}`);
        });
    }

    console.log("\n--- Recommendation ---");
    console.log("These orphan jobs should be purged, and a Foreign Key constraint should be added from jobs.customer_id -> master_collection_points.location_id");
}

diagnose();
