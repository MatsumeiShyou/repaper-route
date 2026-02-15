import React, { useState } from 'react';
import DriverApp from './DriverApp';
import AdminDashboard from './AdminDashboard';
import BoardCanvas from './BoardCanvas';
import { cn } from './lib/utils';
import { User, Shield, Truck, LogOut } from 'lucide-react';

// --- Mock Data (Ideally tailored via DB) ---
const USERS = [
    { id: 'admin', name: '邂｡逅・・(Admin)', role: 'ADMIN', color: 'bg-slate-800' },
    { id: 'd1', name: '逡第ｾ､', role: 'DRIVER', vehicle: '2025PK', color: 'bg-blue-600' },
    { id: 'd2', name: '闖雁慍', role: 'DRIVER', vehicle: '2267PK', color: 'bg-green-600' },
    { id: 'd3', name: '荳・㈹', role: 'DRIVER', vehicle: '2618PK', color: 'bg-purple-600' },
    { id: 'd4', name: '迚・ｱｱ', role: 'DRIVER', vehicle: '5122PK', color: 'bg-orange-600' },
];

/**
 * 繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ繝ｫ繝ｼ繝医さ繝ｳ繝昴・繝阪Φ繝・(Role Portal)
 * 繝ｦ繝ｼ繧ｶ繝ｼ隱崎ｨｼ(Mock)繧定｡後＞縲・←蛻・↑逕ｻ髱｢縺ｸ謖ｯ繧雁・縺代ｋ
 */
export default function App() {
    const [currentUser, setCurrentUser] = useState(null); // { id, name, role, ... }
    const [adminView, setAdminView] = useState('menu'); // 'menu' | 'dashboard' | 'board'

    // --- Login (Mock) ---
    const handleLogin = (user) => {
        setCurrentUser(user);
        setAdminView('menu'); // Reset admin view on login
    };

    const handleLogout = () => {
        if (confirm('繝ｭ繧ｰ繧｢繧ｦ繝医＠縺ｾ縺吶°・・)) {
            setCurrentUser(null);
        }
    };

    // --- Render Logic ---

    // 1. Login Screen
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-gray-800 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">RePaper Route</h1>
                        <p className="opacity-70 text-sm">繝ｦ繝ｼ繧ｶ繝ｼ繧帝∈謚槭＠縺ｦ縺上□縺輔＞</p>
                    </div>
                    <div className="p-6 space-y-3">
                        {USERS.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleLogin(user)}
                                className={cn(
                                    "w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-gray-50 active:scale-95 shadow-sm border border-gray-100",
                                    user.role === 'ADMIN' ? "border-l-4 border-l-slate-800" : ""
                                )}
                            >
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md", user.color)}>
                                    {user.role === 'ADMIN' ? <Shield size={20} /> : <User size={20} />}
                                </div>
                                <div className="text-left flex-1">
                                    <h2 className="text-lg font-bold">{user.name}</h2>
                                    {user.vehicle && <p className="text-xs text-gray-500 flex items-center gap-1"><Truck size={12} /> {user.vehicle}</p>}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                        Development Build v1.0
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
                    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Header */}
                        <div className="md:col-span-2 flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">邂｡逅・Γ繝九Η繝ｼ</h1>
                                <p className="text-slate-500">邂｡逅・・ {currentUser.name}</p>
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-bold">
                                <LogOut size={20} /> 繝ｭ繧ｰ繧｢繧ｦ繝・                            </button>
                        </div>

                        {/* Options */}
                        <button
                            onClick={() => setAdminView('dashboard')}
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition flex flex-col items-center text-center gap-4 group"
                        >
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <Shield size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">邂｡逅・ム繝・す繝･繝懊・繝・/h2>
                                <p className="text-gray-500 mt-2">蝗槫庶迥ｶ豕√・遒ｺ隱阪・謇ｿ隱堺ｽ懈･ｭ</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setAdminView('board')}
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition flex flex-col items-center text-center gap-4 group"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <Truck size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">驟崎ｻ顔乢 (Board)</h2>
                                <p className="text-gray-500 mt-2">驟崎ｻ願ｨ育判繝ｻ繝ｪ繧｢繝ｫ繧ｿ繧､繝迥ｶ豕・/p>
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
    }

    // 3. Driver App
    if (currentUser.role === 'DRIVER') {
        return (
            <div className="relative">
                <DriverApp initialDriverName={currentUser.name} initialVehicle={currentUser.vehicle} />
                <BackButton onClick={handleLogout} label="繝ｭ繧ｰ繧｢繧ｦ繝・ />
            </div>
        );
    }

    return <div>Error: Unknown Role</div>;
}

// Internal Component: Floating Back/Logout Button
function BackButton({ onClick, label = "繝｡繝九Η繝ｼ縺ｸ謌ｻ繧・ }) {
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
