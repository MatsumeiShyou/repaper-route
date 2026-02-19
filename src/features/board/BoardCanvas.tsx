import React, { useState, useRef } from 'react';
import {
    Save, Clipboard, RefreshCcw, LogOut, User, Database, Undo2, Redo2
} from 'lucide-react';
import { useBoardData } from './hooks/useBoardData';
import { useBoardDragDrop } from './hooks/useBoardDragDrop';
import { DriverHeader } from './components/DriverHeader';
import { TimeGrid } from './components/TimeGrid';
import { JobLayer } from './components/JobLayer';
import { PendingJobSidebar } from './components/PendingJobSidebar';
import { useAuth } from '../../contexts/AuthProvider';
import { useNotification } from '../../contexts/NotificationContext';
import { BoardJob } from '../../types';

export default function BoardCanvas() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const currentUserId = currentUser?.id;

    const today = new Date();
    const currentDateKey = today.toISOString().split('T')[0];

    // 1. Data & Logic Hook
    const {
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isSyncing,
        editMode, lockedBy, canEditBoard,
        handleSave, recordHistory, undo, redo,
        addColumn, deleteColumn
    } = useBoardData(currentUserId, currentDateKey);

    // 2. Drag & Drop Hook
    const driverColRefs = useRef<Record<string, HTMLElement | null>>({});
    const {
        draggingJobId, draggingSplitId,
        dropPreview, dropSplitPreview,
        dragMousePos, resizingState,
        handleJobMouseDown, handleSplitMouseDown,
        handleResizeStart,
        handleBackgroundMouseMove, handleBackgroundMouseUp
    } = useBoardDragDrop(
        jobs, drivers, splits,
        driverColRefs,
        setJobs, setSplits,
        recordHistory,
        currentUserId
    );

    // 3. UI State
    const [selectedCell, setSelectedCell] = useState<{ driverId: string, time: string } | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingFilter, setPendingFilter] = useState('全て');
    const [modalState, setModalState] = useState<{ isOpen: boolean, type: string | null, targetId?: string | null }>({ isOpen: false, type: null });

    // 4. Handlers
    const openHeaderEdit = (driverId: string) => {
        setModalState({ isOpen: true, type: 'header', targetId: driverId });
    };
    const handleAssignPendingJob = (job: BoardJob) => {
        if (!editMode || !selectedCell) {
            console.warn("[Board] Assign failed: editMode or selectedCell missing", { editMode, selectedCell });
            return;
        }

        console.log("[Board] Assigning job:", job.title, "to", selectedCell);

        const newJob: BoardJob = {
            ...job,
            driverId: selectedCell.driverId,
            timeConstraint: selectedCell.time,
            startTime: selectedCell.time // Added for legacy/internal compat
        };

        setJobs(prev => [...prev, newJob]);
        setPendingJobs(prev => prev.filter(j => j.id !== job.id));
        recordHistory();
        setSelectedCell(null);
        // Keep sidebar open for bulk operations? Let's follow JS behavior: it closes if wanted or stays.
        // Logic ensure 3 is working.
    };

    if (!isDataLoaded) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
                <RefreshCcw className="animate-spin text-blue-500" size={48} />
                <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Board...</p>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col bg-slate-50 relative overflow-hidden select-none"
            onMouseMove={(e) => handleBackgroundMouseMove(e.nativeEvent)}
            onMouseUp={(e) => handleBackgroundMouseUp(e.nativeEvent)}
            onClick={(e) => {
                // background click to deselect
                if (e.target === e.currentTarget) {
                    setSelectedCell(null);
                    setSelectedJobId(null);
                }
            }}
        >
            {/* Header / Action Bar */}
            <div className="h-14 flex justify-between items-center px-4 bg-white border-b border-gray-200 shadow-sm z-30">
                <div className="flex items-center gap-4">
                    {/* タイトルは JS 版にはないが、将来のブラッシュアップ用に控えめに残すか、削除する。
                        指示は「差分をなくす」なので、一旦 JS 版同様にタイトルなし（またはロゴのみ）にする。
                        ここでは一旦削除し、アクションボタンを左側に寄せる構成にする。 */}
                    {isSyncing && <Database size={16} className="text-amber-500 animate-pulse" />}
                </div>

                <div className="flex items-center gap-2">
                    {/* Undo / Redo Buttons */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                        <button
                            onClick={undo}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="元に戻す"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            onClick={redo}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="やり直し"
                        >
                            <Redo2 size={18} />
                        </button>
                    </div>

                    {editMode && (
                        <button
                            onClick={() => handleSave()}
                            disabled={isSyncing}
                            className={`px-4 h-9 rounded-lg flex items-center gap-2 text-sm font-bold transition-all
                                ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-sm'}
                            `}
                        >
                            <Save size={16} />
                            {isSyncing ? '保存中...' : '保存'}
                        </button>
                    )}

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`relative w-9 h-9 rounded-lg transition-all flex items-center justify-center
                            ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                        `}
                        title={isSidebarOpen ? 'リストを閉じる' : '未配車リスト'}
                    >
                        <Clipboard size={18} />
                        {pendingJobs.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                未{pendingJobs.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Scrollable Canvas */}
                <div className="flex-1 overflow-auto relative h-full bg-[#f8fafc]">
                    {/* DriverHeader はスクロール領域内に配置し、sticky で固定 */}
                    <DriverHeader
                        drivers={drivers}
                        onEditHeader={openHeaderEdit}
                        onAddColumn={addColumn}
                        canEditBoard={canEditBoard}
                        stickyTop="top-0"
                    />
                    <div className="relative">
                        <TimeGrid
                            drivers={drivers}
                            jobs={jobs}
                            splits={splits}
                            selectedCell={selectedCell}
                            dropPreview={dropPreview}
                            draggingJobId={draggingJobId}
                            draggingSplitId={draggingSplitId}
                            onCellClick={(driverId, time) => {
                                if (editMode) {
                                    setSelectedCell({ driverId, time });
                                    if (!isSidebarOpen) setIsSidebarOpen(true);
                                } else {
                                    setSelectedCell({ driverId, time });
                                }
                            }}
                            onCellDoubleClick={() => { }}
                            driverColRefs={driverColRefs}
                            isCellOccupied={() => false}
                        />
                        <JobLayer
                            jobs={jobs}
                            splits={splits}
                            drivers={drivers}
                            draggingJobId={draggingJobId}
                            draggingSplitId={draggingSplitId}
                            dropSplitPreview={dropSplitPreview}
                            resizingState={resizingState}
                            onJobMouseDown={handleJobMouseDown}
                            onSplitMouseDown={handleSplitMouseDown}
                            onResizeStart={handleResizeStart}
                            onJobClick={(id) => setSelectedJobId(id)}
                            selectedJobId={selectedJobId}
                            dragMousePos={dragMousePos}
                            dropPreview={dropPreview}
                        />
                    </div>
                </div>

                <div
                    className={`
                        absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-200
                        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    <PendingJobSidebar
                        pendingJobs={pendingJobs}
                        pendingFilter={pendingFilter}
                        setPendingFilter={setPendingFilter}
                        selectedCell={selectedCell}
                        selectedJobId={selectedJobId}
                        onAddJob={handleAssignPendingJob}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </div>
            </div>

            {/* Status Footer */}
            <div className="h-8 px-4 bg-slate-900 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-6 text-slate-500">
                <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${editMode ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    {editMode ? 'Edit Mode Active' : 'Read Only View'}
                </span>
                <span>Sanctuary Engine v3.0.0-ts</span>
                <span className="ml-auto">Connected to Hub Layer</span>
            </div>
        </div>
    );
}
