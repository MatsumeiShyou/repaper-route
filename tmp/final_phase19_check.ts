
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function finalManualVerification() {
    const targetId = '28'; 
    console.log(`--- [Final Verification] Phase 19 Confirmation ---`);

    const { data: ref } = await supabase.from('master_collection_points').select('id, location_id, collection_days, area').eq('location_id', targetId).single();
    if (!ref) { console.error('Ref not found'); return; }

    const testArea = 'FINAL_PHASE19_OK_' + Date.now().toString().slice(-4);
    const testDays = { mon: true, wed: true, note: 'Phase 19 Verified' };

    console.log(`[Action] Saving via RPC: Area=${testArea}, Days=${JSON.stringify(testDays)}`);

    const { error } = await supabase.rpc('rpc_execute_master_update', {
        p_table_name: 'points',
        p_id: ref.id, // UUID lookup
        p_core_data: { 
            area: testArea,
            collection_days: testDays,
            display_name: 'Test Point (Final Phase 19 OK)'
        }
    });

    if (error) { console.error('RPC Error:', error); return; }

    const { data: after } = await supabase.from('master_collection_points').select('area, collection_days').eq('id', ref.id).single();
    
    console.log('\n--- VERIFICATION RESULT ---');
    console.log(`Saved Area: ${after?.area}`);
    console.log(`Saved Days: ${JSON.stringify(after?.collection_days)}`);

    if (after?.area === testArea && JSON.stringify(after?.collection_days) === JSON.stringify(testDays)) {
        console.log('\n✅ PERSISTENCE RESTORED: Master data is now accurately saved and retrieved.');
    } else {
        console.log('\n❌ VERIFICATION FAILED: Mismatch still exists.');
    }
}

finalManualVerification();
