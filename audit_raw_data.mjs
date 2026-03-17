import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRawData() {
    const targetDate = '2026-03-16';
    console.log(`--- Fetching raw route data for ${targetDate} ---`);
    
    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('date', targetDate)
        .maybeSingle();

    if (error) {
        console.error('Error fetching route:', error);
        return;
    }

    if (!data) {
        console.log('No route data found for this date.');
        return;
    }

    const pendingJobs = data.pending_jobs || [];
    console.log(`Number of pending jobs: ${pendingJobs.length}`);

    if (pendingJobs.length > 0) {
        const sampleJob = pendingJobs[0];
        console.log('\n[RAW DATA AUDIT] First pending job keys:');
        console.log(Object.keys(sampleJob));
        
        console.log('\n[RAW DATA AUDIT] First pending job full JSON object:');
        console.log(JSON.stringify(sampleJob, null, 2));

        const hasIsSpotCamel = pendingJobs.some((j) => 'isSpot' in j);
        const hasIsSpotSnake = pendingJobs.some((j) => 'is_spot' in j);
        const hasBucketType = pendingJobs.some((j) => 'bucket_type' in j);
        
        console.log(`\nDoes any job have 'isSpot' (camelCase)? : ${hasIsSpotCamel}`);
        console.log(`Does any job have 'is_spot' (snake_case)? : ${hasIsSpotSnake}`);
        console.log(`Does any job have 'bucket_type'? : ${hasBucketType}`);
    } else {
        console.log('pending_jobs array is empty.');
    }
}

inspectRawData();
