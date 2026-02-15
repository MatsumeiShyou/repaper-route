import React from 'react';
import {
    LayoutDashboard, Truck, Users, Settings, Database,
    FileText, MapPin, Box, Shield, Activity, BarChart3, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar = ({ activeView, onViewChange }) => {
    const { currentUser, logout } = useAuth();

    const menuGroups = [
        {
            title: "OPERATIONS",
            items: [
                { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
                { id: 'board', label: '配車盤', icon: Truck, highlight: true },
            ]
        },
        {
            title: "MASTERS",
            items: [
                { id: 'master_drivers', label: 'ドライバー', icon: Users },
                { id: 'master_vehicles', label: '車両', icon: Truck },
                { id: 'master_points', label: '回収先', icon: MapPin },
                { id: 'master_items', label: '品目', icon: Box },
            ]
        },
        {
            title: "SYSTEM",
            items: [
                { id: 'sdr', label: 'SDR監査ログ', icon: Activity },
                { id: 'users', label: 'ユーザー管理', icon: Shield },
                { id: 'settings', label: '設定', icon: Settings },
            ]
        }
    ];

    return (
        <aside className="
            w-[260px] flex flex-col h-full font-sans transition-colors duration-200 z-50
            bg-white border-r border-gray-200 text-slate-700
            dark:bg-slate-900 dark:border-r-0 dark:text-slate-300 dark:shadow-xl
        ">
            {/* Logo Area */}
            <div className="
                h-16 flex items-center px-6 border-b transition-colors duration-200
                border-gray-100
                dark:border-slate-800/50 dark:bg-slate-950/20
            " onClick={() => onViewChange('menu')} style={{ cursor: 'pointer' }}>
                <div className="mr-3 transition-all hover:scale-105">
                    <img
                        src="/logo.png"
                        alt="Tsubonoya Logo"
                        className="h-10 w-auto dark:invert"
                    />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none text-slate-800 dark:text-white">SANCTUARY</h1>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-500">ROUTE COMMAND</span>
                </div>
            </div>

            {/* Navigation Flow */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-8">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="px-4">
                        <h3 className="
                            px-4 text-[10px] font-bold tracking-wider mb-2 font-mono transition-colors
                            text-gray-400
                            dark:text-slate-500
                        ">
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
                                            group w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative
                                            
                                            /* Light Mode Styles */
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                                : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
                                            }

                                            /* Dark Mode Styles */
                                            dark:${isActive
                                                ? 'bg-slate-800 text-cyan-400 shadow-lg'
                                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        {/* Reference Indicator (Light) */}
                                        {isActive && (
                                            <div className="block dark:hidden absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r" />
                                        )}

                                        {/* Reference Indicator (Dark) */}
                                        {isActive && (
                                            <div className="hidden dark:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                        )}

                                        <item.icon
                                            size={18}
                                            className={`
                                                transition-colors
                                                ${isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}
                                            `}
                                        />
                                        <span>{item.label}</span>

                                        {/* Live Indicator (Mock) */}
                                        {item.highlight && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse dark:shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile Mini */}
            <div className="
                p-4 border-t transition-colors
                border-gray-100 bg-gray-50/50
                dark:border-slate-800 dark:bg-slate-950/30
            ">
                <div className="flex items-center gap-3 px-2">
                    <div className="
                        w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm
                        bg-white border-gray-200 text-blue-600
                        dark:bg-slate-800 dark:border-slate-700 dark:text-cyan-400
                    ">
                        {currentUser?.name?.substring(0, 1) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-300">{currentUser?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter font-mono">{currentUser?.role || 'GUEST'}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        title="ログアウト"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};
