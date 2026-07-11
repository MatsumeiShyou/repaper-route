// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { render, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';
import { MasterDataProvider, useMasterDataContext } from './MasterDataContext';
import { useMasterCRUD } from '../hooks/useMasterCRUD';
import { authAdapter } from '../os/auth/AuthAdapter';
import { supabase } from '../lib/supabase/client';
import { nativeSupabaseFetch } from '../lib/supabase/nativeFetch';
import type { Session } from '@supabase/supabase-js';

// Mock supabase client
vi.mock('../lib/supabase/client', () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-uid' } }, error: null });
    const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const mockOnAuthStateChange = vi.fn();
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    
    const mockFrom = vi.fn().mockImplementation(() => {
        const query: any = Promise.resolve({ data: [], error: null });
        query.select = vi.fn().mockReturnValue(query);
        query.eq = vi.fn().mockReturnValue(query);
        query.order = vi.fn().mockReturnValue(query);
        return query;
    });

    return {
        supabase: {
            auth: {
                getUser: mockGetUser,
                getSession: mockGetSession,
                onAuthStateChange: mockOnAuthStateChange,
                signOut: mockSignOut,
            },
            rpc: mockRpc,
            from: mockFrom,
        },
    };
});

// Mock nativeSupabaseFetch
vi.mock('../lib/supabase/nativeFetch', () => ({
    nativeSupabaseFetch: vi.fn(),
}));

// Mock authStore to avoid real IndexedDB errors/delay
vi.mock('../os/auth/authStore', () => ({
    authStore: {
        saveStaff: vi.fn().mockResolvedValue(undefined),
        saveStaffs: vi.fn().mockResolvedValue(undefined),
        getStaff: vi.fn().mockResolvedValue(null),
        listStaffs: vi.fn().mockResolvedValue([]),
        clear: vi.fn().mockResolvedValue(undefined),
    },
}));

// Mock Modal since we don't want to test dialog interactions
vi.mock('../components/Modal', () => ({
    Modal: ({ children, isOpen, footer }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-modal">
                {children}
                {footer}
            </div>
        );
    },
}));

