import React, { useState, useEffect } from 'react';
import { Users, Edit2, Search, Loader2, Save, Info, Shield, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagementList() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'DRIVER',
        vehicle_info: ''
    });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchVehicles();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('role', { ascending: true })
                .order('name');
            if (error) throw error;
            setUsers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const { data } = await supabase.from('vehicles').select('callsign, number').eq('is_active', true);
            if (data) setVehicles(data);
        } catch (e) { console.error(e); }
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '',
            role: user.role || 'DRIVER',
            vehicle_info: user.vehicle_info || ''
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            alert("「変更理由」は必須です。");
            return;
        }

        setIsSubmitting(true);
        try {
            const coreData = {
                name: formData.name,
                role: formData.role,
                vehicle_info: formData.vehicle_info
            };

            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'users',
                p_id: selectedUser.id,
                p_core_data: coreData,
                p_ext_data: {},
                p_decision_type: 'USER_PROFILE_UPDATE',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchUsers();
            setIsModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Users className="text-blue-600" />
                        ユーザー権限管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">SDR-Compliant</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">システムユーザーの役割、基本情報、デフォルト車両の設定を行います</p>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="名前や役割で検索..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <span>ユーザー情報を読み込み中...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        ユーザーが見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">名前</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">役割</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">デフォルト車両</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{user.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{user.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit",
                                            user.role === 'ADMIN'
                                                ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                        )}>
                                            <Shield size={12} />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {user.vehicle_info ? (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Truck size={14} />
                                                {user.vehicle_info}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                            title="プロファイル編集"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="ユーザー設定の変更"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">キャンセル</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !reason}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            変更を適用 (SDR提案)
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {formData.name?.[0]}
                        </div>
                        <div>
                            <div className="font-bold text-slate-700">{formData.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono italic">Account Control Panel</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">表示名</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">役割 (Role)</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="DRIVER">DRIVER (乗務員)</option>
                                <option value="ADMIN">ADMIN (管理者)</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">初期表示車両</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.vehicle_info}
                                onChange={e => setFormData({ ...formData, vehicle_info: e.target.value })}
                            >
                                <option value="">指定なし</option>
                                {vehicles.map(v => (
                                    <option key={v.number} value={v.callsign || v.number}>
                                        {v.callsign} ({v.number})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-purple-600 flex items-center gap-1">
                            <Info size={14} /> 権限変更の目的 (SDR記録)
                        </label>
                        <textarea
                            className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[100px]"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="管理者への昇格や名前修正の理由を入力してください"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
