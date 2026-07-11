// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';

// Mock client.ts to prevent Supabase connection issues
vi.mock('../lib/supabase/client', () => {
    return {
        supabase: {
            auth: {
                getSession: vi.fn(),
                getUser: vi.fn(),
                onAuthStateChange: vi.fn().mockReturnValue({
                    data: { subscription: { unsubscribe: vi.fn() } }
                }),
                signOut: vi.fn()
            },
            rpc: vi.fn()
        }
    };
});

// Mock authStore to avoid IndexedDB calls
const mockStoreState = {
    staffs: [] as any[],
    clearCalled: false
};
vi.mock('../os/auth/authStore', () => {
    return {
        authStore: {
            saveStaff: vi.fn().mockImplementation(async (s) => {
                const idx = mockStoreState.staffs.findIndex((x) => x.id === s.id);
                if (idx > -1) mockStoreState.staffs[idx] = s;
                else mockStoreState.staffs.push(s);
            }),
            saveStaffs: vi.fn().mockImplementation(async (list) => {
                mockStoreState.staffs = [...list];
            }),
            getStaff: vi.fn().mockImplementation(async (id) => {
                return mockStoreState.staffs.find((x) => x.id === id) || null;
            }),
            listStaffs: vi.fn().mockImplementation(async () => {
                return mockStoreState.staffs;
            }),
            clear: vi.fn().mockImplementation(async () => {
                mockStoreState.staffs = [];
                mockStoreState.clearCalled = true;
            })
        }
    };
});

import { authAdapter } from '../os/auth/AuthAdapter';
import { MasterDataProvider, useMasterDataContext } from '../contexts/MasterDataContext';
import { useMasterCRUD } from '../hooks/useMasterCRUD';
import { supabase } from '../lib/supabase/client';

