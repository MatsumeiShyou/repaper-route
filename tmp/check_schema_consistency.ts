
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchemaConsistency() {
    console.log('--- [Schema Consistency Check] DB Columns vs UI Fields ---');

    // 1. Get DB Columns
    const { data: dbCols, error } = await supabase.rpc('rpc_debug_query', {
        p_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'master_collection_points';"
    });

    if (error) {
        console.error('Error fetching DB columns:', error);
        return;
    }

    const dbKeys = new Set(dbCols.map((c: any) => c.column_name));
    console.log(`DB Columns found: ${dbCols.length}`);

    // 2. We'll manually check against the fields I read from masterSchema.ts
    // From masterSchema.ts:
    // id, location_id, display_name, furigana, area, contractor_id, company_phone, 
    // manager_phone, address, weighing_site_id, visit_slot, special_type, 
    // recurrence_pattern, vehicle_restriction_type, restricted_vehicle_id, 
    // collection_days, target_item_category, site_contact_phone, internal_note, 
    // time_constraint_type, is_spot_only, is_active

    const uiFields = [
        'id', 'location_id', 'display_name', 'furigana', 'area', 'contractor_id', 
        'company_phone', 'manager_phone', 'address', 'weighing_site_id', 'visit_slot', 
        'special_type', 'recurrence_pattern', 'vehicle_restriction_type', 
        'restricted_vehicle_id', 'collection_days', 'target_item_category', 
        'site_contact_phone', 'internal_note', 'time_constraint_type', 
        'is_spot_only', 'is_active'
    ];

    console.log('\n[Verification Results]');
    let mismatchCount = 0;
    uiFields.forEach(f => {
        // internal_note is 'note' in DB usually (from the view logic I saw)
        const dbEquivalent = f === 'internal_note' ? 'note' : f;
        if (dbKeys.has(dbEquivalent)) {
            console.log(`✅ ${f} -> DB.${dbEquivalent} (MATCH)`);
        } else {
            console.log(`❌ ${f} -> DB.${dbEquivalent} (MISSING)`);
            mismatchCount++;
        }
    });

    if (mismatchCount === 0) {
        console.log('\n>>> RESULT: UI and DB are SYNCHRONIZED.');
    } else {
        console.log(`\n>>> RESULT: ${mismatchCount} mismatches found.`);
    }
}

checkSchemaConsistency();
