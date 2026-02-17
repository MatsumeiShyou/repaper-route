import React, { useState } from 'react';
import {
    Plus,
    Search,
    Edit,
    Archive,
    XCircle,
    X
} from 'lucide-react';
import useMasterCRUD from '../hooks/useMasterCRUD';
import { Modal } from './Modal';
import { MasterSchema, MasterColumn } from '../config/masterSchema';

interface MasterDataLayoutProps {
    schema: MasterSchema;
}

export const MasterDataLayout: React.FC<MasterDataLayoutProps> = ({ schema }) => {
    // 汎用レイアウトなので Record<string, any> として扱う
    const {
        data,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem
    } = useMasterCRUD<Record<string, any>>(schema);

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

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

    const handleEdit = (item: Record<string, any>) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: Record<string, any>) => {
        if (editingItem) {
            await updateItem(editingItem[schema.primaryKey], formData);
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
                                    <tr key={item[schema.primaryKey]} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
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
                                                <button onClick={() => deleteItem(item[schema.primaryKey])} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors">
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
};

function renderCell(item: Record<string, any>, col: MasterColumn) {
    const value = item[col.key];

    // Status Dot Display
    if (col.type === 'status') {
        const isActive = !!value;
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                <span className={isActive ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                    {isActive ? '有効' : '無効'}
                </span>
            </div>
        );
    }

    if (col.type === 'badge') {
        const badgeValue = String(value || '');
        let colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'; // Default fallback

        // スキーマ定義の styleRules があれば適用 (部分一致を含む検索ロジック)
        if (col.styleRules && badgeValue) {
            // 完全一致を優先
            if (col.styleRules[badgeValue]) {
                colorClass = col.styleRules[badgeValue];
            }
            // デフォルト設定がある場合
            else if (col.styleRules['default']) {
                colorClass = col.styleRules['default'];

                // 部分一致の検索 (例: '4tゲート' -> '4t')
                // キーを走査して、値が含まれていれば適用するロジック
                // キーが 'default' 以外で、かつ badgeValue に含まれる場合
                const matchedKey = Object.keys(col.styleRules).find(key =>
                    key !== 'default' && badgeValue.includes(key)
                );
                if (matchedKey) {
                    colorClass = col.styleRules[matchedKey];
                }
            }
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {badgeValue || '-'}
            </span>
        );
    }

    // Default Text with Multi-Row / SubLabel support
    if (col.type === 'multi-row' || col.subLabelKey) {
        return (
            <div className="flex flex-col py-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 leading-none">
                    {value || '-'}
                </span>
                {col.subLabelKey && item[col.subLabelKey] && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-none font-medium">
                        {item[col.subLabelKey]}
                    </span>
                )}
            </div>
        );
    }

    // Tags Display
    if (col.type === 'tags') {
        const tagList = String(value || '').split(',').map(s => s.trim()).filter(Boolean);
        if (tagList.length === 0) return <span className="text-slate-400">-</span>;

        return (
            <div className="flex flex-wrap gap-1 py-1">
                {tagList.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {tag}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <span className="text-slate-600 dark:text-slate-400">
            {value || '-'}
        </span>
    );
}

function MasterForm({ schema, initialData, onSave, onCancel }: {
    schema: MasterSchema,
    initialData: Record<string, any> | null,
    onSave: (data: Record<string, any>) => Promise<void>,
    onCancel: () => void
}) {
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    // 品目マスタのデータを取得するためのフック（タグ選択用）
    const { items: allItems } = useMasterCRUD('items');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleTag = (fieldName: string, tagName: string) => {
        const currentValue = String(formData[fieldName] || '');
        const currentTags = currentValue.split(',').map(s => s.trim()).filter(Boolean);
        let newTags;
        if (currentTags.includes(tagName)) {
            newTags = currentTags.filter(t => t !== tagName);
        } else {
            newTags = [...currentTags, tagName];
        }
        setFormData({ ...formData, [fieldName]: newTags.join(',') });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {schema.fields.map(field => (
                    <div key={field.name} className={`${field.className || ''} flex flex-col`}>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'tags' ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 p-3 min-h-[46px] rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    {String(formData[field.name] || '').split(',').map(s => s.trim()).filter(Boolean).map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold animate-in zoom-in-50">
                                            {tag}
                                            <button type="button" onClick={() => toggleTag(field.name, tag)} className="hover:text-blue-200">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {String(formData[field.name] || '').length === 0 && (
                                        <span className="text-slate-400 text-xs mt-1">下のリストから選択してください</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                                    {allItems.map(item => {
                                        const isSelected = String(formData[field.name] || '').split(',').map(s => s.trim()).includes(item.name);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleTag(field.name, item.name)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSelected
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                                    }`}
                                            >
                                                {item.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : field.type === 'select' ? (
                            <select
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
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
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                value={formData[field.name] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                required={field.required}
                                placeholder={field.placeholder}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    キャンセル
                </button>
                <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                    保存する
                </button>
            </div>
        </form>
    );
}
