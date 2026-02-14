import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Loader2, Save, AlertTriangle, Info } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useMasterCRUD } from '../../hooks/useMasterCRUD';

export default function MasterItemList() {
    const {
        data: items,
        isLoading,
        searchTerm,
        setSearchTerm,
        isModalOpen,
        setIsModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        selectedItem: selectedItem,
        reason,
        setReason,
        isSubmitting,
        handleOpenAdd: baseOpenAdd,
        handleOpenEdit: baseOpenEdit,
        handleOpenDelete,
        handleSave,
        handleArchive
    } = useMasterCRUD({
        viewName: 'master_items',
        rpcTableName: 'items',
        searchFields: ['name'],
        initialSort: { column: 'display_order', ascending: true }
    });

    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        display_order: 10
    });

    const handleOpenAdd = () => {
        const nextOrder = (items.length + 1) * 10;
        setFormData({
            name: '',
            unit: 'kg',
            display_order: nextOrder
        });
        baseOpenAdd();
    };

    const handleOpenEdit = (item) => {
        setFormData({
            name: item.name || '',
            unit: item.unit || 'kg',
            display_order: item.display_order || 0
        });
        baseOpenEdit(item);
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            alert("「品目名」は必須です。");
            return;
        }

        const coreDataFactory = (fd) => ({
            name: fd.name,
            unit: fd.unit,
            display_order: parseInt(fd.display_order),
            is_active: true
        });

        await handleSave(formData, coreDataFactory, null);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Package className="text-blue-600" />
                        品目マスタ管理
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal">SDR-Refined</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">回収品目、単位、表示順の管理を行います</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold"
                >
                    <Plus size={20} />
                    品目追加
                </button>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="品目名で検索..."
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
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        該当する品目が見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">表示順</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">品目名</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">単位</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 font-mono text-gray-400">{item.display_order}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                                            {item.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(item)}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedItem ? "品目編集" : "品目登録"}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 rounded-lg">キャンセル</button>
                        <button
                            onClick={onSave}
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
                        <div>
                            <label className="block text-sm font-bold mb-1">品目名</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">単位</label>
                            <select
                                className="w-full p-3 border rounded-xl dark:bg-slate-800"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="kg">kg</option>
                                <option value="袋">袋</option>
                                <option value="個">個</option>
                                <option value="枚">枚</option>
                                <option value="リットル">リットル</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">表示順 (小さい順)</label>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-xl dark:bg-slate-800"
                            value={formData.display_order}
                            onChange={e => setFormData({ ...formData, display_order: e.target.value })}
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

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="品目のアーカイブ"
                footer={
                    <>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600">キャンセル</button>
                        <button
                            onClick={() => handleArchive()}
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
                        <p>「{selectedItem?.name}」を非表示にします。過去の記録は保持されます。</p>
                    </div>
                    <textarea
                        className="w-full p-3 border rounded-xl dark:bg-slate-800 min-h-[100px]"
                        placeholder="削除理由を入力..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}
