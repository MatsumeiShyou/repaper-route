
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debugRPCTrace() {
    const targetId = '28'; 
    console.log(`--- [Debug] RPC Execution Trace ---`);

    // 1. Reference Data
    const { data: ref } = await supabase.from('master_collection_points').select('id, location_id, area').eq('location_id', targetId).single();
    if (!ref) { console.error('Ref not found'); return; }
    console.log(`[Target] UUID: ${ref.id}, LocationID: ${ref.location_id}, Current Area: ${ref.area}`);

    // 2. Call RPC and get internal diagnostics if possible
    const testArea = 'TRACE_' + Date.now().toString().slice(-4);
    
    // We'll use our rpc_debug_query (if available) to see what's actually in that table
    const { data: diag, errorNum } = await supabase.rpc('rpc_debug_query', {
        p_query: `
            SELECT id, location_id, area, updated_at 
            FROM public.master_collection_points 
            WHERE id = '${ref.id}'::uuid OR location_id = '${ref.location_id}';
        `
    });
    console.log('[Diag] Visibility Check:', diag);

    const { error: rpcErr } = await supabase.rpc('rpc_execute_master_update', {
        p_table_name: 'points',
        p_id: ref.id,
        p_core_data: { area: testArea },
        p_reason: 'Phase 19 Trace'
    });

    if (rpcErr) { console.error('RPC Error:', rpcErr); }

    const { data: final } = await supabase.from('master_collection_points').select('area, updated_at').eq('id', ref.id).single();
    console.log(`[Final] area: ${final?.area}, updated_at: ${final?.updated_at}`);
}

debugRPCTrace();
