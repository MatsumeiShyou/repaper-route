import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Search, Loader2, Save, AlertTriangle, Info, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function MasterPointList() {
    const { currentUser } = useAuth();
    const [points, setPoints] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [formData, setFormData] = useState({
        location_id: '',
        name: '',
        address: '',
        contractor_id: '',
        note: ''
    });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPoints();
        fetchContractors();
    }, []);

    const fetchPoints = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_collection_points')
                .select('*, master_contractors(name)')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setPoints(data || []);
        } catch (e) {
            console.error("Fetch Points Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContractors = async () => {
        try {
            const { data, error } = await supabase
                .from('master_contractors')
                .select('contractor_id, name')
                .order('name');
            if (data) setContractors(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenAdd = () => {
        setSelectedPoint(null);
        setFormData({
            location_id: '',
            name: '',
            address: '',
            contractor_id: contractors[0]?.contractor_id || '',
            note: ''
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (point) => {
        setSelectedPoint(point);
        setFormData({
            location_id: point.location_id || '',
            name: point.name || '',
            address: point.address || '',
            contractor_id: point.contractor_id || '',
            note: point.note || ''
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenDelete = (point) => {
        setSelectedPoint(point);
        setReason('');
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !reason) {
            alert("「回収先名」と「変更理由」は必須です。");
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = !!selectedPoint;

            const coreData = {
                location_id: formData.location_id || (isEdit ? selectedPoint.location_id : null),
                name: formData.name,
                address: formData.address,
                contractor_id: formData.contractor_id,
                note: formData.note,
                is_active: true
            };

            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'points',
                p_id: selectedPoint?.location_id || formData.location_id || null,
                p_core_data: coreData,
                p_ext_data: {},
                p_decision_type: isEdit ? 'MASTER_UPDATE' : 'MASTER_REGISTRATION',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchPoints();
            setIsModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!reason) {
            alert("削除の理由を入力してください。");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'points',
                p_id: selectedPoint.location_id,
                p_core_data: {
                    ...selectedPoint,
                    is_active: false
                },
                p_ext_data: {},
                p_decision_type: 'MASTER_ARCHIVE',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchPoints();
            setIsDeleteModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPoints = points.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <MapPin className="text-blue-600" />
                        回収先マスタ管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">SDR-Compliant</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">回収場所、住所、仕入先情報の管理を行います</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold"
                >
                    <Plus size={20} />
                    回収先追加
                </button>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="名称や住所で検索..."
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
                ) : filteredPoints.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        該当する回収先が見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">名称 / 住所</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">仕入先</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredPoints.map(point => (
                                <tr key={point.location_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{point.name}</div>
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <MapPin size={12} /> {point.address || '住所未登録'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm flex items-center gap-2">
                                            <Building2 size={14} className="text-slate-400" />
                                            {point.master_contractors?.name || '未設定'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(point)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(point)}
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
                title={selectedPoint ? "回収先編集" : "回収先登録"}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 rounded-lg">キャンセル</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name || !reason}
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
                            <label className="block text-sm font-bold mb-1">回収先名 (必須)</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">住所</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">仕入先</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.contractor_id}
                                onChange={e => setFormData({ ...formData, contractor_id: e.target.value })}
                            >
                                <option value="">未設定</option>
                                {contractors.map(c => (
                                    <option key={c.contractor_id} value={c.contractor_id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">管理ID (任意 / 空欄で自動生成)</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800 text-xs font-mono"
                                value={formData.location_id}
                                onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                                disabled={!!selectedPoint}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 italic text-slate-400 tracking-wider">NOTE / 備考</label>
                        <textarea
                            className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[60px]"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-purple-600 flex items-center gap-1">
                            <Info size={14} /> 変更理由 (SDR義務)
                        </label>
                        <textarea
                            className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[80px]"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="マスタ更新の目的を入力してください"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="回収先のアーカイブ"
                footer={
                    <>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600">キャンセル</button>
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting || !reason}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                        >
                            アーカイブ実行
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex gap-3 text-sm">
                        <AlertTriangle className="shrink-0" />
                        <p>「{selectedPoint?.name}」を非表示にします。過去の配車記録には影響しません。</p>
                    </div>
                    <textarea
                        className="w-full p-3 border rounded-xl dark:bg-slate-800 shadow-inner"
                        placeholder="削除理由を入力..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}
