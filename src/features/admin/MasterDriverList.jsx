import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Search, Loader2, Save, AlertTriangle, Info, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function MasterDriverList() {
    const { currentUser } = useAuth();
    const [drivers, setDrivers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [formData, setFormData] = useState({
        driver_name: '',
        display_order: 999,
        user_id: ''
    });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDrivers();
        fetchProfiles();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        try {
            // No is_active in drivers yet, but we'll use display_order to hide? 
            // Actually drivers table doesn't have is_active from seed. 
            // We should add it if we want archiving. For now, we'll just show all.
            const { data, error } = await supabase
                .from('drivers')
                .select('*, profiles(name, role)')
                .order('display_order', { ascending: true })
                .order('driver_name', { ascending: true });

            if (error) throw error;
            setDrivers(data || []);
        } catch (e) {
            console.error("Fetch Drivers Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .order('name');
            if (data) setProfiles(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenAdd = () => {
        setSelectedDriver(null);
        setFormData({
            driver_name: '',
            display_order: (drivers.length + 1) * 10,
            user_id: ''
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (driver) => {
        setSelectedDriver(driver);
        setFormData({
            driver_name: driver.driver_name || '',
            display_order: driver.display_order || 999,
            user_id: driver.user_id || ''
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenDelete = (driver) => {
        setSelectedDriver(driver);
        setReason('');
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.driver_name || !reason) {
            alert("「ドライバー名」と「変更理由」は必須です。");
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = !!selectedDriver;

            const coreData = {
                driver_name: formData.driver_name,
                display_order: parseInt(formData.display_order),
                user_id: formData.user_id || null
            };

            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'drivers',
                p_id: selectedDriver?.id || null, // Drivers uses TEXT UUID from gen_random_uuid
                p_core_data: coreData,
                p_ext_data: {},
                p_decision_type: isEdit ? 'MASTER_UPDATE' : 'MASTER_REGISTRATION',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchDrivers();
            setIsModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        alert("ドライバーの削除は現在システム保護のため制限されています。表示順を下げるか、ユーザー連携を解除してください。");
        setIsDeleteModalOpen(false);
    };

    const filteredDrivers = drivers.filter(d =>
        d.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <UserCheck className="text-blue-600" />
                        ドライバーマスタ管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">SDR-Compliant</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">乗務員名、表示順、ユーザーアカウント連携の管理を行います</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold"
                >
                    <Plus size={20} />
                    ドライバー追加
                </button>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="ドライバー名で検索..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <span>データを読み込み中...</span>
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        該当するドライバーが見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">表示順</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ドライバー名</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">連携ユーザー</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredDrivers.map(driver => (
                                <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 font-mono text-gray-400">{driver.display_order}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-lg">{driver.driver_name}</td>
                                    <td className="px-6 py-4">
                                        {driver.profiles ? (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                <User size={14} />
                                                {driver.profiles.name}
                                                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded uppercase tracking-tighter">
                                                    {driver.profiles.role === 'ADMIN' ? '管理' : '乗務'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 italic">未連携</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(driver)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(driver)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDriver ? "ドライバー編集" : "ドライバー登録"}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 rounded-lg">キャンセル</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.driver_name || !reason}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            送信
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1 font-sans text-slate-700">ドライバー名 (必須)</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800 text-xl font-bold"
                                value={formData.driver_name}
                                onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-slate-500">表示順</label>
                            <input
                                type="number"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.display_order}
                                onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-emerald-600">連携ユーザーアカウント</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.user_id}
                                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                            >
                                <option value="">連携しない (未選択)</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-purple-600 flex items-center gap-1">
                            <Info size={14} /> 変更理由 (SDR監査)
                        </label>
                        <textarea
                            className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[100px]"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="新規登録や連携変更の理由を入入力してください"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
