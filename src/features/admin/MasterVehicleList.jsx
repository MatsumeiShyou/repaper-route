import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Search, X, Loader2, Save, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function MasterVehicleList() {
    const { currentUser } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
        callsign: '', // Added
        max_payload: '',
        fuel_type: '軽油',
        vehicle_type: 'パッカー'
    });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            // View 'vehicles' (joins master_vehicles & logistics_vehicle_attrs)
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('is_active', true)
                .order('callsign', { ascending: true }) // Sort by callsign
                .order('number', { ascending: true });

            if (error) throw error;
            setVehicles(data || []);
        } catch (e) {
            console.error("Fetch Vehicles Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setSelectedVehicle(null);
        setFormData({
            number: '',
            callsign: '',
            max_payload: '',
            fuel_type: '軽油',
            vehicle_type: 'パッカー'
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (vehicle) => {
        setSelectedVehicle(vehicle);
        setFormData({
            number: vehicle.number || '',
            callsign: vehicle.callsign || '',
            max_payload: vehicle.max_payload || '',
            fuel_type: vehicle.fuel_type || '軽油',
            vehicle_type: vehicle.vehicle_type || 'パッカー'
        });
        setReason('');
        setIsModalOpen(true);
    };

    const handleOpenDelete = (vehicle) => {
        setSelectedVehicle(vehicle);
        setReason('');
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.number || !reason) {
            alert("「車番」と「変更理由」は必須です。");
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = !!selectedVehicle;

            // Core Data (master_vehicles)
            const coreData = {
                number: formData.number,
                callsign: formData.callsign, // Added
                is_active: true
            };

            // Extension Data (logistics_vehicle_attrs)
            const extData = {
                max_payload: formData.max_payload ? parseFloat(formData.max_payload) : null,
                fuel_type: formData.fuel_type,
                vehicle_type: formData.vehicle_type
            };

            // SDR: 専任RPC経由でアトミックに更新（提案・決裁・反映を統合）
            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'vehicles',
                p_id: selectedVehicle?.id || null, // null for INSERT
                p_core_data: coreData,
                p_ext_data: extData,
                p_decision_type: isEdit ? 'MASTER_UPDATE' : 'MASTER_REGISTRATION',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchVehicles();
            setIsModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!reason) {
            alert("削除（アーカイブ）の理由を入力してください。");
            return;
        }

        setIsSubmitting(true);
        try {
            // SDR: 物理削除ではなくアーカイブ。RPC経由で記録
            const { error } = await supabase.rpc('rpc_execute_master_update', {
                p_table_name: 'vehicles',
                p_id: selectedVehicle.id,
                p_core_data: {
                    number: selectedVehicle.number,
                    callsign: selectedVehicle.callsign,
                    is_active: false
                },
                p_ext_data: {
                    max_payload: selectedVehicle.max_payload,
                    fuel_type: selectedVehicle.fuel_type,
                    vehicle_type: selectedVehicle.vehicle_type
                },
                p_decision_type: 'MASTER_ARCHIVE',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            await fetchVehicles();
            setIsDeleteModalOpen(false);
        } catch (e) {
            alert("エラー: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.callsign?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Truck className="text-blue-600" />
                        車両マスタ管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">OS-Compliant Model v1.2</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">基盤OSのマスタ設計に準拠し、物流特有の属性を Extension 層で統合管理します</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold"
                >
                    <Plus size={20} />
                    車両追加
                </button>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="車両名や車番で検索..."
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
                ) : filteredVehicles.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        該当する車両が見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">車両名 (通称)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">正式車番 (License)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">種類 (Ext)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredVehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 font-bold text-lg text-blue-600">{vehicle.callsign || '-'}</td>
                                    <td className="px-6 py-4 font-medium">{vehicle.number}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                                            {vehicle.vehicle_type || '未設定'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(vehicle)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                title="編集"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(vehicle)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                title="削除"
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedVehicle ? "車両マスタ編集 (SDR/Core+Ext)" : "新規車両登録 (SDR/Core+Ext)"}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.number || !reason}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {selectedVehicle ? "更新提案を送信" : "登録提案を送信"}
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Core Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                            <Info size={16} />
                            <span className="text-xs uppercase tracking-widest font-mono">Core Layer (共通基盤)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">車両名 (配車盤表示)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-blue-600"
                                    placeholder="例: 2267PK"
                                    value={formData.callsign}
                                    onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">※現場での通称（例: 2267PK）</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">正式車番 (必須)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="例: 横浜100あ22-67"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">※ナンバープレートの表記</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-slate-800" />

                    {/* Extension Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
                            <Info size={16} />
                            <span className="text-xs uppercase tracking-widest font-mono">Extension Layer (物流拡張)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">車種</label>
                                <select
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    value={formData.vehicle_type}
                                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                >
                                    <option value="パッカー">パッカー車</option>
                                    <option value="平ボディ">平ボディ</option>
                                    <option value="ハイエース">ハイエース</option>
                                    <option value="ウィング">ウィング車</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">最大積載 (kg)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    placeholder="2000"
                                    value={formData.max_payload}
                                    onChange={(e) => setFormData({ ...formData, max_payload: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">燃料種別</label>
                            <select
                                className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                value={formData.fuel_type}
                                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                            >
                                <option value="軽油">軽油</option>
                                <option value="レギュラー">レギュラー</option>
                                <option value="ハイオク">ハイオク</option>
                                <option value="EV">EV</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-slate-800" />

                    {/* SDR Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 font-bold mb-2">
                            <Info size={16} />
                            <span className="text-xs uppercase tracking-widest font-mono">Decision Reason (SDR義務)</span>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">変更理由</label>
                            <textarea
                                className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-purple-500 transition min-h-[80px]"
                                placeholder="登録／内容変更の理由を入力してください"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete (Archive) Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="車両の削除 (アーカイブ)"
                footer={
                    <>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting || !reason}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            削除を実行（アーカイブ記録）
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm leading-relaxed">
                        <AlertTriangle size={20} className="shrink-0 animate-pulse" />
                        <p>
                            <strong>重要:</strong> 車両「{selectedVehicle?.number}」をアーカイブします。
                            実体は削除されませんが、配車盤での選択肢からは除外されます。
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">削除理由 (Reason)</label>
                        <textarea
                            className="w-full p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition min-h-[100px]"
                            placeholder="廃車のため、等..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
