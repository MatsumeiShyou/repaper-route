import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Clock, AlertTriangle, X } from 'lucide-react';

export const BoardModals = ({
    modalState,
    onClose,
    onSaveHeader,
    onSaveSplit,
    onDeleteSplit,
    onSaveJob,
    onDeleteJob,
    masterItems = [], // Phase 6: Master Items List
    masterDrivers = [], // Phase 7
    masterVehicles = [], // Phase 7
    customers = [], // Phase 8: Customers for default items
    customerItemDefaults = [], // Phase 8: Default Items
    onDeleteColumn // Phase 7
}) => {
    if (!modalState || !modalState.isOpen) return null;

    // Local state for form handling
    const [formData, setFormData] = useState({});
    const [selectedCustomer, setSelectedCustomer] = useState('');

    useEffect(() => {
        if (modalState.type === 'header') {
            setFormData({
                name: modalState.initialCourseName || '',
                driverName: modalState.initialDriverId || '', // Actually driverName string
                vehicle: modalState.initialVehicle || ''
            });
        } else if (modalState.type === 'split') {
            setFormData({
                name: modalState.initialDriverName || '',
                vehicle: modalState.initialVehicle || ''
            });
        } else if (modalState.type === 'job') {
            setFormData({
                title: modalState.job.title || '',
                startTime: modalState.job.startTime || '',
                duration: modalState.job.duration || 30,
                bucket: modalState.job.bucket || 'Free',
                note: modalState.job.note || '',
                requiredVehicle: modalState.job.requiredVehicle || '',
                items: modalState.job.items || [] // Phase 6
            });
            // Reset customer select when opening new job
            setSelectedCustomer('');
        }
    }, [modalState]);

    const handleSave = () => {
        if (modalState.type === 'header') {
            onSaveHeader(formData.name, formData.driverName, formData.vehicle);
        } else if (modalState.type === 'split') {
            onSaveSplit(formData.name, formData.vehicle);
        } else if (modalState.type === 'job') {
            onSaveJob(modalState.targetId, formData);
        }
    };

    // --- Renders ---

    const renderHeaderEdit = () => (
        <>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Edit3 size={20} /> コース・ドライバー編集
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">コース名</label>
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="例: Aコース"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">担当ドライバー</label>
                    <div className="relative">
                        <select
                            className="w-full border p-2 rounded appearance-none"
                            value={formData.driverName || ''}
                            onChange={e => {
                                const val = e.target.value;
                                // If selecting from master, also try to set default vehicle
                                const driver = masterDrivers.find(d => d.name === val);
                                if (driver && driver.defaultVehicle) {
                                    setFormData(prev => ({ ...prev, driverName: val, vehicle: driver.defaultVehicle }));
                                } else {
                                    setFormData(prev => ({ ...prev, driverName: val }));
                                }
                            }}
                        >
                            <option value="">未割当</option>
                            {masterDrivers.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">担当車両</label>
                    <div className="relative">
                        <select
                            className="w-full border p-2 rounded appearance-none"
                            value={formData.vehicle || ''}
                            onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                        >
                            <option value="">未定</option>
                            {masterVehicles.map(v => {
                                const displayName = v.callsign ? `${v.callsign} (${v.number})` : v.number;
                                const value = v.callsign || v.number;
                                return (
                                    <option key={v.id} value={value}>{displayName}</option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {/* Phase 7: Delete Column Button */}
            {onDeleteColumn && (
                <div className="mt-8 pt-4 border-t">
                    <button
                        onClick={() => {
                            if (window.confirm('このコースを削除してもよろしいですか？（案件が残っている場合は削除できません）')) {
                                onDeleteColumn(modalState.targetId);
                                onClose();
                            }
                        }}
                        className="w-full bg-red-100 text-red-600 p-2 rounded font-bold hover:bg-red-200 transition flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> このコースを削除
                    </button>
                </div>
            )}
        </>
    );

    const renderSplitEdit = () => (
        <>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Edit3 size={20} /> 車両切替ポイント編集
            </h3>
            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-4 font-bold flex items-center gap-2">
                <Clock size={14} /> {modalState.time} からの車両変更
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">担当ドライバー名</label>
                    <input
                        className="w-full border p-2 rounded"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">変更後の車両名</label>
                    <input
                        className="w-full border p-2 rounded"
                        value={formData.vehicle || ''}
                        onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                    />
                </div>
                <button onClick={onDeleteSplit} className="w-full border border-red-200 text-red-600 py-2 rounded font-bold hover:bg-red-50 flex items-center justify-center gap-2 mt-4">
                    <Trash2 size={16} /> 切替ポイントを削除
                </button>
            </div>
        </>
    );

    const renderJobEdit = () => (
        <>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Edit3 size={20} /> 案件詳細編集
            </h3>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">開始時間</label>
                        <input
                            type="time"
                            className="w-full border p-2 rounded font-mono"
                            value={formData.startTime || ''}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">所要時間(分)</label>
                        <input
                            type="number"
                            step="15"
                            className="w-full border p-2 rounded font-mono"
                            value={formData.duration || ''}
                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">案件名</label>
                    <input
                        className="w-full border p-2 rounded font-bold"
                        value={formData.title || ''}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="案件名または顧客名"
                    />
                </div>

                {/* Customer Select (For Default Items) */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">顧客から自動入力</label>
                    <select
                        className="w-full border p-2 rounded bg-blue-50"
                        value={selectedCustomer}
                        onChange={e => {
                            const custId = e.target.value;
                            setSelectedCustomer(custId);
                            if (!custId) return;

                            const cust = customers.find(c => c.id === custId);
                            if (cust) {
                                // Set Title
                                setFormData(prev => ({ ...prev, title: cust.name }));

                                // Set Defaults
                                const defaults = customerItemDefaults.filter(d => d.collection_point_id === custId);
                                if (defaults.length > 0) {
                                    const newItems = defaults.map(d => {
                                        const master = masterItems.find(m => m.id === d.item_id);
                                        return {
                                            itemId: d.item_id,
                                            name: master ? master.name : 'Unknown',
                                            // Default unit is now strictly kg based on master, but fallback could be kg
                                            unit: master ? master.unit : 'kg',
                                            expectedQuantity: 0, // Defaults usually implied? Or 0?
                                            // Ideally default quantity if defined, but schema only links item.
                                            // Let's assume 0 for now.
                                            actualQuantity: 0
                                        };
                                    });
                                    setFormData(prev => ({ ...prev, items: newItems }));
                                }
                            }
                        }}
                    >
                        <option value="">(顧客を選択して自動入力)</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Phase 6: Item Management */}
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-2">回収品目</label>
                    <div className="space-y-2 mb-2">
                        {(formData.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-1.5 rounded border border-gray-200">
                                <span className="text-sm font-bold flex-1">{item.name}</span>
                                <input
                                    type="number"
                                    placeholder="予定"
                                    className="w-16 border rounded p-1 text-right text-sm"
                                    value={item.expectedQuantity ?? ''}
                                    onChange={e => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        const newItems = [...formData.items];
                                        newItems[idx] = { ...newItems[idx], expectedQuantity: val };
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                />
                                <span className="text-xs text-gray-500 w-6">{item.unit}</span>
                                <button
                                    onClick={() => {
                                        const newItems = formData.items.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Logic */}
                    <div className="flex gap-2">
                        <select
                            className="flex-1 border p-1 rounded text-sm"
                            id="newItemSelect"
                        >
                            <option value="">品目追加...</option>
                            {masterItems.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                const select = document.getElementById('newItemSelect');
                                const val = select.value;
                                if (!val) return;
                                const master = masterItems.find(m => m.id === val);
                                if (master) {
                                    // Avoid duplicates? Or allow? Usually allow only unique items per job?
                                    // For now allow simple add, maybe check duplicate if needed.
                                    if (formData.items?.some(i => i.itemId === master.id)) {
                                        alert('既に追加されています');
                                        return;
                                    }
                                    const newItem = {
                                        itemId: master.id,
                                        name: master.name,
                                        unit: master.unit || 'kg',
                                        expectedQuantity: 0,
                                        actualQuantity: 0
                                    };
                                    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
                                    select.value = "";
                                }
                            }}
                            className="bg-blue-100 text-blue-700 px-3 rounded text-sm font-bold hover:bg-blue-200"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">区分 (AM/PM)</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={formData.bucket || 'Free'}
                            onChange={e => setFormData({ ...formData, bucket: e.target.value })}
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                            <option value="Free">Free</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">指定車両</label>
                        <input
                            className="w-full border p-2 rounded"
                            value={formData.requiredVehicle || ''}
                            onChange={e => setFormData({ ...formData, requiredVehicle: e.target.value })}
                            placeholder="指定なし"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">備考</label>
                    <textarea
                        className="w-full border p-2 rounded text-sm"
                        rows={3}
                        value={formData.note || ''}
                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                    />
                </div>

                <button onClick={() => { if (confirm('本当に削除しますか？')) onDeleteJob(modalState.targetId); }} className="w-full border border-red-200 text-red-600 py-2 rounded font-bold hover:bg-red-50 flex items-center justify-center gap-2 mt-2">
                    <Trash2 size={16} /> この案件を削除
                </button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>

                {modalState.type === 'header' && renderHeaderEdit()}
                {modalState.type === 'split' && renderSplitEdit()}
                {modalState.type === 'job' && renderJobEdit()}

                <div className="flex gap-2 pt-6 mt-2 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded font-bold hover:bg-gray-200 transition">キャンセル</button>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 transition shadow-sm">
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};
