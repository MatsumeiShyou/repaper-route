import React from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    Truck,
    Users,
    MapPin,
    UserCog,
    Settings,
    ShieldCheck
} from 'lucide-react';

const MENU_ITEMS = [
    { id: 'board', title: '動的配車盤', icon: LayoutDashboard, color: 'text-blue-500', desc: '今日の配車・進捗管理' },
    { id: 'sdr', title: 'SDR監査ボード', icon: ShieldCheck, color: 'text-emerald-500', desc: '業務決定の監査と推論' },
    { id: 'master_drivers', title: 'ドライバー設定', icon: Users, color: 'text-slate-600', desc: '乗務員名簿・表示順' },
    { id: 'master_vehicles', title: '車両設定', icon: Truck, color: 'text-slate-600', desc: '配車対象車両の管理' },
    { id: 'master_items', title: '品目設定', icon: ClipboardList, color: 'text-slate-600', desc: '回収品目・単位' },
    { id: 'master_points', title: '回収先設定', icon: MapPin, color: 'text-slate-600', desc: '店舗・回収ルート' },
    { id: 'users', title: '権限管理', icon: UserCog, color: 'text-purple-500', desc: 'ユーザー・アクセス制御' },
    { id: 'settings', title: 'システム設定', icon: Settings, color: 'text-slate-400', desc: 'ダークモード・その他' }
];

export default function AdminHome({ setAdminView }) {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <header className="mb-12">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    物流指令ターミナル
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    坪野谷紙業 厚木事業所 - 次世代業務OS (TBNY-DX-OS)
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setAdminView(item.id)}
                        className="group relative flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left overflow-hidden ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 w-fit mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors ${item.color}`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {item.desc}
                        </p>

                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                            <item.icon size={64} />
                        </div>
                    </button>
                ))}
            </div>

            <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                © 2026 TBNY DX-OS Core Logic. All rights reserved.
            </footer>
        </div>
    );
}
