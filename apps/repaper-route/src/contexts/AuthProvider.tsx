import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { authAdapter } from '../os/auth/AuthAdapter';
import type { Staff, AuthStatus } from '../os/auth/types';
import type { Session } from '@supabase/supabase-js';
import { Modal } from '../components/Modal';

interface AuthContextType {
    /** @deprecated use staff instead */
    currentUser: Staff | null;
    staff: Staff | null;
    staffs: Staff[];
    status: AuthStatus;
    /** React 19 use() フック用 Promise */
    staffPromise: Promise<Staff | null> | null;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [staff, setStaff] = useState<Staff | null>(null);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [status, setStatus] = useState<AuthStatus>(() => {
        // キャッシュ（トークン）がない場合は、サーバー応答を待たずに即座に非認証状態とする
        return authAdapter.hasCachedSession() ? 'INITIALIZING' : 'UNAUTHENTICATED';
    });
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [debugError, setDebugError] = useState<string>('');
    
    // React 19 use() 用の Promise を保持
    const [staffPromise, setStaffPromise] = useState<Promise<Staff | null> | null>(null);

    // [MUTEX] 認証解決プロセスの二重起動（競合による AbortError）を防止
    const isResolving = React.useRef(false);

    /**
     * 認証解決のヘルパー関数
     */
    const resolveAndSetStaff = async (session: Session | null) => {
        if (isResolving.current) {
            console.log('[AuthProvider] Auth resolution already in progress. Skipping duplicate call.');
            return;
        }
        isResolving.current = true;

        if (!session?.user) {
            console.log('[AuthProvider] No session user, setting UNAUTHENTICATED');
            setStaff(null);
            setStatus('UNAUTHENTICATED');
            isResolving.current = false;
            return;
        }

        try {
            console.log('[AuthProvider] Resolving staff for UID:', session.user.id);
            // [FAIL-SAFE] タイムアウトを設定
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Auth resolution TIMEOUT')), 15500);
            });

            const promise = authAdapter.resolveStaffFromSession(session);
            setStaffPromise(promise);
            
            const s = await Promise.race([promise, timeoutPromise]);
            
            setStaff(s);
            setStatus(s ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
        } catch (err: unknown) {
            console.error('[AuthProvider] Auth resolution failed:', err);
            setStaff(null);
            
            const errorObj = err instanceof Error ? err : new Error(String(err));
            const errName = errorObj.name;
            const errMessage = errorObj.message;
            const errCode = (err && typeof err === 'object' && 'code' in err) ? (err as Record<string, unknown>).code : undefined;
            
            const isAbort = errName === 'AbortError' || errMessage.includes('aborted');
            const isTimeout = errMessage === 'TIMEOUT_DB_FETCH' || errMessage.includes('TIMEOUT');
            const isNotFound = errName === 'StaffNotFoundError' || errCode === 'FORBIDDEN';

            if (isTimeout) {
                console.error('[AuthProvider] CRITICAL: DB Fetch Timeout. Forcing radical logout.');
                setDebugError(`TIMEOUT: ${errMessage}`);
                setStatus('UNAUTHENTICATED');
                supabase.auth.signOut().finally(() => authAdapter.clearCache());
            } else if (isAbort) {
                setStatus('UNAUTHENTICATED');
            } else if (isNotFound) {
                setDebugError(`NOT FOUND: ${errMessage}`);
                setStatus('NOT_REGISTERED');
            } else {
                setDebugError(`ERROR: ${errMessage}`);
                setStatus('UNAUTHENTICATED');
            }
        } finally {
            isResolving.current = false;
        }
    };

    useEffect(() => {
        let isCancelled = false;
        
        // 1. スタッフリストの取得
        const fetchList = async () => {
            try {
                const list = await authAdapter.fetchAllStaffs();
                if (!isCancelled) setStaffs(list);
            } catch (e) {
                console.error('[AuthProvider] Failed to fetch staffs list:', e);
            }
        };

        // 認証状態の変化（および初期化）を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthProvider] Auth Event: ${event}`);
            if (isCancelled) return;
            
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                await resolveAndSetStaff(session);
                await fetchList();
            } else if (event === 'SIGNED_OUT') {
                setStaff(null);
                setStaffs([]);
                setStatus('UNAUTHENTICATED');
                // サインアウト時のクリーンアップ

            }
        });

        return () => {
            isCancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        setIsLogoutModalOpen(false);
        await supabase.auth.signOut();
        await authAdapter.clearCache();
    };

    return (
        <AuthContext.Provider value={{ 
            staff, 
            currentUser: staff,
            staffs, 
            status, 
            staffPromise,
            isLoading: status === 'INITIALIZING',
            logout 
        }}>
            {debugError && (
                <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: 8, zIndex: 9999, fontSize: 12 }}>
                    DEBUG ERROR: {debugError}
                </div>
            )}
            {children}

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="ログアウト"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button
                            onClick={() => setIsLogoutModalOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={confirmLogout}
                            className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-900/20"
                        >
                            ログアウト実行
                        </button>
                    </div>
                }
            >
                <div className="py-2">
                    <p className="text-sm text-slate-300">
                        システムからログアウトしますか？<br />
                        <span className="text-[10px] text-slate-500 mt-2 block">
                            ※オフラインキャッシュは破棄されます
                        </span>
                    </p>
                </div>
            </Modal>
        </AuthContext.Provider>
    );
};
