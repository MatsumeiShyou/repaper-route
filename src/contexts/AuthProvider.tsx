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

    /**
     * 認証解決のヘルパー関数
     * onAuthStateChange のコールバックから呼ばれる（競合状態の排除）
     * session を直接受け取ることで、getSession() の再呼び出しによるデッドロックを回避
     */
    const resolveAndSetStaff = async (session: Session | null) => {
        if (!session?.user) {
            setStaff(null);
            setStatus('UNAUTHENTICATED');
            return;
        }

        try {
            const promise = authAdapter.resolveStaffFromSession(session);
            setStaffPromise(promise);
            const s = await promise;
            setStaff(s);
            setStatus(s ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
        } catch (err: any) {
            console.error('[AuthProvider] Auth resolution failed with error:', err);
            setStaff(null);
            
            // AbortError の場合はエラー画面に移行させずリトライ可能にするか、未認証にする
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
                console.warn('[AuthProvider] Fetch aborted, attempting cache sync setup...');
                setStatus('UNAUTHENTICATED'); // 少なくともスタック状態を解除する
            } else if (err.code === 'FORBIDDEN') {
                setStatus('LOCKED');
            } else {
                setStatus('UNAUTHENTICATED');
            }
        }
    };

    useEffect(() => {
        // 初期化およびスタッフリストの取得
        const init = async () => {
            try {
                const list = await authAdapter.fetchAllStaffs();
                setStaffs(list);
            } catch (e) {
                console.error('[AuthProvider] Failed to fetch staffs list:', e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        // [React 18 StrictMode + Supabase v2 対策]
        // INITIAL_SESSION イベントは初回の onAuthStateChange 登録時にしか発火しないため、
        // 直後の unsubscribe によって消失し、再マウント時に発火せずハングする問題がある。
        // これを防ぐため、明示的に初期セッションを取得する。
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            console.log('[AuthProvider] Initial session fetch result:', { session: session ? 'exists' : 'null', error });
            if (error) {
                console.error('[AuthProvider] getSession error:', error);
                setStatus('UNAUTHENTICATED'); // デッドロック回避
                return;
            }
            
            resolveAndSetStaff(session).then(() => {
                if (session) {
                    authAdapter.fetchAllStaffs().then(setStaffs).catch(e => console.error('[AuthProvider] fetchAllStaffs error:', e));
                }
            });
        }).catch(err => {
            console.error('[AuthProvider] getSession promise rejected:', err);
            setStatus('UNAUTHENTICATED');
        });

        // onAuthStateChange は「その後の変更」のみを監視する
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthProvider] Auth Event: ${event}, session: ${session ? 'exists' : 'null'}`);
            
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                await resolveAndSetStaff(session);
                try {
                    const list = await authAdapter.fetchAllStaffs();
                    setStaffs(list);
                } catch (e) {
                    console.error('[AuthProvider] Failed to fetch staffs list:', e);
                }
            } else if (event === 'SIGNED_OUT') {
                setStaff(null);
                setStaffs([]);
                setStatus('UNAUTHENTICATED');
            }
        });
        return () => subscription.unsubscribe();
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
