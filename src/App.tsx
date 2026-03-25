import React from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { InteractionProvider } from './contexts/InteractionContext'
import { MasterDataProvider } from './contexts/MasterDataContext'
import { ProfilePortal } from './components/ProfilePortal'
import { RefreshCcw, Database } from 'lucide-react'
import { AdminLayout } from './components/AdminLayout'
import BoardCanvas from './features/board/BoardCanvas'
import MasterDriverList from './features/admin/MasterDriverList.tsx'
import MasterVehicleList from './features/admin/MasterVehicleList.tsx'
import MasterPointList from './features/admin/MasterPointList.tsx'
import MasterItemList from './features/admin/MasterItemList.tsx'
import { DeviceSettings } from './features/settings/DeviceSettings'

function AppContent() {
    const { currentUser, isLoading: isAuthLoading } = useAuth()
    const [activeView, setActiveView] = React.useState(() => {
        // 初期ロード時にURLパラメータ (?activeView=...) があれば優先する
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('activeView') || 'board';
        }
        return 'board';
    })

    // URLのパラメータ (?activeView=...) とステートを同期
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const activeViewParam = params.get('activeView');
        if (activeViewParam && activeViewParam !== activeView) {
            setActiveView(activeViewParam);
        }
    }, [currentUser]); // ログイン後に実行

    // ステート変更時にURLを更新
    React.useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('activeView') !== activeView) {
            url.searchParams.set('activeView', activeView);
            window.history.pushState({}, '', url);
        }
    }, [activeView]);

    // console.log("[App] Rendering. User:", currentUser?.name || 'Guest', "AuthLoading:", isAuthLoading);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin text-blue-500">
                        <RefreshCcw size={48} />
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <ProfilePortal />
    }

    // 管理者以外の一般アクセス制御（閲覧制限のガードレール）
    const isAdmin = currentUser.role === 'admin';
    const isDriver = currentUser.role === 'driver';

    // 管理者もドライバーも配車盤は閲覧可能。それ以外は管理者のみ。
    const canAccessView = (view: string) => {
        if (isAdmin) return true;
        if (isDriver && view === 'board') return true;
        return false;
    };

    const renderView = () => {
        // 権限がないビューを要求された場合は制約に基づき 'board' へ強制送還
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
                        <h2 className="text-sm font-black uppercase tracking-widest italic opacity-50">準備中: {targetView}</h2>
                        <p className="text-[10px] mt-2 font-mono">モジュールの統合が必要です</p>
                    </div>
                );
        }
    }

    return (
        <AdminLayout activeView={canAccessView(activeView) ? activeView : 'board'} onViewChange={setActiveView}>
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
                            <AppContent />
                        </NotificationProvider>
                    </InteractionProvider>
                </MasterDataProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}
