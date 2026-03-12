
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { serializeMasterData, normalizeDays } from '../src/utils/serialization';
import { MASTER_SCHEMAS } from '../src/config/masterSchema';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);
const schema = MASTER_SCHEMAS.points;

async function finalProof() {
    console.log('--- [Final Proof] Dual-Source Implementation Verification ---');

    // 1. Get a target UUID from Table directly for certainty
    const { data: seed } = await supabase.from('master_collection_points').select('id, name').limit(1).single();
    if (!seed) return;
    const uuidId = seed.id;
    console.log(`[Step 1] Target UUID: ${uuidId} (${seed.name})`);

    // 2. Deep Fetch (Simulate Edit Modal Start)
    const { data: tableItem, error: fetchErr } = await supabase
        .from('master_collection_points')
        .select('*')
        .eq('id', uuidId)
        .single();
    
    if (fetchErr) {
        console.error('Fetch Error:', fetchErr);
        return;
    }
    console.log(`[Step 2] Deep Fetch Successful. Initial collection_days: ${JSON.stringify(tableItem.collection_days)}`);

    // 3. UI Normalization
    const uiDays = normalizeDays(tableItem.collection_days);
    console.log(`[Step 3] UI Normalized Days: ${JSON.stringify(uiDays)}`);

    // 4. Modify and Serialize
    const modifiedDays = uiDays.includes('Mon') ? ['Tue'] : ['Mon'];
    const formData = { ...tableItem, collection_days: modifiedDays };
    const serialized = serializeMasterData(formData, schema.fields, schema.rpcTableName);
    console.log(`[Step 4] Serialized for persistence: ${JSON.stringify(serialized.collection_days)}`);

    // 5. Update via RPC
    console.log(`[Step 5] Triggering RPC update...`);
    const { error: rpcErr } = await (supabase as any).rpc('rpc_execute_master_update', {
        p_table_name: schema.rpcTableName,
        p_id: String(uuidId),
        p_core_data: serialized,
        p_reason: 'FINAL_DUAL_SOURCE_PROOF_STABLE'
    });

    if (rpcErr) {
        console.error('RPC Error:', rpcErr);
        return;
    }

    // 6. Final Verify
    const { data: verifiedItem } = await supabase
        .from('master_collection_points')
        .select('*')
        .eq('id', uuidId)
        .single();
    
    const finalUI = normalizeDays(verifiedItem.collection_days);
    console.log(`[Step 6] Final Verified UI State: ${JSON.stringify(finalUI)}`);

    if (JSON.stringify(modifiedDays.sort()) === JSON.stringify(finalUI.sort())) {
        console.log('\n>>> SUCCESS: Dual-Source strategy works flawlessly.');
    } else {
        console.log('\n>>> FAILURE: Mismatch detected.');
    }
}
finalProof();
