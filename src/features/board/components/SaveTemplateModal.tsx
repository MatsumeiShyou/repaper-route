import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { TemplateManager } from '../../logic/core/TemplateManager';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, dayOfWeek: number, nthWeek: number | null, absentCount: number, description?: string) => Promise<void>;
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
    const [absentCount, setAbsentCount] = useState(0);
    const [description, setDescription] = useState('');
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
            await onSave(name, dayOfWeek, nthWeek, absentCount, description);
            onClose();
        } catch (error) {
            console.error('Template save error:', error);
            // 実際のUI通知は onSave (useBoardData) 側で行われるため、ここでは alert を出さない
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
                        <label htmlFor="tplName" className="mb-2 block text-sm font-medium text-slate-300">テンプレート名</label>
                        <input
                            id="tplName"
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
                            <label htmlFor="tplDay" className="mb-2 block text-sm font-medium text-slate-300">適用曜日</label>
                            <select
                                id="tplDay"
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
                            <label htmlFor="tplCycle" className="mb-2 block text-sm font-medium text-slate-300">周期設定</label>
                            <select
                                id="tplCycle"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tplAbsent" className="mb-2 block text-sm font-medium text-slate-300">欠員想定数</label>
                            <input
                                id="tplAbsent"
                                type="number"
                                min="0"
                                max="10"
                                value={absentCount}
                                onChange={(e) => setAbsentCount(parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-white transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tplDesc" className="mb-2 block text-sm font-medium text-slate-300">備考・説明</label>
                        <textarea
                            id="tplDesc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="例: お盆・年末年始用の特別ルート"
                        />
                    </div>

                    <p className="rounded-lg bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-400/90 border border-emerald-500/20">
                        提示されている配車盤の各案件を「骨格データ（誰がどの車で行くかを含まない純粋な仕事内容）」としてテンプレート保存します。展開時は、当日の出勤メンバーに対して自動的に割り当てが行われます。
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
