import React, { useState, useMemo } from 'react';
import { X, ChevronRight, AlertCircle, PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DiffItem, TemplateDiffCalculator } from '../../logic/core/TemplateDiffCalculator';
import { BoardJob as Job } from '../../../types';

interface TemplateMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newJobs: Partial<Job>[]) => Promise<void>;
  diffItems: DiffItem[];
  templateName: string;
}

export const TemplateMergeModal: React.FC<TemplateMergeModalProps> = ({
  isOpen,
  onClose,
  onApply,
  diffItems,
  templateName
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Group diffs for Unified View
  const groups = useMemo(() => {
    const added = diffItems.filter((d) => d.type === 'added');
    const removed = diffItems.filter((d) => d.type === 'removed');
    const modified = diffItems.filter((d) => d.type === 'modified');
    return { added, removed, modified };
  }, [diffItems]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const newJobs = TemplateDiffCalculator.merge(diffItems, selectedIds);
      await onApply(newJobs);
      onClose();
    } catch (error) {
      console.error('Merge apply error:', error);
      alert('テンプレートの更新に失敗しました。');
    } finally {
      setIsApplying(false);
    }
  };

  const renderDiffLine = (item: DiffItem) => {
    const isSelected = selectedIds.includes(item.id);
    const job = item.actualJob || item.originalJob;
    const title = job?.title || '（名称不明）';

    return (
      <div
        key={item.id}
        onClick={() => toggleSelection(item.id)}
        className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200 ${
          isSelected 
            ? 'border-emerald-500/50 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/20' 
            : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
        }`}
      >
        <div className="pt-1">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md border text-white transition-all ${
            isSelected 
              ? 'bg-emerald-500 border-emerald-500 scale-110' 
              : 'border-white/20 bg-slate-800'
          }`}>
            {isSelected && <CheckCircle2 className="h-4 w-4" />}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100">{title}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{job?.location_id}</span>
              {item.type === 'added' && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">追加</span>}
              {item.type === 'removed' && <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">削除</span>}
              {item.type === 'modified' && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">変更</span>}
            </div>
          </div>

          {item.type === 'modified' && (
            <div className="rounded-lg bg-black/20 p-3 text-xs space-y-1.5 border border-white/5">
              {item.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-400">
                  <span className="w-20 font-medium text-slate-500">{detail.field}:</span>
                  <span className="text-rose-400 line-through opacity-70">{String(detail.oldValue || 'なし')}</span>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                  <span className="font-bold text-emerald-400">{String(detail.newValue || 'なし')}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-[11px] text-slate-500 flex gap-3">
             <span>{job?.visitSlot || '全日'}</span>
             <span>{job?.duration}分</span>
             {job?.requiredVehicle && <span className="text-amber-400/80">{job.requiredVehicle}</span>}
          </div>
        </div>
      </div>
    );
  };

  const hasChanges = diffItems.some(d => d.type !== 'unchanged');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all">
      <div className="flex max-h-[90vh] w-[640px] flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl ring-1 ring-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <RefreshCw className={`h-5 w-5 text-amber-500 ${isApplying ? 'animate-spin' : ''}`} />
              テンプレート差分マージ
            </h3>
            <p className="text-xs text-slate-400">
              既存テンプレ: <span className="font-semibold text-emerald-400">{templateName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {!hasChanges ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-emerald-500/10 p-4 border border-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <p className="text-slate-300 font-medium">テンプレートとの差分はありません</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-200/80">
                  本日の配車実績とテンプレートの差異を抽出しました。**次回以降の「標準」として定着させたい変更内容**だけを以下から選択してください。選択されなかった項目は元のテンプレート設定が維持されます。
                </p>
              </div>

              {/* Added */}
              {groups.added.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <PlusCircle className="h-4 w-4" />
                    新しく追加された案件 ({groups.added.length})
                  </h4>
                  <div className="space-y-2">
                    {groups.added.map(renderDiffLine)}
                  </div>
                </div>
              )}

              {/* Modified */}
              {groups.modified.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <RefreshCw className="h-4 w-4" />
                    条件が変更された案件 ({groups.modified.length})
                  </h4>
                  <div className="space-y-2">
                    {groups.modified.map(renderDiffLine)}
                  </div>
                </div>
              )}

              {/* Removed */}
              {groups.removed.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <MinusCircle className="h-4 w-4" />
                    削除された案件 ({groups.removed.length})
                  </h4>
                  <div className="space-y-2">
                    {groups.removed.map(renderDiffLine)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-6 bg-slate-900/50">
          <div className="text-xs text-slate-500">
            {selectedIds.length} 個の変更を適用対象として選択中
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              閉じる
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || !hasChanges}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
            >
              {isApplying ? '更新中...' : 'テンプレートに反映する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
