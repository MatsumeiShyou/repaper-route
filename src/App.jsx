import React, { useState } from 'react';
import DriverApp from './features/driver/DriverApp';
import SDRDashboard from './features/admin/SDRDashboard'; // New Import
import BoardCanvas from './features/board/BoardCanvas';
import { cn } from './lib/utils';
import { User, Shield, Truck, LogOut, Activity } from 'lucide-react'; // Added Activity

import { supabase } from './lib/supabase/client';

/**
 * アプリケーションのルートコンポーネント (Role Portal)
 * ユーザー認証(Login via DB)を行い、適切な画面へ振り分ける
 */
export default function App() {
    const [currentUser, setCurrentUser] = useState(null); // { id, name, role, ... }
    const [adminView, setAdminView] = useState('menu'); // 'menu' | 'dashboard' | 'board' | 'sdr'
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Load Users from DB ---
    React.useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('role', { ascending: true }) // ADMIN first
                    .order('name');

                if (data) setProfiles(data);
                if (error) console.error("Profile Fetch Error:", error);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // --- Login ---
    const handleLogin = (user) => {
        const userData = {
            id: user.id || user.user_id, // Normalize ID
            name: user.name,
            role: user.role,
            vehicle: user.vehicle_info || user.vehicle // Normalize Vehicle
        };
        setCurrentUser(userData);
        setAdminView('menu'); // Reset admin view on login
    };

    const handleLogout = () => {
        if (confirm('ログアウトしますか？')) {
            setCurrentUser(null);
        }
    };

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
                            // In real app, color could be in DB or hashed from name
                            const isDriver = user.role === 'DRIVER';
                            const bgColor = isDriver ? 'bg-blue-600' : 'bg-slate-800';

                            return (
                                <button
                                    key={user.id || user.user_id}
                                    onClick={() => handleLogin(user)}
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
                        Production Mode v2.0
                    </div>
                </div>
            </div>
        );
    }

    // 2. Admin Portal
    if (currentUser.role === 'ADMIN') {
        if (adminView === 'menu') {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Changed grid cols */}
                        {/* Header */}
                        <div className="md:col-span-2 lg:col-span-3 flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">管理メニュー</h1>
                                <p className="text-slate-500">管理者: {currentUser.name}</p>
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-bold">
                                <LogOut size={20} /> ログアウト
                            </button>
                        </div>

                        {/* Options */}
                        <button
                            onClick={() => setAdminView('dashboard')}
                            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition flex flex-col items-center text-center gap-4 group h-64 justify-center"
                        >
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">管理ボード</h2>
                                <p className="text-gray-500 mt-2 text-sm">回収実績の承認</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setAdminView('board')}
                            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition flex flex-col items-center text-center gap-4 group h-64 justify-center"
                        >
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <Truck size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">配車盤</h2>
                                <p className="text-gray-500 mt-2 text-sm">配車計画・状況</p>
                            </div>
                        </button>

                        {/* New SDR Dashboard Button */}
                        <button
                            onClick={() => setAdminView('sdr')}
                            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition flex flex-col items-center text-center gap-4 group h-64 justify-center"
                        >
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">SDR監査</h2>
                                <p className="text-gray-500 mt-2 text-sm">提案・決定ログ</p>
                            </div>
                        </button>
                    </div>
                </div>
            );
        }
        if (adminView === 'dashboard') {
            return (
                <div className="relative">
                    <AdminDashboard />
                    <BackButton onClick={() => setAdminView('menu')} />
                </div>
            );
        }
        if (adminView === 'board') {
            return (
                <div className="relative">
                    <BoardCanvas />
                    <BackButton onClick={() => setAdminView('menu')} />
                </div>
            );
        }
        if (adminView === 'sdr') {
            return (
                <div className="relative h-screen p-4 bg-gray-100">
                    <SDRDashboard />
                    <BackButton onClick={() => setAdminView('menu')} />
                </div>
            );
        }
    }

    // 3. Driver App
    if (currentUser.role === 'DRIVER') {
        return (
            <div className="relative">
                <DriverApp initialDriverName={currentUser.name} initialVehicle={currentUser.vehicle} />
                <BackButton onClick={handleLogout} label="ログアウト" />
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
