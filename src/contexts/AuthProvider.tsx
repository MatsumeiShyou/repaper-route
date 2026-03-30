import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../lib/supabase/client';
import { authAdapter } from '../os/auth/AuthAdapter';
import type { Staff, AuthStatus } from '../os/auth/types';
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

    useMemo(() => {
        const promise = authAdapter.resolveStaff();
        setStaffPromise(promise);
        
        promise.then(s => {
            setStaff(s);
            setStatus(s ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
        }).catch(err => {
            console.error('[AuthProvider] Auth resolution failed:', err);
            setStaff(null);
            // エラーの種類に応じて LOCKED か UNAUTHENTICATED へ
            if (err.code === 'FORBIDDEN') {
                setStatus('LOCKED');
            } else {
                setStatus('UNAUTHENTICATED');
            }
        });
        return promise;
    }, []);

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
        // [AuthAdapter] の内部リスナーと協調しつつ、UI ステートを同期
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
            console.log(`[AuthProvider] Auth Event: ${event}`);
            
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                const s = await authAdapter.resolveStaff();
                setStaff(s);
                setStatus(s ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
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
