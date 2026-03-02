import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { TemplateManager } from '../../logic/core/TemplateManager';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, dayOfWeek: number, nthWeek: number | null) => Promise<void>;
    currentDate: Date;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentDate
}) => {
    const [name, setName] = useState(`テンプレート_${currentDate.toISOString().split('T')[0]}`);
    const [dayOfWeek, setDayOfWeek] = useState(TemplateManager.getDayOfWeek(currentDate));
    const [nthWeek, setNthWeek] = useState<number | null>(TemplateManager.getNthWeek(currentDate));
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const nthOptions = [
        { label: '毎週', value: null },
        { label: '第1', value: 1 },
        { label: '第2', value: 2 },
        { label: '第3', value: 3 },
        { label: '第4', value: 4 },
        { label: '第5', value: 5 },
    ];

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave(name, dayOfWeek, nthWeek);
            onClose();
        } catch (error) {
            console.error('Template save error:', error);
            alert('テンプレートの保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[480px] rounded-xl border border-white/20 bg-slate-900 p-6 shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/10">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Save className="h-5 w-5 text-emerald-400" />
                        テンプレートとして登録
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">テンプレート名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="例: 第1月曜基本ルート"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">適用曜日</label>
                            <select
                                value={dayOfWeek}
                                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-white transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {days.map((d, i) => (
                                    <option key={i} value={i}>{d}曜日</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">周期設定</label>
                            <select
                                value={nthWeek === null ? 'null' : nthWeek}
                                onChange={(e) => setNthWeek(e.target.value === 'null' ? null : parseInt(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-white transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {nthOptions.map((opt) => (
                                    <option key={opt.label} value={opt.value === null ? 'null' : opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="rounded-lg bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-400/90 border border-emerald-500/20">
                        提示されている配車盤の全案件、担当運転手、および休憩時間の配置が、指定された周期の「正典（テンプレート）」として保存されます。
                    </p>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02] disabled:opacity-50 disabled:grayscale"
                    >
                        {isSaving ? '保存中...' : 'テンプレート登録'}
                    </button>
                </div>
            </div>
        </div>
    );
};
