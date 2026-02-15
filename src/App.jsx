import React, { useState } from 'react';

import SDRDashboard from './features/admin/SDRDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import BoardCanvas from './features/board/BoardCanvas';
import { LogOut, Shield, User, Truck, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AdminHome from './features/admin/AdminHome';
import SettingsPage from './features/admin/SettingsPage';
import MasterVehicleList from './features/admin/MasterVehicleList';
import MasterItemList from './features/admin/MasterItemList';
import MasterPointList from './features/admin/MasterPointList';
import MasterDriverList from './features/admin/MasterDriverList';
import UserManagementList from './features/admin/UserManagementList';

export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    );
}

/**
 * ProfilePortal - Simple selection screen for development/portal use
 * (Login is managed by Base OS)
 */
function ProfilePortal() {
    const { profiles, login, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
                    <div className="p-8 text-center bg-slate-950 border-b border-white/5">
                        <h1 className="text-3xl font-black tracking-tighter mb-1">RePaper Route</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">DXOS Portal Access</p>
                    </div>

                    <div className="p-6 space-y-3">
                        {profiles.map(profile => (
                            <button
                                key={profile.id}
                                onClick={() => login(profile)}
                                className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 active:scale-[0.98] border border-white/5 hover:border-blue-500/50 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${profile.role === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    {profile.role === 'ADMIN' ? <Shield size={22} /> : <User size={22} />}
                                </div>
                                <div className="text-left flex-1">
                                    <h2 className="font-bold text-slate-200">{profile.name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${profile.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                                            }`}>
                                            {profile.role}
                                        </span>
                                        {profile.vehicle_info && (
                                            <span className="text-[10px] text-slate-600 flex items-center gap-1 font-mono">
                                                <Truck size={10} /> {profile.vehicle_info}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-950 p-4 text-center border-t border-white/5">
                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">Secondary Auth Layer Controlled by DXOS</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AppContent() {
    const { currentUser, logout } = useAuth();
    const [adminView, setAdminView] = useState(() => {
        // 初期ロード時にURLパラメータ (?activeView=...) があれば優先する
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('activeView') || 'board';
        }
        return 'board';
    });

    // URLのパラメータ (?activeView=...) とステートを同期
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const activeView = params.get('activeView');
        if (activeView && activeView !== adminView) {
            setAdminView(activeView);
        }
    }, [currentUser]); // ログイン状態変化時に再評価

    // ステート変更時にURLを更新 (ブラウザの戻る/進むへの対応は簡易版)
    React.useEffect(() => {
        const url = new URL(window.location);
        if (url.searchParams.get('activeView') !== adminView) {
            url.searchParams.set('activeView', adminView);
            window.history.pushState({}, '', url);
        }
    }, [adminView]);

    if (!currentUser) return <ProfilePortal />;

    if (currentUser.role === 'ADMIN') {
        return (
            <ThemeProvider>
                <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
                    <AdminLayout activeView={adminView} onViewChange={setAdminView}>
                        {adminView === 'menu' && <AdminHome setAdminView={setAdminView} />}
                        {adminView === 'dashboard' && <div className="h-full overflow-y-auto p-6"><AdminDashboard /></div>}
                        {adminView === 'board' && <BoardCanvas />}
                        {adminView === 'sdr' && <div className="h-full overflow-y-auto"><SDRDashboard /></div>}
                        {adminView === 'settings' && <div className="h-full overflow-y-auto"><SettingsPage /></div>}
                        {adminView === 'master_drivers' && <MasterDriverList />}
                        {adminView === 'master_vehicles' && <MasterVehicleList />}
                        {adminView === 'master_points' && <MasterPointList />}
                        {adminView === 'master_items' && <MasterItemList />}
                        {adminView === 'users' && <UserManagementList />}
                    </AdminLayout>
                </div>
            </ThemeProvider>
        );
    }

    if (currentUser.role === 'DRIVER') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
                <p className="text-slate-400 text-sm max-w-xs mb-8">
                    このアプリケーションは**管理者専用ポータル**です。ドライバー用アプリは別途起動してください。
                </p>
                <button
                    onClick={() => { logout(); setAdminView('board'); }}
                    className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition shadow-lg"
                >
                    <LogOut size={18} />
                    ログアウト
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Unknown Access Level</div>
        </div>
    );
}
