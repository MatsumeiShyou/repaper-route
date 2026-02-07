import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ReasonModal = ({ isOpen, message, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason(''); // Reset after submit
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-yellow-200 transform transition-all scale-100">
                {/* Header */}
                <div className="bg-yellow-50 px-6 py-4 flex items-center justify-between border-b border-yellow-100">
                    <div className="flex items-center gap-2 text-yellow-700 font-bold text-lg">
                        <AlertTriangle size={24} className="text-yellow-600" />
                        <span>制約違反の確認</span>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-sm font-medium">
                        {message}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            配置理由を入力してください <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 min-h-[100px] resize-none text-sm transition-all"
                            placeholder="例: お客様からの強い要望により時間外対応"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="px-6 py-2 text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-all flex items-center gap-2"
                    >
                        <span>強制配置する</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
