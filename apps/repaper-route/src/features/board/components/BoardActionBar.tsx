import React from 'react';
import { Layers, CheckCircle, Database, Undo2, Redo2, Save, AlertTriangle, Clipboard, Cloud } from 'lucide-react';
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
    validation: {
        isValid: boolean;
        summary: string;
        hasConfirmedChanges: boolean;
    };
    setIsSaveModalOpen: (isOpen: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    pendingJobs: BoardJob[];
    currentUser: any;
}

export const BoardActionBar: React.FC<BoardActionBarProps> = ({
    boardMode,
    selectedDate,
    setSelectedDate,
    isSyncing,
    undo,
    redo,
    handleConfirmAll,
    validation,
    setIsSaveModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    pendingJobs,
    currentUser
}) => {
    const hasEditRights = boardMode === 'EDIT' || boardMode === 'CONFIRM';

    return (
        <div className="h-14 flex justify-between items-center px-4 bg-white border-b border-gray-200 shadow-sm z-30">
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Mode Display Badge (Finite State Machine rendering) */}
                <div className={`px-3 py-1.5 rounded-md border text-sm font-bold flex items-center gap-2 flex-shrink-0
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

                <div className="flex-shrink-0">
                    <DateDisplay
                        selectedDate={selectedDate}
                        onDateChange={(date) => setSelectedDate(date)}
                        userRole={currentUser?.role}
                    />
                </div>

                <div className="w-5 flex justify-center flex-shrink-0">
                    {isSyncing && (
                        <Database size={16} className="text-amber-500 animate-pulse" />
                    )}
                </div>
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
                        title="この内容で決定し、ロックします。後からの変更には例外操作が必要になります。"
                    >
                        <CheckCircle size={16} />
                        確定
                    </button>
                )}

                {hasEditRights && (
                    <div
                        className={`px-4 h-11 rounded-lg flex items-center gap-2 text-sm font-bold transition-all border
                            ${isSyncing 
                                ? 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'}
                        `}
                        title={isSyncing ? "サーバーに同期中..." : "サーバーと同期済み（自動保存）"}
                    >
                        {isSyncing ? <Cloud size={16} /> : <CheckCircle size={16} />}
                        {isSyncing ? '同期中...' : '同期済み'}
                        {!validation.isValid && (
                            <AlertTriangle size={14} className="text-amber-500 ml-1" />
                        )}
                    </div>
                )}

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`relative w-11 h-11 rounded-lg transition-all flex items-center justify-center
                        ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                    `}
                    title={isSidebarOpen ? 'リストを閉じる' : '未配車リスト（一時保存された内容を元に自動割付できます）'}
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
