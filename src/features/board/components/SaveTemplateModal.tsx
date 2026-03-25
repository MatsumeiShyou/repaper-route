import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { TemplateManager } from '../../logic/core/TemplateManager';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, dayOfWeek: number, nthWeek: number | null, absentCount: number, description?: string) => Promise<void>;
    currentDate: Date;
    templateDescriptions?: string[];
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentDate,
    templateDescriptions = []
}) => {
    const [name, setName] = useState('');
    const [lastGeneratedName, setLastGeneratedName] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(TemplateManager.getDayOfWeek(currentDate));
    const [nthWeek, setNthWeek] = useState<number | null>(TemplateManager.getNthWeek(currentDate));
    const [absentCount, setAbsentCount] = useState(0);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const days = ['日', '月', '火', '水', '木', '金', '土'];

    // 【100点品質】非破壊的自動命名ロジック & 日付追従 (亡霊D対策)
    useEffect(() => {
        const newDay = TemplateManager.getDayOfWeek(currentDate);
        const newNth = TemplateManager.getNthWeek(currentDate);
        
        // 日付が変わった場合は曜日・週設定を強制更新（モーダルを開いたまま日付を変えた場合への対応）
        setDayOfWeek(newDay);
        setNthWeek(newNth);

        const weekStr = newNth === null ? '毎週' : `第${newNth}`;
        const dayStr = days[newDay];
        const absentStr = absentCount > 0 ? `_${absentCount}欠員` : '';
        const generated = `${weekStr}${dayStr}曜${absentStr}`;

        // ユーザーが一度も編集していないか、前回の自動生成名と同じ場合のみ更新
        if (!name || name === lastGeneratedName) {
            setName(generated);
            setLastGeneratedName(generated);
        }
    }, [currentDate, absentCount]); // currentDate へのリアクティブ性を確保

    if (!isOpen) return null;

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
            // 保存成功時にリセット
            setName('');
            setAbsentCount(0);
            setDescription('');
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
                        <input
                            id="tplDesc"
                            list="descHistory"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="例: お盆・年末年始用の特別ルート"
                            autoComplete="off"
                        />
                        <datalist id="descHistory">
                            {templateDescriptions.map((desc, idx) => (
                                <option key={idx} value={desc} />
                            ))}
                        </datalist>
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
