
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { serializeMasterData } from '../src/utils/serialization';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mockFields = [
    { name: 'collection_days', label: '曜日設定', type: 'days' }
];

async function repairData(dryRun: boolean = true) {
    console.log(`--- [Data Repair] ${dryRun ? 'DRY RUN' : 'PRODUCTION RUN'} ---`);

    const { data, error } = await supabase
        .from('master_collection_points')
        .select('location_id, display_name, collection_days');

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    const corrupted = data?.filter(row => Array.isArray(row.collection_days)) || [];
    console.log(`Found ${corrupted.length} corrupted records (Array format).`);

    for (const row of corrupted) {
        console.log(`\nRepairing [${row.location_id}] ${row.display_name}`);
        console.log('Current:', JSON.stringify(row.collection_days));

        // Use the new serialization logic to convert Array -> Object
        const uiData = { collection_days: row.collection_days };
        const serialized = serializeMasterData(uiData, mockFields as any, 'master_collection_points');
        const repairedObject = serialized.collection_days;

        console.log('Repaired:', JSON.stringify(repairedObject));

        if (!dryRun) {
            const { error: updateError } = await supabase
                .from('master_collection_points')
                .update({ collection_days: repairedObject })
                .eq('location_id', row.location_id);

            if (updateError) {
                console.error(`Update failed for ${row.location_id}:`, updateError);
            } else {
                console.log('SUCCESS: Record updated in DB.');
            }
        }
    }

    if (dryRun && corrupted.length > 0) {
        console.log('\n>>> DRY RUN COMPLETED. No changes made to DB.');
        console.log('>>> Run with --confirm to apply changes.');
    } else if (corrupted.length === 0) {
        console.log('\n>>> No corrupted records found.');
    }
}

const isConfirm = process.argv.includes('--confirm');
repairData(!isConfirm);
