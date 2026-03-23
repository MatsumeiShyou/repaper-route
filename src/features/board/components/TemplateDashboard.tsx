import React, { useState, useEffect } from 'react';
import { 
    Layout, X, Users, Calendar, 
    Play, Trash2, Search, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { Database } from '../../../types/database.types';
import { clsx } from 'clsx';

type Template = Database['public']['Tables']['board_templates']['Row'];

interface TemplateDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (templateId: string) => Promise<void>;
}

export const TemplateDashboard: React.FC<TemplateDashboardProps> = ({
    isOpen,
    onClose,
    onApply
}) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterDay, setFilterDay] = useState<number | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const days = ['日', '月', '火', '水', '木', '金', '土'];

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('board_templates')
                .select('*')
                .order('updated_at', { ascending: false });

            if (data) setTemplates(data);
            if (error) throw error;
        } catch (err) {
            console.error('[TemplateDashboard] Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('このテンプレートを削除してもよろしいですか？')) return;

        try {
            const { error } = await supabase.from('board_templates').delete().eq('id', id);
            if (error) throw error;
            setTemplates(prev => prev.filter(t => t.id !== id));
            if (selectedTemplateId === id) setSelectedTemplateId(null);
        } catch (err) {
            alert('削除に失敗しました');
        }
    };

    const filteredTemplates = filterDay !== null 
        ? templates.filter(t => t.day_of_week === filterDay)
        : templates;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex flex-col bg-slate-950/90 backdrop-blur-xl transition-all duration-300">
            {/* Header */}
            <header className="flex h-20 items-center justify-between border-b border-white/10 px-8 bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Layout className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">テンプレート管理</h2>
                        <p className="text-sm text-slate-400">全工程の骨格データを管理・適用します</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1 border border-white/5">
                        <button 
                            onClick={() => setFilterDay(null)}
                            className={clsx(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                filterDay === null ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            すべて
                        </button>
                        {days.map((d, i) => (
                            <button 
                                key={i}
                                onClick={() => setFilterDay(i)}
                                className={clsx(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    filterDay === i ? "bg-emerald-500 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={onClose}
                        className="ml-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-slate-500">
                        <Search className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-lg">一致するテンプレートがありません</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredTemplates.map((tpl) => (
                            <div 
                                key={tpl.id}
                                onClick={() => setSelectedTemplateId(tpl.id)}
                                className={clsx(
                                    "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
                                    selectedTemplateId === tpl.id 
                                        ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/50" 
                                        : "border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900"
                                )}
                            >
                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-white/5">
                                                {tpl.nth_week ? `第${tpl.nth_week}` : "毎週"} {days[tpl.day_of_week]}曜
                                            </span>
                                            {tpl.absent_count > 0 && (
                                                <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                                                    欠員{tpl.absent_count}名
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                                        {tpl.name}
                                    </h3>
                                    
                                    <p className="mb-6 line-clamp-2 min-h-[3rem] text-sm text-slate-400">
                                        {tpl.description || "このテンプレートには説明がありません。"}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>構成済み</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => handleDelete(tpl.id, e)}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="削除"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onApply(tpl.id);
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                                            >
                                                <Play className="h-3.5 w-3.5 fill-current" />
                                                適用
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={clsx(
                                    "absolute bottom-0 left-0 h-1 transition-all duration-300",
                                    selectedTemplateId === tpl.id ? "w-full bg-emerald-500" : "w-0 bg-slate-700"
                                )} />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer / Stats (Optional) */}
            <footer className="h-14 border-t border-white/10 bg-slate-900/80 px-8 flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>登録済み: {templates.length}件</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                        <span>展開時、当日の要員不足は自動的に「未割当」へ退避されます</span>
                    </div>
                </div>
            </footer >
        </div >
    );
};