describe('Milestone 2 - Challenger Stress Tests', () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;

    beforeEach(async () => {
        vi.useRealTimers(); // Ensure real timers are restored before starting
        vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');

        mockStoreState.staffs = [];
        mockStoreState.clearCalled = false;

        // Clear singleton cache in authAdapter
        await authAdapter.clearCache();

        // Setup mock implementations
        vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any);
        vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as any);

        // Setup default fetch mock
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => []
        });

        // Mock localStorage
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
        vi.restoreAllMocks();
        vi.useRealTimers(); // Ensure real timers are restored after test
    });

    describe('AuthAdapter & Auth Store Robustness', () => {
        it('should handle garbage token JSON in localStorage safely without crashing', async () => {
            localStorage.setItem('sb-mock-auth-token', 'invalid-garbage-json');

            // Should fallback to getSession and not crash
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: null },
                error: new Error('Session not found') as any
            });

            // Native fetch fails
            const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch error'));
            globalThis.fetch = mockFetch;

            await expect(authAdapter.resolveStaff()).rejects.toThrow();
        });

        it('should successfully recover from cache if the server is offline (native fetch fails)', async () => {
            const cachedStaff = {
                id: 'user-123',
                name: 'Cached Driver',
                role: 'driver' as const,
                allowed_apps: ['repaper-route'],
                permissions: { can_edit_board: false, can_manage_master: false, can_edit_past_records: false }
            };
            mockStoreState.staffs = [cachedStaff];

            // Get session works, but native staffs API fetch fails
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: { user: { id: 'user-123' }, access_token: 'valid' } as any },
                error: null
            });

            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => 'Internal DB Connection Error'
            });
            globalThis.fetch = mockFetch;

            const staff = await authAdapter.resolveStaff();
            expect(staff).toBeDefined();
            expect(staff?.name).toBe('Cached Driver');
        });

        it('should throw AppAccessDeniedError if staff does not have repaper-route in allowed_apps', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: { user: { id: 'user-123' }, access_token: 'valid' } as any },
                error: null
            });

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 'user-123',
                    name: 'Auditor',
                    role: 'staff',
                    allowed_apps: ['other-app-only'],
                    can_edit_board: false
                })
            });
            globalThis.fetch = mockFetch;

            await expect(authAdapter.resolveStaff()).rejects.toThrow(/アクセス権限がありません/);
        });

        it('should trigger TIMEOUT_DB_FETCH if staffs fetch takes too long', async () => {
            const unhandledRejectionHandler = (reason: any) => {
                if (reason instanceof Error && reason.message === 'TIMEOUT_DB_FETCH') {
                    // Suppress unhandled rejection warning in Node/Vitest
                }
            };
            process.on('unhandledRejection', unhandledRejectionHandler);

            try {
                vi.mocked(supabase.auth.getSession).mockResolvedValue({
                    data: { session: { user: { id: 'user-123' }, access_token: 'valid' } as any },
                    error: null
                });

                vi.useFakeTimers();

                const mockFetchPromise = new Promise(() => {
                    // Never resolves to simulate severe hang
                });
                globalThis.fetch = vi.fn().mockReturnValue(mockFetchPromise);

                const resolvePromise = authAdapter.resolveStaff();

                // Advance timers to trigger the 15s timeout
                await vi.advanceTimersByTimeAsync(16000);

                await expect(resolvePromise).rejects.toThrow('TIMEOUT_DB_FETCH');
            } finally {
                vi.useRealTimers();
                process.off('unhandledRejection', unhandledRejectionHandler);
            }
        });
    });

    describe('MasterDataContext Robustness', () => {
        it('should load even if some MasterData requests return null data or error objects', async () => {
            // Mock fetch for nativeSupabaseFetch
            const mockFetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('drivers')) {
                    // return malformed data (null drivers)
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: async () => null
                    });
                }
                // Others return standard empty array
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => []
                });
            });
            globalThis.fetch = mockFetch;

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <MasterDataProvider>{children}</MasterDataProvider>
            );

            const { result } = renderHook(() => useMasterDataContext(), { wrapper });

            // Wait for resolution
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
            });

            expect(result.current.drivers).toEqual([]);
        });

        it('should properly map drivers defaultCourse/defaultVehicle properties under different casings', async () => {
            const mockFetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('drivers')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: async () => [
                            { id: 'd1', name: 'Driver A', default_course: 'Course 1', defaultVehicle: 'Vehicle X' },
                            { id: 'd2', name: 'Driver B', defaultCourse: 'Course 2', default_vehicle: 'Vehicle Y' }
                        ]
                    });
                }
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => []
                });
            });
            globalThis.fetch = mockFetch;

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <MasterDataProvider>{children}</MasterDataProvider>
            );

            const { result } = renderHook(() => useMasterDataContext(), { wrapper });

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
            });

            expect(result.current.drivers).toHaveLength(2);
            expect((result.current.drivers[0] as any).defaultCourse).toBe('Course 1');
            expect((result.current.drivers[0] as any).defaultVehicle).toBe('Vehicle X');
            expect((result.current.drivers[1] as any).defaultCourse).toBe('Course 2');
            expect((result.current.drivers[1] as any).defaultVehicle).toBe('Vehicle Y');
        });
    });

    describe('useMasterCRUD Hook Robustness', () => {
        const dummySchema = {
            tableName: 'master_items',
            rpcTableName: 'master_items',
            viewName: 'master_items',
            primaryKey: 'id',
            title: 'Test items',
            description: 'desc',
            label: 'Items',
            fields: [
                { name: 'id', label: 'ID', type: 'number' as const, requiredForCreate: true, updatable: false },
                { name: 'name', label: 'Item Name', type: 'text' as const, requiredForCreate: true, updatable: true },
                { name: 'note', label: 'Note', type: 'text' as const, requiredForCreate: false, updatable: true }
            ],
            columns: [],
            searchFields: []
        };

        it('should throw validation error when requiredForCreate field is missing during createItem', async () => {
            const { result } = renderHook(() => useMasterCRUD(dummySchema));

            // missing 'name'
            await act(async () => {
                await expect(
                    result.current.createItem({ id: 100, note: 'Missing name' })
                ).rejects.toThrow('Item Nameは新規作成時に必須です。');
            });
        });

        it('should filter out read-only fields (updatable: false) when updating', async () => {
            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: { id: 'admin-123' } as any },
                error: null
            });

            const rpcMock = vi.fn().mockResolvedValue({ error: null });
            vi.mocked(supabase.rpc).mockImplementation(rpcMock as any);

            const { result } = renderHook(() => useMasterCRUD(dummySchema));

            await act(async () => {
                await result.current.updateItem(100, {
                    id: 999, // Should be ignored because updatable is false
                    name: 'Updated Name',
                    note: 'Updated Note'
                });
            });

            expect(rpcMock).toHaveBeenCalled();
            const callArgs = rpcMock.mock.calls[0][1];
            expect(callArgs.p_id).toBe('100');
            // Check that id was excluded from p_core_data serialization
            expect(callArgs.p_core_data.id).toBeUndefined();
            expect(callArgs.p_core_data.name).toBe('Updated Name');
            expect(callArgs.p_core_data.note).toBe('Updated Note');
        });

        it('should set error state if RPC call returns an error object', async () => {
            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: { id: 'admin-123' } as any },
                error: null
            });

            vi.mocked(supabase.rpc).mockResolvedValue({
                error: { message: 'Database constraint failed due to lock conflict' }
            } as any);

            const { result } = renderHook(() => useMasterCRUD(dummySchema));

            await act(async () => {
                await expect(
                    result.current.updateItem(100, { name: 'Some Name' })
                ).rejects.toThrow('Database constraint failed due to lock conflict');
            });

            expect(result.current.error).not.toBeNull();
            // Verify the bug where PostgrestError is stringified to [object Object] is fixed
            expect(result.current.error?.message).toContain('Database constraint failed due to lock conflict');
        });
    });
});