describe('Milestone 2 - Contexts & Hooks Challenger Stress Tests', () => {
    let authCallback: (event: string, session: Session | null) => void;
    const mockSubscription = {
        unsubscribe: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');

        // Default mocks
        (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
            authCallback = cb;
            return { data: { subscription: mockSubscription } };
        });

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: null,
        });

        (nativeSupabaseFetch as any).mockResolvedValue({ data: [], error: null });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('AuthProvider - Stress and Edge Cases', () => {
        it('should initialize status as INITIALIZING if cached session exists', () => {
            const hasCachedSessionSpy = vi.spyOn(authAdapter, 'hasCachedSession').mockReturnValue(true);
            
            let contextValue: any;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.status).toBe('INITIALIZING');
            hasCachedSessionSpy.mockRestore();
        });

        it('should initialize status as UNAUTHENTICATED if cached session does not exist', () => {
            const hasCachedSessionSpy = vi.spyOn(authAdapter, 'hasCachedSession').mockReturnValue(false);
            
            let contextValue: any;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.status).toBe('UNAUTHENTICATED');
            hasCachedSessionSpy.mockRestore();
        });

        it('should resolve staff and set status to AUTHENTICATED on SIGNED_IN event', async () => {
            const mockStaff = {
                id: 'user-123',
                name: 'John Doe',
                role: 'staff',
                allowed_apps: ['repaper-route'],
            };
            const resolveStaffSpy = vi.spyOn(authAdapter, 'resolveStaffFromSession').mockResolvedValue(mockStaff as any);
            const fetchAllStaffsSpy = vi.spyOn(authAdapter, 'fetchAllStaffs').mockResolvedValue([mockStaff] as any);

            let contextValue: any;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            const mockSession = { user: { id: 'user-123' } } as any;
            await act(async () => {
                await authCallback('SIGNED_IN', mockSession);
            });

            expect(resolveStaffSpy).toHaveBeenCalledWith(mockSession);
            expect(contextValue.status).toBe('AUTHENTICATED');
            expect(contextValue.staff).toEqual(mockStaff);
            expect(contextValue.staffs).toEqual([mockStaff]);

            resolveStaffSpy.mockRestore();
            fetchAllStaffsSpy.mockRestore();
        });

        it('should handle TIMEOUT_DB_FETCH and trigger radical logout', async () => {
            const resolveStaffSpy = vi.spyOn(authAdapter, 'resolveStaffFromSession').mockRejectedValue(new Error('TIMEOUT_DB_FETCH'));
            const signOutSpy = (supabase.auth.signOut as any).mockResolvedValue({ error: null });
            const clearCacheSpy = vi.spyOn(authAdapter, 'clearCache').mockResolvedValue();

            let contextValue: any;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            const mockSession = { user: { id: 'user-123' } } as any;
            await act(async () => {
                await authCallback('SIGNED_IN', mockSession);
            });

            expect(contextValue.status).toBe('UNAUTHENTICATED');
            expect(signOutSpy).toHaveBeenCalled();
            expect(clearCacheSpy).toHaveBeenCalled();

            resolveStaffSpy.mockRestore();
            clearCacheSpy.mockRestore();
        });

        it('should handle StaffNotFoundError and transition to NOT_REGISTERED', async () => {
            const resolveStaffSpy = vi.spyOn(authAdapter, 'resolveStaffFromSession').mockRejectedValue(new (class StaffNotFoundError extends Error {
                name = 'StaffNotFoundError';
                constructor() { super('Staff not found'); }
            })());

            let contextValue: any;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            const mockSession = { user: { id: 'user-123' } } as any;
            await act(async () => {
                await authCallback('SIGNED_IN', mockSession);
            });

            expect(contextValue.status).toBe('NOT_REGISTERED');
            expect(contextValue.staff).toBeNull();

            resolveStaffSpy.mockRestore();
        });

        it('should skip duplicate resolves when resolution is already in progress', async () => {
            const mockStaff = { id: 'user-123', name: 'John Doe', role: 'staff', allowed_apps: ['repaper-route'] };
            let resolvePromiseResolve: any;
            const resolvePromise = new Promise<any>((resolve) => {
                resolvePromiseResolve = resolve;
            });
            const resolveStaffSpy = vi.spyOn(authAdapter, 'resolveStaffFromSession').mockReturnValue(resolvePromise);
            const fetchAllStaffsSpy = vi.spyOn(authAdapter, 'fetchAllStaffs').mockResolvedValue([]);

            render(
                <AuthProvider>
                    <div />
                </AuthProvider>
            );

            const mockSession = { user: { id: 'user-123' } } as any;
            
            // Invoke multiple times simultaneously
            await act(async () => {
                authCallback('SIGNED_IN', mockSession);
                authCallback('SIGNED_IN', mockSession);
            });

            // resolveStaffFromSession should only be called once due to the isResolving mutex
            expect(resolveStaffSpy).toHaveBeenCalledTimes(1);

            // Clean up promise resolution
            await act(async () => {
                resolvePromiseResolve(mockStaff);
            });

            resolveStaffSpy.mockRestore();
            fetchAllStaffsSpy.mockRestore();
        });
    });

    describe('MasterDataContext - Stress and Edge Cases', () => {
        it('should handle null or undefined data responses by falling back to empty arrays', async () => {
            const mockDrivers = [
                { id: 'd1', name: 'Driver A', default_course: 'A-Course', display_order: 1 },
                { id: 'd2', name: 'Driver B', defaultCourse: 'B-Course', display_order: 2 }
            ];

            (nativeSupabaseFetch as any).mockImplementation((table: string) => {
                if (table === 'drivers') {
                    return Promise.resolve({ data: mockDrivers, error: null });
                }
                if (table === 'vehicles') {
                    return Promise.resolve({ data: null, error: new Error('Network error') }); // data is null
                }
                if (table === 'master_collection_points') {
                    return Promise.resolve({ data: undefined, error: null }); // data is undefined
                }
                return Promise.resolve({ data: [], error: null });
            });

            let contextValue: any;
            const TestComponent = () => {
                contextValue = useMasterDataContext();
                return null;
            };

            await act(async () => {
                render(
                    <MasterDataProvider>
                        <TestComponent />
                    </MasterDataProvider>
                );
            });

            // Check drivers defaultCourse & defaultVehicle derived correctly
            expect(contextValue.drivers).toEqual([
                { id: 'd1', name: 'Driver A', default_course: 'A-Course', display_order: 1, defaultCourse: 'A-Course', defaultVehicle: undefined },
                { id: 'd2', name: 'Driver B', defaultCourse: 'B-Course', display_order: 2, defaultVehicle: undefined }
            ]);

            // Other fields should gracefully fallback to empty arrays
            expect(contextValue.vehicles).toEqual([]);
            expect(contextValue.customers).toEqual([]);
            expect(contextValue.items).toEqual([]);
            expect(contextValue.customerItemDefaults).toEqual([]);
            expect(contextValue.isLoading).toBe(false);
        });
    });

    describe('useMasterCRUD - Stress and Edge Cases', () => {
        const schema = {
            tableName: 'master_items',
            rpcTableName: 'master_items',
            viewName: 'master_items',
            primaryKey: 'id',
            fields: [
                { name: 'id', label: 'ID', type: 'number', requiredForCreate: true, updatable: false },
                { name: 'name', label: 'Item Name', type: 'text', requiredForCreate: true, updatable: true },
                { name: 'note', label: 'Note', type: 'text', requiredForCreate: false, updatable: true }
            ]
        } as any;

        it('should throw validation error when requiredForCreate field is missing on createItem', async () => {
            const { result } = renderHook(() => useMasterCRUD(schema));

            await act(async () => {
                await expect(result.current.createItem({ id: 1 })).rejects.toThrow('Item Nameは新規作成時に必須です。');
            });
        });

        it('should call rpc with properly serialized and filtered data on updateItem', async () => {
            const rpcMock = vi.fn().mockResolvedValue({ error: null });
            (supabase as any).rpc = rpcMock;

            const { result } = renderHook(() => useMasterCRUD(schema));

            await act(async () => {
                await result.current.updateItem(100, { id: 100, name: 'Updated Name', note: 'test' });
            });

            expect(rpcMock).toHaveBeenCalledWith('rpc_execute_master_update', expect.objectContaining({
                p_table_name: 'master_items',
                p_id: '100',
                p_core_data: { name: 'Updated Name', note: 'test' }, // ID is filtered since updatable: false
                p_decision_type: 'MASTER_UPDATE',
            }));
        });

        it('should call rpc with is_active: false on deleteItem', async () => {
            const rpcMock = vi.fn().mockResolvedValue({ error: null });
            (supabase as any).rpc = rpcMock;

            const { result } = renderHook(() => useMasterCRUD(schema));

            await act(async () => {
                await result.current.deleteItem(100);
            });

            expect(rpcMock).toHaveBeenCalledWith('rpc_execute_master_update', expect.objectContaining({
                p_table_name: 'master_items',
                p_id: '100',
                p_core_data: { is_active: false },
                p_decision_type: 'MASTER_ARCHIVE',
            }));
        });
    });
});
