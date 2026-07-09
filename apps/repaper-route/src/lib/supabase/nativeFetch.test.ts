import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nativeSupabaseFetch } from './nativeFetch';

// Mock client.ts to prevent Supabase connection issues in test
vi.mock('./client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
        }
    }
}));

describe('nativeSupabaseFetch', () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;

    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');
        
        // Mock localStorage using dynamic enumerable properties
        const store: Record<string, string> = {};
        const mockStorage = Object.create(null);
        Object.defineProperties(mockStorage, {
            getItem: { value: (key: string) => store[key] || null, enumerable: false, configurable: true },
            setItem: { value: (key: string, value: string) => { 
                store[key] = value; 
                mockStorage[key] = value;
            }, enumerable: false, configurable: true },
            removeItem: { value: (key: string) => { 
                delete store[key]; 
                delete mockStorage[key];
            }, enumerable: false, configurable: true },
            clear: { value: () => { 
                Object.keys(store).forEach(k => {
                    delete store[k];
                    delete mockStorage[k];
                });
            }, enumerable: false, configurable: true },
            length: { get: () => Object.keys(store).length, enumerable: false, configurable: true },
            key: { value: (index: number) => Object.keys(store)[index] || null, enumerable: false, configurable: true },
        });
        Object.defineProperty(globalThis, 'localStorage', {
            value: mockStorage,
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        globalThis.localStorage = originalLocalStorage;
        vi.unstubAllEnvs();
    });

    it('should set Authorization header when token exists in localStorage', async () => {
        localStorage.setItem('sb-mock-auth-token', JSON.stringify({ access_token: 'fake-jwt-token' }));

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [{ id: 1, name: 'Item 1' }]
        });
        globalThis.fetch = mockFetch;

        const { data, error } = await nativeSupabaseFetch('some_table', 'select=*');

        expect(error).toBeNull();
        expect(data).toEqual([{ id: 1, name: 'Item 1' }]);
        expect(mockFetch).toHaveBeenCalled();
        
        const lastCallArgs = mockFetch.mock.calls[0];
        const requestUrl = lastCallArgs[0] as string;
        const options = lastCallArgs[1] as RequestInit;

        expect(requestUrl).toContain('some_table?select=*');
        expect(options.headers).toBeDefined();
        const headers = options.headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer fake-jwt-token');
        expect(headers['apikey']).toBe('mock-anon-key');
    });

    it('should format URL correctly for RPC route', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        });
        globalThis.fetch = mockFetch;

        const { data, error } = await nativeSupabaseFetch('rpc/some_func', 'param=1');

        expect(error).toBeNull();
        expect(data).toEqual({ success: true });
        
        const lastCallArgs = mockFetch.mock.calls[0];
        const requestUrl = lastCallArgs[0] as string;
        expect(requestUrl).toBe('https://mock-supabase.co/rest/v1/rpc/some_func?param=1');
    });

    it('should handle error responses gracefully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => 'Database constraint violation'
        });
        globalThis.fetch = mockFetch;

        const { data, error } = await nativeSupabaseFetch('some_table');

        expect(data).toBeNull();
        expect(error).toEqual({
            message: 'Database constraint violation',
            status: 400
        });
    });

    it('should catch network/unexpected errors and format them using the custom catch logic', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));
        globalThis.fetch = mockFetch;

        const { data, error } = await nativeSupabaseFetch('some_table');

        expect(data).toBeNull();
        expect(error).toBeDefined();
        expect(error?.message).toBe('Network disconnected');
        expect(error?.status).toBe(0);
    });

    it('should catch string exceptions and format them using String fallback in catch block', async () => {
        const mockFetch = vi.fn().mockRejectedValue('Fatal network error');
        globalThis.fetch = mockFetch;

        const { data, error } = await nativeSupabaseFetch('some_table');

        expect(data).toBeNull();
        expect(error).toBeDefined();
        expect(error?.message).toBe('Fatal network error');
        expect(error?.status).toBe(0);
    });
});
