
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function listFunctions() {
    // 存在する関数を確認
    const { data, error } = await supabase
        .rpc('rpc_execute_master_update', {
            p_table_name: 'master_collection_points',
            p_id: 'test',
            p_core_data: {},
            p_reason: 'FUNCTION_CHECK'
        });
    
    // エラーメッセージに関数リストが含まれることを期待するか、単純に権限をチェック
    console.log('Update RPC Check:', error ? error.message : 'Accessible');
}
listFunctions();
