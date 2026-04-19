import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase Client Initialization]');
console.log(' - URL:', supabaseUrl);
console.log(' - KEY:', supabaseKey ? 'PRESENT' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase Configuration Missing");
}

export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseKey || '',
    {
        auth: {
            // セッション管理は supabase-js に委任（トークンリフレッシュも有効）
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        },
        global: {
            fetch: async (url, options) => {
                // supabase-js 内部の AbortController によるキャンセルを抑制
                // （Micro-Frontend 環境で不必要な AbortError を防止）
                const { signal, ...safeOptions } = options || {};
                return fetch(url, safeOptions as RequestInit);
            }
        }
    }
);
