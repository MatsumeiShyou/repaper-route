import React from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { InteractionProvider } from './contexts/InteractionContext'
import { MasterDataProvider } from './contexts/MasterDataContext'
import { ShieldAlert, Database, RefreshCcw, Truck } from 'lucide-react'
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

    // 2. 未登録（市民ではない）
    if (status === 'NOT_REGISTERED') {
        return <UnregisteredScreen />
    }

    // 3. 未認証（OSのポータルへリダイレクト）
    if (status === 'UNAUTHENTICATED' || !staff) {
        // [Micro-Frontend] 未認証の場合は、アプリ固有のログイン画面を出さず親OSへ強制帰還
        if (typeof window !== 'undefined') {
            window.location.href = '/'
        }
        return null; // リダイレクト完了まで何も描画しない
    }

    // 4. 権限不足（LOCKED）
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
                        onClick={() => window.location.href = '/'}
                        className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all"
                    >
                        ポータルへ戻る
                    </button>
                </div>
            </div>
        )
    }

    // 5. 許可済み（AUTHENTICATED）
    const canAccessView = (view: string) => {
        if (!staff) return false;
        const p = staff.permissions;
        const role = staff.role;

        // 管理者・マネージャーは全画面OK
        if (p.can_manage_master || role === 'admin' || role === 'manager') return true;

        // ドライバーの場合：master_ で始まる画面は一律拒絶
        if (role === 'driver' && view.startsWith('master_')) return false;

        // デフォルト：board は全員OK
        if (view === 'board') return true;

        // それ以外（個別設定などがあればここに追加）
        return false;
    };

    const renderView = () => {
        // 現在の権限で許可されていないビューが指定された場合は 'board' へフォールバック
        const isAllowed = canAccessView(activeView);
        const targetView = isAllowed ? activeView : 'board';

        if (!isAllowed && activeView !== 'board') {
            console.warn(`[App] Access denied for view: ${activeView}. Falling back to board.`);
        }

        switch (targetView) {
            case 'board':
                return <BoardCanvas />;
            case 'driver_mode':
                // 将来的にドライバー専用のシンプル画面を作る場合はここに追加
                return (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-10 text-center">
                        <Truck size={64} className="mb-6 opacity-20 text-emerald-600" />
                        <h2 className="text-xl font-black text-slate-800 mb-2">ドライバー専用モード</h2>
                        <p className="text-sm opacity-60">
                            現在、ドライバー向け専用画面を準備中です。<br />
                            左側のメニューから「配車ボード」を確認できます。
                        </p>
                    </div>
                );
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
