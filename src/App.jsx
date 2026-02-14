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
    const { currentUser, profiles, isLoading, login, logout } = useAuth();
    const [adminView, setAdminView] = useState('board'); // Default to Board

    // --- Render Logic ---

    // 1. Login Screen
    if (!currentUser) {
        if (isLoading) {
            return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Loading Users...</div>;
        }

        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-gray-800 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">RePaper Route</h1>
                        <p className="opacity-70 text-sm">ユーザーを選択してください (DB Connected)</p>
                    </div>
                    <div className="p-6 space-y-3">
                        {profiles.map(user => {
                            // Assign Color based on Role/Index manually for UI consistency
                            const isDriver = user.role === 'DRIVER';
                            const bgColor = isDriver ? 'bg-blue-600' : 'bg-slate-800';

                            return (
                                <button
                                    key={user.id || user.user_id}
                                    onClick={() => {
                                        login(user); // Use unified login logic
                                        setAdminView('menu'); // Reset view on login
                                    }}
                                    className={cn(
                                        "w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-gray-50 active:scale-95 shadow-sm border border-gray-100",
                                        !isDriver ? "border-l-4 border-l-slate-800" : ""
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md", bgColor)}>
                                        {!isDriver ? <Shield size={20} /> : <User size={20} />}
                                    </div>
                                    <div className="text-left flex-1">
                                        <h2 className="text-lg font-bold">{user.name}</h2>
                                        {user.vehicle_info && <p className="text-xs text-gray-500 flex items-center gap-1"><Truck size={12} /> {user.vehicle_info}</p>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                        Production Mode v2.1 (AuthContext)
                    </div>
                </div>
            </div>
        );
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
                <BackButton onClick={logout} label="ログアウト" />
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
