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
    const [status, setStatus] = useState<AuthStatus>('INITIALIZING');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    // React 19 use() 用の Promise を保持
    const [staffPromise, setStaffPromise] = useState<Promise<Staff | null> | null>(null);

    // [MUTEX] 認証解決プロセスの二重起動（競合による AbortError）を防止
    const isResolving = React.useRef(false);

    /**
     * 認証解決のヘルパー関数
     * onAuthStateChange のコールバックから呼ばれる（競合状態の排除）
     * session を直接受け取ることで、getSession() の再呼び出しによるデッドロックを回避
     */
    const resolveAndSetStaff = async (session: Session | null) => {
        if (isResolving.current) {
            console.log('[AuthProvider] Auth resolution already in progress. Skipping duplicate call.');
            return;
        }
        isResolving.current = true;

        if (!session?.user) {
            setStaff(null);
            setStatus('UNAUTHENTICATED');
            isResolving.current = false;
            return;
        }

        try {
            // [FAIL-SAFE] 5秒間のタイムアウトを設定（IDBやSWのハング対策）
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Auth resolution TIMEOUT: Local storage or IDB might be hung.')), 5000);
            });

            const promise = authAdapter.resolveStaffFromSession(session);
            setStaffPromise(promise);
            
            // Promise.race を使用してハングを防止
            const s = await Promise.race([promise, timeoutPromise]);
            
            setStaff(s);
            setStatus(s ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
        } catch (err: any) {
            console.error('[AuthProvider] Auth resolution failed or timed out:', err);
            setStaff(null);
            
            const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
            const isTimeout = err?.message === 'TIMEOUT_DB_FETCH' || err?.message?.includes('TIMEOUT');
            const isNotFound = err?.name === 'StaffNotFoundError' || err?.code === 'FORBIDDEN';

            if (isTimeout) {
                console.error('[AuthProvider] CRITICAL: DB Fetch Timeout. Forcing radical logout to clear stuck state.');
                setStatus('UNAUTHENTICATED');
                // ハングを断絶するため強制サインアウトとキャッシュクリア
                supabase.auth.signOut().finally(() => {
                    authAdapter.clearCache();
                });
            } else if (isAbort) {
                // タイムアウトや中断時は初期状態（ログイン画面）へ
                setStatus('UNAUTHENTICATED');
            } else if (isNotFound) {
                // スタッフ名簿に不在、またはアプリ権限がない場合は明示的に NOT_REGISTERED へ
                setStatus('NOT_REGISTERED');
            } else {
                // その他の重大なエラー
                setStatus('UNAUTHENTICATED');
            }
        } finally {
            isResolving.current = false;
        }
    };

    useEffect(() => {
        let isCancelled = false;
        
        // 初期化およびスタッフリストの取得
        const init = async () => {
            try {
                const list = await authAdapter.fetchAllStaffs();
                if (!isCancelled) setStaffs(list);
            } catch (e) {
                console.error('[AuthProvider] Failed to fetch staffs list:', e);
            }
        };
        init();

        // [React 18/19 StrictMode 対策] 一度だけ実行を保証
        const loadInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('[AuthProvider] Initial session fetch result:', { session: session ? 'exists' : 'null', error });
                
                if (isCancelled) return;
                
                if (error) {
                    console.error('[AuthProvider] getSession error:', error);
                    setStatus('UNAUTHENTICATED');
                    return;
                }
                
                await resolveAndSetStaff(session);
                
                if (session && !isCancelled) {
                    const list = await authAdapter.fetchAllStaffs();
                    setStaffs(list);
                }
            } catch (err) {
                console.error('[AuthProvider] getSession promise rejected:', err);
                if (!isCancelled) setStatus('UNAUTHENTICATED');
            }
        };

        loadInitialSession();

        // onAuthStateChange は「その後の変更」のみを監視する
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthProvider] Auth Event: ${event}, session: ${session ? 'exists' : 'null'}`);
            if (isCancelled) return;
            
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                await resolveAndSetStaff(session);
                try {
                    const list = await authAdapter.fetchAllStaffs();
                    if (!isCancelled) setStaffs(list);
                } catch (e) {
                    console.error('[AuthProvider] Failed to fetch staffs list:', e);
                }
            } else if (event === 'SIGNED_OUT') {
                setStaff(null);
                setStaffs([]);
                setStatus('UNAUTHENTICATED');
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
            currentUser: staff, // Backward compatibility
            staffs, 
            status, 
            staffPromise,
            isLoading: status === 'INITIALIZING',
            logout 
        }}>
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
