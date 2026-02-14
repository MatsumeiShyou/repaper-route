import React, { useState } from 'react';
import DriverApp from './features/driver/DriverApp';
import SDRDashboard from './features/admin/SDRDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import BoardCanvas from './features/board/BoardCanvas';
import { LogOut } from 'lucide-react';
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

import LoginPortal from './features/auth/LoginPortal';

/**
 * アプリケーションのルートコンポーネント (Role Portal)
 * ユーザー認証(Login via DB)を行い、適切な画面へ振り分ける
 */
export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    );
}

function AppContent() {
    const { currentUser, logout } = useAuth();
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
                <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
                    <AdminLayout activeView={adminView} onViewChange={handleViewChange}>
                        {adminView === 'menu' && <AdminHome setAdminView={setAdminView} />}

                        {adminView === 'dashboard' && <div className="h-full overflow-y-auto p-6"><AdminDashboard /></div>}

                        {adminView === 'board' && <BoardCanvas />}

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
