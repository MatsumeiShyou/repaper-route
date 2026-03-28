import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ DXOS Infrastructure Error: Supabase credentials missing.');
    console.error('Please copy .env.example to .env and set your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    // 開発環境でのUX向上のため、エラーをスローして画面に表示させる
    throw new Error('DXOS Configuration Error: Missing Supabase environment variables. Check console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
