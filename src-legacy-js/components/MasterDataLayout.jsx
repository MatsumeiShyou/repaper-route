import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Archive,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import useMasterCRUD from '../hooks/useMasterCRUD';
import Modal from './Modal';

/**
 * 汎用マスタ管理レイアウト
 * masterSchema.js の定義に従い、リスト表示、検索、作成、編集、アーカイブを行う
 */
export default function MasterDataLayout({ schema }) {
    const {
        data,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem, // Archive logic usually
        refresh
    } = useMasterCRUD(schema);

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // 検索フィルタリング
    const filteredData = data.filter(item => {
        if (!searchQuery) return true;
        return schema.searchFields.some(field =>
            String(item[field] || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = async (formData) => {
        if (editingItem) {
            await updateItem(editingItem.id, formData);
        } else {
            await createItem(formData);
        }
        setIsModalOpen(false);
    };

    if (error) return (
        <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200 m-6 flex items-center gap-3">
            <XCircle />
            <span>エラーが発生しました: {error.message}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header Area */}
            <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            {schema.title}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{schema.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            新規登録
                        </button>
                    </div>
                </div>
            </header>

            {/* List Area */}
            <main className="flex-1 overflow-y-auto p-6">
                {loading && data.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    {schema.columns.map(col => (
                                        <th key={col.key} className="px-6 py-4">{col.label}</th>
                                    ))}
                                    <th className="px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        {schema.columns.map(col => (
                                            <td key={col.key} className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}`}>
                                                {renderCell(item, col)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors">
                                                    <Archive size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length === 0 && (
                            <div className="py-20 text-center">
                                <p className="text-slate-400 text-sm">データが見つかりませんでした</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? `${schema.title}を編集` : `新しい${schema.title.replace('管理', '')}を追加`}
            >
                <MasterForm
                    schema={schema}
                    initialData={editingItem}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

function renderCell(item, col) {
    if (col.type === 'badge') {
        const value = item[col.key];

        // プレミアムな車種別色分けロジック
        let colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'; // Default

        if (value) {
            if (value.includes('10t')) {
                colorClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            } else if (value.includes('4t')) {
                colorClass = 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
            } else if (value.includes('待機')) {
                colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            }
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {value || '-'}
            </span>
        );
    }

    if (col.type === 'multi-row') {
        return (
            <div className="flex flex-col py-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                    {item[col.key] || '-'}
                </span>
                {col.subKey && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {item[col.subKey] || ''}
                    </span>
                )}
            </div>
        );
    }

    // Fallback simple text
    return item[col.key] || '-';
}

function MasterForm({ schema, initialData, onSave, onCancel }) {
    const [formData, setFormData] = useState(initialData || {});

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {schema.fields.map(field => (
                    <div key={field.name} className={field.className}>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                                value={formData[field.name] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                required={field.required}
                            >
                                <option value="">選択してください</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                                value={formData[field.name] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                required={field.required}
                                placeholder={field.placeholder}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                    キャンセル
                </button>
                <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                    保存する
                </button>
            </div>
        </form>
    );
}
