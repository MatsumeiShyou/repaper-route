export type NativeFetchMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function nativeSupabaseFetch<T = any>(
    table: string, 
    queryParams: string = 'select=*', 
    method: NativeFetchMethod = 'GET',
    body?: any
) {
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

    // RPC の場合は URL 構造が変わる: /rest/v1/rpc/function_name
    const isRpc = table.startsWith('rpc/');
    const baseUrl = isRpc 
        ? `${supabaseUrl}/rest/v1/${table}` 
        : `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
    
    const url = isRpc && queryParams && queryParams !== 'select=*'
        ? `${baseUrl}?${queryParams}`
        : baseUrl;

    console.log(`[nativeSupabaseFetch] >>> REQUEST: ${method} ${table} (Token: ${!!token})`);

    try {
        const headers: Record<string, string> = {
            'apikey': anonKey,
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
            method: method,
            mode: 'cors',
            headers: headers
        };

        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
            const text = await res.text();
            console.error(`[nativeSupabaseFetch] <<< ERROR ${res.status} on ${table}: ${text.substring(0, 100)}`);
            return { data: null, error: { message: text, status: res.status } };
        }
        
        // 204 No Content (Update 等) の場合は null を返す
        if (res.status === 204) {
            return { data: null as unknown as T, error: null };
        }

        const data = await res.json();
        console.log(`[nativeSupabaseFetch] <<< SUCCESS: ${table} Received ${Array.isArray(data) ? data.length : 'Object/Result'}`);
        return { data: data as T, error: null };
    } catch (fetchErr: any) {
        console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
        return { data: null, error: { message: fetchErr.message, status: 0 } };
    }
}
