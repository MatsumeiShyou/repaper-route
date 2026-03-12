
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { serializeMasterData, normalizeDays } from '../src/utils/serialization';
import { MASTER_SCHEMAS } from '../src/config/masterSchema';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const schema = MASTER_SCHEMAS.points;

async function checkIntegration() {
    console.log('--- [Integration Check] Master Data Persistence ---');

    // 1. Pick a point to test
    const targetId = '61'; // Using existing ID from DB
    console.log(`Target Location ID: ${targetId}`);

    const { data: initial, error: fetchErr } = await supabase
        .from(schema.viewName)
        .select('*')
        .eq('location_id', targetId)
        .single();

    if (fetchErr) {
        console.error('Initial fetch failed:', fetchErr);
        return;
    }

    console.log('Initial DB collection_days:', JSON.stringify(initial.collection_days));
    
    // 2. Simulate UI Load
    const uiArray = normalizeDays(initial.collection_days);
    console.log('UI Normalized Array:', JSON.stringify(uiArray));

    // 3. Simulate UI Change (Toggle Fri)
    const newUIArray = uiArray.includes('Fri') 
        ? uiArray.filter(d => d !== 'Fri') 
        : [...uiArray, 'Fri'];
    console.log('Modified UI Array:', JSON.stringify(newUIArray));

    // 4. Simulate Save
    const formData = { ...initial, collection_days: newUIArray };
    const serialized = serializeMasterData(formData, schema.fields, schema.rpcTableName);
    console.log('Serialized for DB:', JSON.stringify(serialized.collection_days));

    // 5. Update DB via RPC (as useMasterCRUD does)
    console.log('Updating DB via RPC...');
    const { data: res, error: rpcErr } = await (supabase as any)
        .rpc('rpc_execute_master_update', {
            p_table_name: schema.rpcTableName,
            p_id: String(targetId),
            p_core_data: serialized,
            p_reason: 'INTEGRATION_TEST'
        });

    if (rpcErr) {
        console.error('RPC failed:', rpcErr);
        return;
    }
    console.log('RPC result:', res);

    // 6. Verify Fetch
    const { data: final, error: finalErr } = await supabase
        .from('master_collection_points')
        .select('*')
        .eq('location_id', targetId)
        .single();

    if (finalErr) {
        console.error('Final fetch failed:', finalErr);
        return;
    }

    console.log('Final DB collection_days:', JSON.stringify(final.collection_days));
    
    const finalUIArray = normalizeDays(final.collection_days);
    console.log('Final UI Normalized Array:', JSON.stringify(finalUIArray));

    if (JSON.stringify(newUIArray.sort()) === JSON.stringify(finalUIArray.sort())) {
        console.log('\n>>> SUCCESS: DB Persistence and Round-trip working.');
    } else {
        console.log('\n>>> FAILURE: DB state does not match expected state.');
    }
}

checkIntegration();
