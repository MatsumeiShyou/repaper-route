import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit,
    Archive,
    XCircle,
    X,
    Phone,
    Lock,
    ChevronDown,
    Shield,
    Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import useMasterCRUD from '../hooks/useMasterCRUD';
import { Modal } from './Modal';
import { MasterSchema, MasterColumn, MASTER_SCHEMAS } from '../config/masterSchema';

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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                        <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {schema.columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 ${col.className?.includes('sticky') ? 'sticky left-0 bg-slate-50 dark:bg-slate-800 z-30' : ''}`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-right border-b border-slate-200 dark:border-slate-800 sticky right-0 bg-slate-50/90 dark:bg-slate-800/90 z-20 backdrop-blur-md shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)]">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredData.map(item => (
                                    <tr key={item[schema.primaryKey]} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        {schema.columns.map(col => (
                                            <td key={col.key} className={`px-6 py-3 whitespace-nowrap text-sm ${col.className || ''}`}>
                                                {renderCell(item, col)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 text-right sticky right-0 bg-white/90 dark:bg-slate-900/90 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 backdrop-blur-sm shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)]">
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
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {value || '-'}
                    </span>
                    {item.site_contact_phone && (
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Phone size={10} className="stroke-[3]" />
                        </div>
                    )}
                    {item.vehicle_restriction_type && item.vehicle_restriction_type !== 'NONE' && (
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            <Lock size={10} className="stroke-[3]" />
                        </div>
                    )}
                </div>
                {col.subLabelKey && item[col.subLabelKey] && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-none font-medium truncate max-w-[180px]">
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
    const { data: allItems } = useMasterCRUD(MASTER_SCHEMAS.items);

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
                        ) : field.type === 'select' && field.lookup ? (
                            <LookupSelect
                                field={field}
                                value={formData[field.name] || ''}
                                onChange={(val) => setFormData({ ...formData, [field.name]: val })}
                            />
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

            {/* 入場制限セクション（回収先マスタ・編集時のみ） */}
            {schema.rpcTableName === 'master_collection_points' && initialData && (
                <PointAccessSection pointId={initialData.id} />
            )}

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

function LookupSelect({ field, value, onChange }: {
    field: any, // MasterField from schema
    value: string,
    onChange: (val: string) => void
}) {
    const lookupSchema = MASTER_SCHEMAS[field.lookup.schemaKey];
    const { data: options, loading } = useMasterCRUD(lookupSchema);

    return (
        <select
            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white disabled:opacity-50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={loading}
        >
            <option value="">{loading ? '読み込み中...' : '選択してください'}</option>
            {options.map((opt: any) => (
                <option key={opt[field.lookup.valueKey]} value={opt[field.lookup.valueKey]}>
                    {opt[field.lookup.labelKey]}
                </option>
            ))}
        </select>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 入場制限セクション（PointAccessSection）
// 回収先マスタ編集モーダル内に表示。デフォルト折りたたみ（制約なし）。
// ─────────────────────────────────────────────────────────────────────────────
function PointAccessSection({ pointId }: { pointId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [newDriverId, setNewDriverId] = useState('');
    const [newVehicleId, setNewVehicleId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        // 入場制限一覧の取得
        supabase.from('point_access_permissions')
            .select('*, profile:profiles(id, name:raw_user_meta_data->name), vehicle:vehicles(id, callsign, number)')
            .eq('point_id', pointId).eq('is_active', true)
            .then(({ data }) => setPermissions(data || []));
        // ドライバー一覧
        supabase.from('profiles').select('id, raw_user_meta_data').then(({ data }) =>
            setDrivers((data || []).map((d: any) => ({ id: d.id, name: d.raw_user_meta_data?.name || d.id })))
        );
        // 車両一覧
        supabase.from('vehicles').select('id, number, callsign').then(({ data }) =>
            setVehicles(data || [])
        );
    }, [isOpen, pointId]);

    const handleAdd = async () => {
        if (!newDriverId || !newVehicleId) return;
        setSaving(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('point_access_permissions') as any).upsert(
            { point_id: pointId, driver_id: newDriverId, vehicle_id: newVehicleId, is_active: true },
            { onConflict: 'point_id,driver_id' }
        );
        setNewDriverId(''); setNewVehicleId('');
        // 再取得
        const { data } = await (supabase.from('point_access_permissions') as any)
            .select('*, profile:profiles(id, raw_user_meta_data), vehicle:vehicles(id, callsign, number)')
            .eq('point_id', pointId).eq('is_active', true);
        setPermissions(data || []);
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('point_access_permissions') as any).update({ is_active: false }).eq('id', id);
        setPermissions(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="col-span-2 mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {/* トグルヘッダー */}
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <Shield size={16} className={permissions.length > 0 ? 'text-red-500' : 'text-slate-400'} />
                    入場制限設定
                    {permissions.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-bold">
                            {permissions.length}件の制限あり
                        </span>
                    )}
                    {permissions.length === 0 && (
                        <span className="ml-1 text-xs text-slate-400 font-normal">制約なし（デフォルト）</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 展開コンテンツ */}
            {isOpen && (
                <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        特定ドライバーが訪問する際に必須となる車両を登録します。
                        登録のないドライバーは制約なしで配車可能です。
                    </p>

                    {/* 既存ルール一覧 */}
                    {permissions.length > 0 && (
                        <div className="space-y-2">
                            {permissions.map((p: any) => {
                                const driverName = p.profile?.raw_user_meta_data?.name || p.driver_id;
                                const vehicleLabel = p.vehicle ? `${p.vehicle.number}（${p.vehicle.callsign || ''}）` : p.vehicle_id;
                                return (
                                    <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                                        <div className="text-sm">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{driverName}</span>
                                            <span className="text-slate-400 mx-2">→</span>
                                            <span className="font-mono text-red-700 dark:text-red-300 font-bold">{vehicleLabel}</span>
                                            <span className="ml-2 text-xs text-red-600">必須</span>
                                        </div>
                                        <button type="button" onClick={() => handleDelete(p.id)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 新規追加フォーム */}
                    <div className="flex items-center gap-2">
                        <select value={newDriverId} onChange={e => setNewDriverId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                            <option value="">ドライバーを選択</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <span className="text-slate-400 font-bold text-sm">→</span>
                        <select value={newVehicleId} onChange={e => setNewVehicleId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                            <option value="">車両を選択</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.number}（{v.callsign || '-'}）</option>)}
                        </select>
                        <button type="button" onClick={handleAdd} disabled={!newDriverId || !newVehicleId || saving}
                            className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center gap-1">
                            <Plus size={14} />追加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
