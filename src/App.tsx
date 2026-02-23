import React from 'react'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { ProfilePortal } from './components/ProfilePortal'
import { RefreshCcw, Database } from 'lucide-react'
import { AdminLayout } from './components/AdminLayout'
import BoardCanvas from './features/board/BoardCanvas'
import MasterDriverList from './features/admin/MasterDriverList.tsx'
import MasterVehicleList from './features/admin/MasterVehicleList.tsx'
import MasterPointList from './features/admin/MasterPointList.tsx'
import MasterItemList from './features/admin/MasterItemList.tsx'

function AppContent() {
    const { currentUser, logout, isLoading: isAuthLoading } = useAuth()
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

    console.log("[App] Rendering. User:", currentUser?.name || 'Guest', "AuthLoading:", isAuthLoading);

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

    // Role Guard for Sanctuary Mode
    if (currentUser.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
                <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
                <p className="text-slate-400 text-sm mb-8">管理者専用ポータルです。</p>
                <button onClick={logout} className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold">ログアウト</button>
            </div>
        );
    }

    const renderView = () => {
        switch (activeView) {
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
            default:
                return (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                        <Database size={48} className="mb-4 opacity-20" />
                        <h2 className="text-sm font-black uppercase tracking-widest italic opacity-50">View under construction: {activeView}</h2>
                        <p className="text-[10px] mt-2 font-mono">Sanctuary Phase 3 Module Integration Required</p>
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
                <NotificationProvider>
                    <AppContent />
                </NotificationProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}
