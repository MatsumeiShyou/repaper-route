import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, AlertTriangle, Info, User, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { Modal } from './Modal';
import { useMasterCRUD } from '../hooks/useMasterCRUD';
import { useNotification } from '../contexts/NotificationContext';

export const MasterDataLayout = ({ schema, customRenderers = {} }) => {
    const [extraData, setExtraData] = useState({});

    const {
        data: items,
        isLoading,
        searchTerm,
        setSearchTerm,
        isModalOpen,
        setIsModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        selectedItem,
        reason,
        setReason,
        isSubmitting,
        handleOpenAdd: baseOpenAdd,
        handleOpenEdit: baseOpenEdit,
        handleOpenDelete,
        handleSave,
        handleArchive
    } = useMasterCRUD({
        viewName: schema.viewName,
        rpcTableName: schema.rpcTableName,
        searchFields: schema.searchFields,
        initialSort: schema.initialSort
    });

    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchExtraData = async () => {
            const selectFields = schema.fields.filter(f => f.type === 'select' && f.optionsSource);
            for (const field of selectFields) {
                try {
                    const { data } = await supabase.from(field.optionsSource).select('*').order('name');
                    if (data) {
                        setExtraData(prev => ({ ...prev, [field.optionsSource]: data }));
                    }
                } catch (e) { console.error(e); }
            }
        };
        fetchExtraData();
    }, [schema.fields]);

    const handleOpenAdd = () => {
        const initialForm = {};
        schema.fields.forEach(f => {
            if (typeof f.defaultValue === 'function') {
                initialForm[f.name] = f.defaultValue(items);
            } else {
                initialForm[f.name] = f.defaultValue || '';
            }
        });
        setFormData(initialForm);
        baseOpenAdd();
    };

    const handleOpenEdit = (item) => {
        const editForm = {};
        schema.fields.forEach(f => {
            editForm[f.name] = item[f.name] || '';
        });
        setFormData(editForm);
        baseOpenEdit(item);
    };

    const onSave = async (e) => {
        e.preventDefault();
        const { showNotification } = useNotification();

        const missingRequired = schema.fields.filter(f => f.required && !formData[f.name]);
        if (missingRequired.length > 0) {
            showNotification(`「${missingRequired[0].label}」は入力必須項目です。`, "warning");
            return;
        }

        const coreDataFactory = (fd) => {
            const data = { ...fd, is_active: true };
            schema.fields.filter(f => f.type === 'number').forEach(f => {
                data[f.name] = fd[f.name] ? parseFloat(fd[f.name]) : null;
            });
            return data;
        };

        await handleSave(formData, coreDataFactory, null);
    };

    const renderValue = (item, col) => {
        if (customRenderers[col.key]) return customRenderers[col.key](item);

        if (col.type === 'badge') {
            const val = item[col.key];
            if (!val) return '-';
            const colorClass = col.color === 'blue'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-slate-100 text-slate-600';
            return <span className={`${colorClass} px-2 py-1 rounded text-xs font-bold uppercase`}>{val}</span>;
        }

        const val = col.key.split('.').reduce((obj, key) => obj?.[key], item);
        return val || '-';
    };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {schema.title}
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono font-normal tracking-tighter border">UNIFIED-MODEL v3.0</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{schema.description}</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold"
                >
                    <Plus size={20} />
                    新規追加
                </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="検索ワードを入力..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400 font-medium">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span>データを読み込み中...</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic">
                        該当するデータが見つかりません
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {schema.columns.map(col => (
                                    <th key={col.key} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{col.label}</th>
                                ))}
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-all">
                                    {schema.columns.map(col => (
                                        <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                                            {renderValue(item, col)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleOpenEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                            <button onClick={() => handleOpenDelete(item)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
                title={selectedItem ? "マスタ更新設定" : "新規マスタ登録"}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-medium rounded-lg">キャンセル</button>
                        <button onClick={onSave} disabled={isSubmitting || !reason} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold disabled:opacity-30 flex items-center gap-2 shadow-lg shadow-blue-500/20">
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            送信
                        </button>
                    </>
                }
            >
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                        {schema.fields.map(field => (
                            <div key={field.name} className={field.className || ''}>
                                <label className="block text-[11px] font-bold mb-2 text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    {field.label} {field.required && <div className="w-1 h-1 bg-red-400 rounded-full" />}
                                </label>
                                {field.type === 'select' ? (
                                    <select className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" value={formData[field.name]} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}>
                                        <option value="">{field.placeholder || '--- 選択 ---'}</option>
                                        {field.options ? field.options.map(opt => <option key={opt} value={opt}>{opt}</option>) : extraData[field.optionsSource]?.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                ) : (
                                    <input type={field.type} placeholder={field.placeholder || ''} className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" value={formData[field.name]} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-2xl">
                        <label className="block text-[11px] font-bold mb-2 text-purple-600 uppercase tracking-widest flex items-center gap-1"><Info size={14} /> Audit Reason (SDR義務)</label>
                        <textarea className="w-full p-4 bg-white border rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner" value={reason} onChange={e => setReason(e.target.value)} placeholder={schema.audit_hint || "この変更が行われる背景・理由を入力してください"} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};
