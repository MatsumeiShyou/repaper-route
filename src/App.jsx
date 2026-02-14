import React, { useState } from 'react';
import DriverApp from './features/driver/DriverApp';
import SDRDashboard from './features/admin/SDRDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import BoardCanvas from './features/board/BoardCanvas';
import { cn } from './lib/utils';
import { User, Shield, Truck, LogOut, Activity, MapPin, Box } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { MasterPlaceholder } from './components/MasterPlaceholder';
import { ThemeProvider } from './contexts/ThemeContext';
import SettingsPage from './features/admin/SettingsPage';
import MasterVehicleList from './features/admin/MasterVehicleList';
import MasterItemList from './features/admin/MasterItemList';
import MasterPointList from './features/admin/MasterPointList';
import MasterDriverList from './features/admin/MasterDriverList';
import UserManagementList from './features/admin/UserManagementList';

import LoginPortal from './features/auth/LoginPortal';

/**
 * アプリケーションのルートコンポーネント (Role Portal)
 * ユーザー認証(Login via DB)を行い、適切な画面へ振り分ける
 */
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { currentUser, logout } = useAuth(); // profiles and login are used in LoginPortal
    const [adminView, setAdminView] = useState('board'); // Default to Board

    // --- Render Logic ---

    // 1. Login Screen
    if (!currentUser) {
        return <LoginPortal />;
    }

    // 2. Admin Portal
    if (currentUser.role === 'ADMIN') {
        const handleViewChange = (viewId) => {
            setAdminView(viewId);
        };

        return (
            <ThemeProvider>
                <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
                    <AdminLayout activeView={adminView} onViewChange={handleViewChange}>
                        {adminView === 'menu' && ( // "Home" dashboard logic
                            <div className="p-8 h-full overflow-y-auto">
                                <h1 className="text-2xl font-bold mb-6">管理者ホーム</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Dashboard Shortcut */}
                                    <button onClick={() => setAdminView('dashboard')} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md transition">
                                        <Shield size={32} className="text-blue-600 dark:text-cyan-400 mb-4" />
                                        <h3 className="font-bold">管理ボード</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">回収実績の承認・管理</p>
                                    </button>
                                    {/* Board Shortcut */}
                                    <button onClick={() => setAdminView('board')} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md transition">
                                        <Truck size={32} className="text-emerald-600 dark:text-emerald-400 mb-4" />
                                        <h3 className="font-bold">配車盤</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">本日の配車状況確認</p>
                                    </button>
                                    {/* SDR Shortcut */}
                                    <button onClick={() => setAdminView('sdr')} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md transition">
                                        <Activity size={32} className="text-purple-600 dark:text-purple-400 mb-4" />
                                        <h3 className="font-bold">SDR監査</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">システムログ・監査</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {adminView === 'dashboard' && <div className="h-full overflow-y-auto p-6"><AdminDashboard /></div>}

                        {adminView === 'board' && <BoardCanvas />} {/* Board handles its own scroll */}

                        {adminView === 'sdr' && <div className="h-full overflow-y-auto"><SDRDashboard /></div>}

                        {adminView === 'settings' && <div className="h-full overflow-y-auto"><SettingsPage /></div>}

                        {/* Master Pages */}
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

    // 3. Driver App
    if (currentUser.role === 'DRIVER') {
        return (
            <div className="relative">
                <DriverApp initialDriverName={currentUser.name} initialVehicle={currentUser.vehicle} />
                <BackButton onClick={() => {
                    logout();
                    setAdminView('board');
                }} label="ログアウト" />
            </div>
        );
    }

    return <div>Error: Unknown Role</div>;
}

// Internal Component: Floating Back/Logout Button
function BackButton({ onClick, label = "メニューへ戻る" }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-4 right-4 z-[9999] bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-700 transition flex items-center gap-2 text-sm font-bold opacity-80 hover:opacity-100"
        >
            <LogOut size={14} />
            {label}
        </button>
    );
}
