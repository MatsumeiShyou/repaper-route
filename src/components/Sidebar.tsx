import React from 'react';
import {
    LayoutDashboard, Truck, Users, Settings,
    MapPin, Box, Shield, Activity, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
    const { currentUser, logout } = useAuth();

    const menuGroups = [
        {
            title: "業務メニュー",
            items: [
                { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
                { id: 'board', label: '配車盤', icon: Truck, highlight: true },
            ]
        },
        {
            title: "マスタ管理",
            items: [
                { id: 'master_drivers', label: 'ドライバー', icon: Users },
                { id: 'master_vehicles', label: '車両', icon: Truck },
                { id: 'master_points', label: '回収先', icon: MapPin },
                { id: 'master_items', label: '品目', icon: Box },
            ]
        },
        {
            title: "システム設定",
            items: [
                { id: 'sdr', label: 'SDR監査ログ', icon: Activity },
                { id: 'users', label: 'ユーザー管理', icon: Shield },
                { id: 'settings', label: '設定', icon: Settings },
            ]
        }
    ];

    return (
        <aside className="w-[260px] flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 z-50">
            {/* Logo Area */}
            <div
                className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-900 transition-colors"
                onClick={() => onViewChange('menu')}
            >
                <div className="mr-3">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-8 w-auto invert opacity-80"
                        onError={(e) => {
                            // Fallback if logo not found
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-white leading-none">
                        <span className="text-emerald-600">R</span>epaper <span className="text-emerald-600">R</span>oute
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-8">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="px-4">
                        <h3 className="px-4 text-[9px] font-black tracking-[0.2em] mb-4 text-slate-600 uppercase font-mono">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map(item => {
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onViewChange(item.id)}
                                        className={`
                                            group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r shadow-[0_0_8px_white]" />
                                        )}

                                        <item.icon
                                            size={16}
                                            className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}
                                        />
                                        <span className="tracking-tight">{item.label}</span>

                                        {item.highlight && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ユーザープロフィール（簡易表示） */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-blue-400 shadow-inner">
                        {currentUser?.name?.substring(0, 1) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black truncate text-slate-200 uppercase tracking-tight">{currentUser?.name || '不明'}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold leading-none mt-0.5">{currentUser?.role || 'ゲスト'}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
};
