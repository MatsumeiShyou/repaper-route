import React, { useState } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { REASON_TAXONOMY } from '../logic/constants';

interface SaveReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCommit: (reasonCode: string, reasonText: string) => void;
}

export const SaveReasonModal: React.FC<SaveReasonModalProps> = ({ isOpen, onClose, onCommit }) => {
    const [selectedCode, setSelectedCode] = useState<string>('');
    const [reasonText, setReasonText] = useState<string>('');

    if (!isOpen) return null;

    const selectedTaxonomy = REASON_TAXONOMY.find(t => t.code === selectedCode);
    const isTextRequired = selectedTaxonomy?.requiresText || false;
    const isSubmitDisabled = !selectedCode || (isTextRequired && !reasonText.trim());

    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        onCommit(selectedCode, reasonText.trim());
        // 状態リセット
        setSelectedCode('');
        setReasonText('');
    };

    const handleCancel = () => {
        setSelectedCode('');
        setReasonText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Save size={18} className="text-blue-400" />
                        <h2 className="font-bold">変更の保存と理由の記録</h2>
                    </div>
                    <button onClick={handleCancel} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-3 text-sm text-amber-800">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">SDRモデル（変更の監査ログ記録）</p>
                            <p>理由なきデータの変更は禁止されています。この変更に至った「システム外の事象」や「判断の根拠」を記録してください。</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700 flex justify-between">
                            理由カテゴリ（必須）
                            <span className="text-xs text-red-500 bg-red-50 px-1.5 rounded border border-red-100">必須</span>
                        </label>
                        <select
                            value={selectedCode}
                            onChange={(e) => setSelectedCode(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full bg-white cursor-pointer"
                        >
                            <option value="" disabled>--- 理由を選択してください ---</option>
                            {REASON_TAXONOMY.map(tax => (
                                <option key={tax.code} value={tax.code}>
                                    {tax.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700 flex justify-between">
                            詳細テキスト（具体的な状況等）
                            {isTextRequired ? (
                                <span className="text-xs text-red-500 bg-red-50 px-1.5 rounded border border-red-100">入力必須</span>
                            ) : (
                                <span className="text-xs text-gray-500">任意</span>
                            )}
                        </label>
                        <textarea
                            value={reasonText}
                            onChange={(e) => setReasonText(e.target.value)}
                            placeholder={isTextRequired ? "この理由カテゴリでは詳細の入力が必須です" : "補足事項があれば入力してください"}
                            rows={4}
                            className={`border rounded px-3 py-2 text-sm outline-none resize-none w-full
                                ${isTextRequired && !reasonText.trim() ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50'}
                            `}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className={`px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors
                            ${isSubmitDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
                        `}
                    >
                        <Save size={16} />
                        保存（SDR記録）
                    </button>
                </div>
            </div>
        </div>
    );
};
