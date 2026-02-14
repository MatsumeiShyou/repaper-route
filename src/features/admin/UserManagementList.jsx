import React, { useState, useEffect } from 'react';
import { User, Edit2, Search, Loader2, Save, Info, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Modal } from '../../components/Modal';
import { useMasterCRUD } from '../../hooks/useMasterCRUD';

export default function UserManagementList() {
    const [vehicles, setVehicles] = useState([]);

    const {
        data: users,
        isLoading,
        searchTerm,
        setSearchTerm,
        isModalOpen,
        setIsModalOpen,
        selectedItem: selectedUser,
        reason,
        setReason,
        isSubmitting,
        handleOpenEdit: baseOpenEdit,
        handleSave
    } = useMasterCRUD({
        viewName: 'profiles',
        rpcTableName: 'users',
        searchFields: ['name', 'role'],
        initialSort: { column: 'name', ascending: true }
    });

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        vehicle_info: ''
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const { data } = await supabase.from('master_vehicles').select('callsign').eq('is_active', true).order('callsign');
            if (data) setVehicles(data);
        } catch (e) { console.error(e); }
    };

    const handleOpenEdit = (user) => {
        setFormData({
            name: user.name || '',
            role: user.role || 'operator',
            vehicle_info: user.vehicle_info || ''
        });
        baseOpenEdit(user);
    };

    const onSave = async (e) => {
        e.preventDefault();

        const coreDataFactory = (fd) => ({
            name: fd.name,
            role: fd.role,
            vehicle_info: fd.vehicle_info
        });

        await handleSave(formData, coreDataFactory, null, 'USER_PROFILE_UPDATE');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <User className="text-blue-600" />
                        ユーザー権限管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">SDR-Refined</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">システム利用者の氏名、役割、デフォルト車両の設定を行います</p>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="氏名や役割で検索..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <span>読み込み中...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">該当するユーザーはいません</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">利用者名</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">役割 (Role)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">デフォルト車両</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">編集</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{user.name || '未設定'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-tighter ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                        {user.vehicle_info || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="ユーザー情報編集"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 rounded-lg">キャンセル</button>
                        <button
                            onClick={onSave}
                            disabled={isSubmitting || !reason}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            変更を保存 (SDR)
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">氏名</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">役割</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="operator">Operator (配車担当)</option>
                                <option value="driver">Driver (ドライバー)</option>
                                <option value="admin">Admin (システム管理)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                                <Truck size={14} /> デフォルト車両
                            </label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.vehicle_info}
                                onChange={e => setFormData({ ...formData, vehicle_info: e.target.value })}
                            >
                                <option value="">未指定</option>
                                {vehicles.map(v => (
                                    <option key={v.callsign} value={v.callsign}>{v.callsign}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-purple-600 flex items-center gap-1 font-mono tracking-tighter">
                            <Info size={14} /> REASON_FOR_CHANGE (SDR)
                        </label>
                        <textarea
                            className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[100px]"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="権限/設定変更の理由を入力してください"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
