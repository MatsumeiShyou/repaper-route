import React from 'react';
import { Layers, CheckCircle, Database, Undo2, Redo2, Save, Loader2, AlertTriangle, Clipboard } from 'lucide-react';
import { DateDisplay } from './DateDisplay';
import { BoardJob } from '../../../types';

export type BoardMode = 'VIEW_PAST' | 'VIEW_LOCKED' | 'EDIT' | 'CONFIRM';

interface BoardActionBarProps {
    boardMode: BoardMode;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    isSyncing: boolean;
    undo: () => void;
    redo: () => void;
    handleConfirmAll: () => void;
    setIsSaveTemplateModalOpen: (isOpen: boolean) => void;
    handleApplyTemplate: () => void;
    isExpanding: boolean;
    validation: {
        isValid: boolean;
        summary: string;
        hasConfirmedChanges: boolean;
    };
    setIsSaveModalOpen: (isOpen: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    pendingJobs: BoardJob[];
}

export const BoardActionBar: React.FC<BoardActionBarProps> = ({
    boardMode,
    selectedDate,
    setSelectedDate,
    isSyncing,
    undo,
    redo,
    handleConfirmAll,
    setIsSaveTemplateModalOpen,
    handleApplyTemplate,
    isExpanding,
    validation,
    setIsSaveModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    pendingJobs
}) => {
    const hasEditRights = boardMode === 'EDIT' || boardMode === 'CONFIRM';

    return (
        <div className="h-14 flex justify-between items-center px-4 bg-white border-b border-gray-200 shadow-sm z-30">
            <div className="flex items-center gap-4">
                {/* Mode Display Badge (Finite State Machine rendering) */}
                <div className={`px-3 py-1.5 rounded-md border text-sm font-bold flex items-center gap-2 
                    ${boardMode === 'VIEW_PAST'
                        ? 'bg-slate-100 border-slate-300 text-slate-500'
                        : boardMode === 'CONFIRM'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : boardMode === 'VIEW_LOCKED'
                                ? 'bg-slate-50 border-slate-200 text-slate-500'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                    }
                `}>
                    {boardMode === 'VIEW_PAST' ? (
                        <>
                            <Layers size={16} />閲覧モード（過去）
                        </>
                    ) : boardMode === 'CONFIRM' ? (
                        <>
                            <CheckCircle size={16} />確認モード
                        </>
                    ) : boardMode === 'VIEW_LOCKED' ? (
                        <>
                            <AlertTriangle size={16} />閲覧モード（ロック中）
                        </>
                    ) : (
                        <>
                            <Layers size={16} />編集モード
                        </>
                    )}
                </div>

                <DateDisplay
                    selectedDate={selectedDate}
                    onDateChange={(date) => setSelectedDate(date)}
                />

                {isSyncing && <Database size={16} className="text-amber-500 animate-pulse" />}
            </div>

            <div className="flex items-center gap-2">
                {/* Undo / Redo (Wrapped with editMode for 100pt soundness) */}
                <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                    {hasEditRights && (
                        <>
                            <button onClick={undo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="元に戻す">
                                <Undo2 size={18} />
                            </button>
                            <button onClick={redo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="やり直し">
                                <Redo2 size={18} />
                            </button>
                        </>
                    )}
                </div>

                {hasEditRights && (
                    <button
                        onClick={() => handleConfirmAll()}
                        disabled={isSyncing}
                        className={`px-3 h-11 rounded-lg flex items-center gap-2 text-sm font-bold transition-all mr-2
                            ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm'}
                        `}
                        title="全ての計画案件を確定済みにします"
                    >
                        <CheckCircle size={16} />
                        シフト確定
                    </button>
                )}

                {hasEditRights && (
                    <button
                        onClick={() => setIsSaveTemplateModalOpen(true)}
                        className="px-3 h-11 rounded-lg flex items-center gap-2 text-sm font-bold transition-all mr-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm"
                        title="現在の状態をテンプレートとして登録"
                    >
                        <Save size={16} />
                        tpl登録
                    </button>
                )}

                {hasEditRights && (
                    <button
                        onClick={handleApplyTemplate}
                        disabled={isExpanding}
                        className={`px-3 h-11 rounded-lg flex items-center gap-2 text-sm font-bold transition-all mr-2
                            ${isExpanding ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm'}
                        `}
                        title="テンプレートを展開"
                    >
                        {isExpanding ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
                        {isExpanding ? '展開中...' : 'tplから適用'}
                    </button>
                )}

                {hasEditRights && (
                    <button
                        onClick={() => {
                            if (!validation.isValid) {
                                const proceed = window.confirm(
                                    `⚠️ ${validation.summary}\n\nこのまま保存しますか？`
                                );
                                if (!proceed) return;
                            }

                            if (validation.hasConfirmedChanges) {
                                const proceed = window.confirm(
                                    "⚠️ 確定済みの案件が含まれています。変更理由の入力が必要です。\n続行しますか？"
                                );
                                if (!proceed) return;
                            }

                            setIsSaveModalOpen(true);
                        }}
                        disabled={isSyncing}
                        className={`px-4 h-11 rounded-lg flex items-center gap-2 text-sm font-bold transition-all
                            ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-sm'}
                        `}
                    >
                        <Save size={16} />
                        {isSyncing ? '保存中...' : '変更を保存'}
                        {!validation.isValid && (
                            <AlertTriangle size={14} className="text-amber-500 ml-1" />
                        )}
                    </button>
                )}

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`relative w-11 h-11 rounded-lg transition-all flex items-center justify-center
                        ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                    `}
                    title={isSidebarOpen ? 'リストを閉じる' : '未配車リスト'}
                    aria-expanded={isSidebarOpen}
                    aria-controls="pending-job-sidebar"
                >
                    <Clipboard size={18} />
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white shadow-md transition-all duration-300
                        ${pendingJobs.length > 0
                            ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                            : 'bg-slate-300'
                        }
                    `}>
                        {pendingJobs.length}
                    </span>
                </button>
            </div>
        </div>
    );
};
