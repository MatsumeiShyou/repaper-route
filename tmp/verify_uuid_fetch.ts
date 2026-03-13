
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function verifyUUIDFetch() {
    console.log('--- [Verification] UUID Fetch Integrity ---');

    // 1. View からデータを取得 (UIの一覧表示をシミュレート)
    const { data: viewData, error: viewErr } = await supabase
        .from('view_master_points')
        .select('id, location_id, display_name')
        .eq('location_id', '28')
        .single();

    if (viewErr) {
        console.error('❌ View Fetch Failed:', viewErr);
        return;
    }

    console.log(`[View Data] id (uuid): ${viewData.id}, location_id: ${viewData.location_id}`);

    // 2. 取得した ID が UUID 形式かチェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(viewData.id)) {
        console.log('✅ ID is a valid UUID.');
    } else {
        console.error('❌ ID is NOT a UUID (Check Mapping!):', viewData.id);
        return;
    }

    // 3. 物理テーブルへの Deep Fetch をシミュレート (MasterDataLayout.tsx:122)
    console.log(`[Action] Simulating Deep Fetch for id: ${viewData.id}`);
    const { data: detail, error: fetchErr } = await supabase
        .from('master_collection_points')
        .select('*')
        .eq('id', viewData.id) // ここで UUID を投げれば 200 OK になるはず
        .single();

    if (fetchErr) {
        console.error('❌ Deep Fetch Failed:', fetchErr);
    } else {
        console.log(`✅ Deep Fetch Successful! Name: ${detail.display_name}`);
        console.log('>>> RESULT: UUID mismatch is RESOLVED.');
    }
}

verifyUUIDFetch();
