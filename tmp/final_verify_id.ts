
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function finalVerify() {
    console.log('--- [Final Verification] ---');
    
    // 1. Fetch ALL columns to see what PostgREST thinks
    const { data, error } = await supabase.from('view_master_points').select('*').limit(1).single();
    
    if (error) {
        console.error('❌ Fetch * failed:', error);
        return;
    }

    const cols = Object.keys(data);
    console.log('Available columns in View:', cols.join(', '));

    if (cols.includes('id') && cols.includes('location_id')) {
        console.log('✅ Both id and location_id found in View.');
        
        // 2. Validate id type (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(data.id)) {
            console.log('✅ id is a valid UUID.');
        } else {
            console.log('❌ id is NOT a UUID:', data.id);
        }

        // 3. Deep Fetch simulation
        const { data: detail, error: fetchErr } = await supabase
            .from('master_collection_points')
            .select('*')
            .eq('id', data.id)
            .single();

        if (fetchErr) {
            console.error('❌ Deep Fetch failed:', fetchErr);
        } else {
            console.log('✅ Deep Fetch success! (UUID query works)');
        }
    } else {
        console.error('❌ Mapping mismatch persists.');
    }
}

finalVerify();
