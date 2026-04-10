import React, { useState } from 'react';
import { ExceptionReasonMaster } from '../../../types';

interface ExceptionChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        reasonMasterId: string | undefined,
        reasonFreeText: string,
        promoteRequested: boolean
    ) => void;
    reasons: ExceptionReasonMaster[];
}

export const ExceptionChangeModal: React.FC<ExceptionChangeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    reasons
}) => {
    const [selectedReasonId, setSelectedReasonId] = useState<string>('');
    const [freeText, setFreeText] = useState('');
    const [promoteRequested, setPromoteRequested] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Must select 'others' if freeText is main reason, or select something.
        const isOther = selectedReasonId === '' && freeText.trim() !== '';
        const hasSelection = selectedReasonId !== '';

        if (!hasSelection && !isOther) {
            alert('変更理由を選択、または「その他」の場合は理由を入力してください。');
            return;
        }

        onConfirm(
            selectedReasonId || undefined,
            freeText,
            promoteRequested
        );

        // Reset state for next time
        setSelectedReasonId('');
        setFreeText('');
        setPromoteRequested(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
                    <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        確定済み案件の例外変更
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                        この案件は既に確定されています。変更理由は例外ログとして追記記録されます。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Reason Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            変更の理由 <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {reasons.map((reason) => (
                                <label
                                    key={reason.id}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedReasonId === reason.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <input
                                        type="radio"
                                        name="reasonMaster"
                                        value={reason.id}
                                        checked={selectedReasonId === reason.id}
                                        onChange={(e) => setSelectedReasonId(e.target.value)}
                                        className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-900 font-medium">
                                        {reason.label}
                                    </span>
                                </label>
                            ))}
                            {/* "Others" option explicitly clear */}
                            <label
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedReasonId === '' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <input
                                    type="radio"
                                    name="reasonMaster"
                                    value=""
                                    checked={selectedReasonId === ''}
                                    onChange={(e) => setSelectedReasonId(e.target.value)}
                                    className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <span className="ml-3 text-sm text-gray-900 font-medium">
                                    その他（自由記述）
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Free Text Input (always available, but required if 'Others' is selected) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            詳細（自由記述） {selectedReasonId === '' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm resize-none"
                            rows={3}
                            placeholder="詳細な理由や特記事項を入力してください..."
                            value={freeText}
                            onChange={(e) => setFreeText(e.target.value)}
                        />

                        {/* Promote to Master Request */}
                        {selectedReasonId === '' && freeText.trim().length > 0 && (
                            <div className="flex items-start mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800 border border-blue-100">
                                <div className="flex items-center h-5">
                                    <input
                                        id="promote"
                                        name="promote"
                                        type="checkbox"
                                        checked={promoteRequested}
                                        onChange={(e) => setPromoteRequested(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-2">
                                    <label htmlFor="promote" className="font-medium cursor-pointer">
                                        この理由を選択肢（マスタ）に追加申請する
                                    </label>
                                    <p className="text-xs text-blue-600 mt-1">
                                        ※管理者が承認すると、次回以降の選択肢に表示されるようになります。
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            理由を記録して変更
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
