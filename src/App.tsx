import React from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { InteractionProvider } from './contexts/InteractionContext'
import { MasterDataProvider } from './contexts/MasterDataContext'
import { ProfilePortal } from './components/ProfilePortal'
import { ShieldAlert, Database, RefreshCcw } from 'lucide-react'
import { AdminLayout } from './components/AdminLayout'
import BoardCanvas from './features/board/BoardCanvas'
import MasterDriverList from './features/admin/MasterDriverList.tsx'
import MasterVehicleList from './features/admin/MasterVehicleList.tsx'
import MasterPointList from './features/admin/MasterPointList.tsx'
import MasterItemList from './features/admin/MasterItemList.tsx'
import { DeviceSettings } from './features/settings/DeviceSettings'
import { AuthErrorBoundary } from './os/auth/AuthErrorBoundary'

/**
 * DXOS Standard SplashScreen (v1.0)
 */
function SplashScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-emerald-900/10 opacity-50" />
            <div className="flex flex-col items-center gap-8 relative z-10 animate-in fade-in zoom-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="h-16 w-auto invert opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tighter text-white">
                        <span className="text-emerald-500">R</span>EPAPER <span className="text-emerald-500">R</span>OUTE
                    </h1>
                    <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mt-4">
                        Sanctuary DXOS Vertical Integration
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 text-emerald-500/80">
                    <RefreshCcw size={14} className="animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">Initializing Citizens...</span>
                </div>
            </div>
        </div>
    )
}

/**
 * アプリケーションの認証・権限ガードレール（許可/拒絶）
 */
function AppContent() {
    const { staff, status } = useAuth()
    const [activeView, setActiveView] = React.useState('board')

    // URLパラメータ同期
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('activeView') || 'board';
        setActiveView(view);
    }, []);

    React.useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('activeView') !== activeView) {
            url.searchParams.set('activeView', activeView);
            window.history.pushState({}, '', url);
        }
    }, [activeView]);

    // 1. ロード中
    if (status === 'INITIALIZING') {
        return <SplashScreen />
    }

    // 2. 未ログイン
    if (status === 'UNAUTHENTICATED' || !staff) {
        return <ProfilePortal />
    }

    // 3. 権限不足（LOCKED）
    if (status === 'LOCKED') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-rose-950/20">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4 tracking-tight">アクセス拒絶</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        スタッフ名簿には登録されていますが、<br />
                        このシステムへのアクセス権限がありません。<br />
                        <span className="text-rose-400/80 font-bold block mt-4 px-3 py-1 bg-rose-900/20 rounded-lg inline-block text-[10px] tracking-widest uppercase">
                            App ID: repaper-route
                        </span>
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all"
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        )
    }

    // 4. 許可済み（AUTHENTICATED）
    const canAccessView = (view: string) => {
        const p = staff.permissions;
        if (p.can_manage_master) return true; // Manager/Admin
        if (view === 'board') return true;    // All staff can see board
        return false;
    };

    const renderView = () => {
        const targetView = canAccessView(activeView) ? activeView : 'board';

        switch (targetView) {
            case 'board':
                return <BoardCanvas />;
            case 'master_drivers':
                return <MasterDriverList />;
            case 'master_vehicles':
                return <MasterVehicleList />;
            case 'master_points':
                return <MasterPointList />;
            case 'master_items':
                return <MasterItemList />;
            case 'settings':
                return <DeviceSettings />;
            default:
                return (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                        <Database size={48} className="mb-4 opacity-20" />
                        <h2 className="text-sm font-black uppercase tracking-widest italic opacity-50">READYING: {targetView}</h2>
                    </div>
                );
        }
    }

    return (
        <AdminLayout activeView={activeView} onViewChange={setActiveView}>
            {renderView()}
        </AdminLayout>
    );
}

import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
    return (
        <ErrorBoundary name="GlobalApp">
            <AuthProvider>
                <MasterDataProvider>
                    <InteractionProvider>
                        <NotificationProvider>
                            <AuthErrorBoundary>
                                <AppContent />
                            </AuthErrorBoundary>
                        </NotificationProvider>
                    </InteractionProvider>
                </MasterDataProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}
