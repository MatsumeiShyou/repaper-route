import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Clock, AlertTriangle, X } from 'lucide-react';

export const BoardModals = ({
    modalState,
    onClose,
    onSaveHeader,
    onSaveSplit,
    onDeleteSplit,
    onSaveJob,
    onDeleteJob
}) => {
    if (!modalState || !modalState.isOpen) return null;

    // Local state for form handling
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (modalState.type === 'header') {
            setFormData({
                name: modalState.initialDriverName || '',
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
                requiredVehicle: modalState.job.requiredVehicle || ''
            });
        }
    }, [modalState]);

    const handleSave = () => {
        if (modalState.type === 'header') {
            onSaveHeader(formData.name, formData.vehicle);
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
                    <label className="block text-xs font-bold text-gray-500 mb-1">ドライバー名</label>
                    <input
                        className="w-full border p-2 rounded"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">車両名</label>
                    <input
                        className="w-full border p-2 rounded"
                        value={formData.vehicle || ''}
                        onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                    />
                </div>
            </div>
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
                    />
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
