export async function nativeSupabaseFetch<T = any>(table: string, queryParams: string = 'select=*') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // [過去の知見の復元] supabase.auth.getSession() は AuthProvider と競合しデッドロックを引き起こすため禁止。
    // 親OS (DXOS) が管理する localStorage から直接トークンを拝借する完全バイパス方式を徹底する。
    const rawStorage = localStorage.getItem('sb-mjaoolcjjlxwstlpdgrg-auth-token');
    let token = '';
    if (rawStorage) {
        try {
            const parsed = JSON.parse(rawStorage);
            token = parsed.access_token || '';
        } catch(e) {}
    }

    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
    console.log(`[nativeSupabaseFetch] >>> REQUEST: ${table} (Token: ${!!token})`);

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': anonKey,
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`[nativeSupabaseFetch] <<< ERROR ${res.status} on ${table}: ${text.substring(0, 100)}`);
            return { data: null, error: { message: text, status: res.status } };
        }
        
        const data = await res.json();
        console.log(`[nativeSupabaseFetch] <<< SUCCESS: ${table} Received ${Array.isArray(data) ? data.length : '1'} items`);
        return { data: data as T, error: null };
    } catch (fetchErr: any) {
        console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
        return { data: null, error: { message: fetchErr.message, status: 0 } };
    }
}
