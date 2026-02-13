const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key, hope RLS allows delete/insert
// Ideally we need service_role key, but let's try with anon first if RLS is open (which it is for dev).
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
    console.log("--- Fixing Data via Client ---");

    // 1. Delete all jobs
    const { error: deleteError } = await supabase.from('jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all not matching phantom ID
    // or just .gt('id', '') if text
    if (deleteError) {
        console.error("Delete Error (likely RLS or FK):", deleteError);
        // Force delete by ID if needed, or if RLS blocks, we might be stuck.
        // Try fetching IDs then deleting.
        const { data: allJobs } = await supabase.from('jobs').select('id');
        if (allJobs && allJobs.length > 0) {
            const ids = allJobs.map(j => j.id);
            const { error: delErr2 } = await supabase.from('jobs').delete().in('id', ids);
            if (delErr2) console.error("Delete by ID Error:", delErr2);
            else console.log(`Deleted ${ids.length} old jobs.`);
        }
    } else {
        console.log("Deleted old jobs.");
    }

    // 2. Insert new jobs (without status column)
    const newJobs = [
        { id: 'job_test_01', job_title: '定期回収A', bucket_type: '定期', customer_name: '富士ロジ長沼', item_category: '燃えるゴミ', duration_minutes: 15, special_notes: 'テストデータ1', driver_id: null },
        { id: 'job_test_02', job_title: '定期回収B', bucket_type: '定期', customer_name: 'リバークレイン', item_category: '段ボール', duration_minutes: 30, special_notes: 'テストデータ2', driver_id: null },
        { id: 'job_test_03', job_title: 'スポット回収C', bucket_type: 'スポット', customer_name: 'ESPOT(スポット)', item_category: '金属くず', duration_minutes: 45, start_time: '09:00', special_notes: '午前指定', driver_id: null },
        { id: 'job_test_04', job_title: '定期回収D', bucket_type: '定期', customer_name: 'ユニマット', item_category: 'プラスチック', duration_minutes: 15, special_notes: 'テストデータ4', driver_id: null },
        { id: 'job_test_05', job_title: '特別回収E', bucket_type: '特殊', customer_name: '特別工場A', item_category: '発泡スチロール', duration_minutes: 60, start_time: '13:00', special_notes: '要事前連絡', driver_id: null }
    ];

    const { data: inserted, error: insertError } = await supabase.from('jobs').insert(newJobs).select();
    if (insertError) console.error("Insert Error:", insertError);
    else console.log(`Inserted ${inserted.length} new jobs.`);
}

fixData();
