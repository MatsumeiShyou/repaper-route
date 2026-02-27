import { useState, useRef } from 'react';

import {
    Save, Clipboard, RefreshCcw, Database, Undo2, Redo2
} from 'lucide-react';
import { useBoardData } from './hooks/useBoardData';
import { useBoardDragDrop } from './hooks/useBoardDragDrop';
import { useMasterData } from './hooks/useMasterData';

import { DriverHeader } from './components/DriverHeader';
import { TimeGrid } from './components/TimeGrid';
import { JobLayer } from './components/JobLayer';
import { PendingJobSidebar } from './components/PendingJobSidebar';
import { useAuth } from '../../contexts/AuthProvider';
import { BoardJob, BoardDriver } from '../../types';
import HeaderEditModal from './components/HeaderEditModal';
import { SaveReasonModal } from './components/SaveReasonModal';
import { AddJobModal } from './components/AddJobModal';

export default function BoardCanvas() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();

    // 0. Master Data (Parallel Load)
    const {
        customers: masterPoints,
        vehicles: masterVehicles,
        isLoading: masterLoading
    } = useMasterData();

    // 1. Data & Logic Hook
    const today = new Date();
    const currentDateKey = today.toISOString().split('T')[0];

    const {
        masterDrivers,
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isSyncing,
        editMode, canEditBoard,
        handleSave, recordHistory, undo, redo,
        addColumn
    } = useBoardData(currentUser, currentDateKey);

    // 2. Drag & Drop Hook
    const driverColRefs = useRef<Record<string, HTMLElement | null>>({});
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const {
        draggingJobId, draggingSplitId,
        dropPreview, dropSplitPreview,
        resizingState,
        handleJobMouseDown, handleSplitMouseDown,
        handleResizeStart,
        handleBackgroundMouseMove, handleBackgroundMouseUp
    } = useBoardDragDrop(
        jobs, drivers, splits,
        driverColRefs,
        gridContainerRef,
        setJobs, setSplits,
        recordHistory
    );

    // 3. UI State
    const [selectedCell, setSelectedCell] = useState<{ driverId: string, time: string } | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingFilter, setPendingFilter] = useState('全て');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isHeaderEditModalOpen, setIsHeaderEditModalOpen] = useState(false);
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [headerEditTargetId, setHeaderEditTargetId] = useState<string | null>(null);

    const selectedDriverForEdit = headerEditTargetId
        ? drivers.find(d => d.id === headerEditTargetId) || null
        : null;

    // 4. Handlers
    const handleSaveHeader = (updatedDriver: BoardDriver) => {
        setDrivers(prev => prev.map(d => d.id === headerEditTargetId ? updatedDriver : d));
        recordHistory();
    };

    const handleDeleteHeader = () => {
        if (!headerEditTargetId) return;
        setDrivers(prev => prev.filter(d => d.id !== headerEditTargetId));
        setJobs(prev => prev.filter(j => j.driverId !== headerEditTargetId));
        recordHistory();
    };

    const handleAddManualJob = (job: BoardJob, reason: string) => {
        if (!editMode) return;
        console.log("[Board] Manually injecting job:", job.title, "Reason:", reason);
        // Add to local state
        const jobWithReason: BoardJob = { ...job, creation_reason: reason };
        setJobs(prev => [...prev, jobWithReason]);
        recordHistory();
        setSelectedCell(null);
        setIsAddJobModalOpen(false);
    };

    const handleAssignPendingJob = (job: BoardJob) => {
        if (!editMode || !selectedCell) return;
        const newJob: BoardJob = {
            ...job,
            driverId: selectedCell.driverId,
            timeConstraint: selectedCell.time,
            startTime: selectedCell.time
        };
        setJobs(prev => [...prev, newJob]);
        setPendingJobs(prev => prev.filter(j => j.id !== job.id));
        recordHistory();
        setSelectedCell(null);
    };

    const openHeaderEdit = (driverId: string) => {
        setHeaderEditTargetId(driverId);
        setIsHeaderEditModalOpen(true);
    };

    if (isAuthLoading || !isDataLoaded || masterLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
                <RefreshCcw className="animate-spin text-blue-500" size={48} />
                <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">
                    {isAuthLoading ? '認証中...' : '情報を読み込み中...'}
                </p>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col bg-slate-50 relative overflow-hidden select-none"
            onMouseMove={(e) => handleBackgroundMouseMove(e.nativeEvent)}
            onMouseUp={(e) => handleBackgroundMouseUp(e.nativeEvent)}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setSelectedCell(null);
                    setSelectedJobId(null);
                }
            }}
        >
            {/* Action Bar */}
            <div className="h-14 flex justify-between items-center px-4 bg-white border-b border-gray-200 shadow-sm z-30">
                <div className="flex items-center gap-4">
                    {isSyncing && <Database size={16} className="text-amber-500 animate-pulse" />}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                        <button onClick={undo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="元に戻す">
                            <Undo2 size={18} />
                        </button>
                        <button onClick={redo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="やり直し">
                            <Redo2 size={18} />
                        </button>
                    </div>

                    {editMode && (
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
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
                        <span className={`absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white shadow-md transition-all duration-300
                            ${pendingJobs.length > 0
                                ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                                : 'bg-slate-300'}
                        `}>
                            {pendingJobs.length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 overflow-auto relative h-full bg-[#f8fafc]">
                    <DriverHeader
                        drivers={drivers}
                        onEditHeader={openHeaderEdit}
                        onAddColumn={addColumn}
                        canEditBoard={canEditBoard && editMode}
                        stickyTop="top-0"
                    />
                    <div className="relative" ref={gridContainerRef}>
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
                                    setIsAddJobModalOpen(true);
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

            {/* Footer */}
            <div className="h-8 px-4 bg-slate-900 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-6 text-slate-500">
                <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${editMode ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    {editMode ? '編集モード（同期中）' : '閲覧モード（読み取り専用）'}
                </span>
                <span>Sanctuary Engine v3.0.0-ts</span>
                <span className="ml-auto">サーバー接続済み</span>
            </div>

            <HeaderEditModal
                isOpen={isHeaderEditModalOpen}
                onClose={() => setIsHeaderEditModalOpen(false)}
                driver={selectedDriverForEdit}
                masterDrivers={masterDrivers}
                masterVehicles={masterVehicles}
                onSave={handleSaveHeader}
                onDelete={handleDeleteHeader}
            />

            <SaveReasonModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onCommit={(reasonCode, reasonText) => {
                    handleSave(JSON.stringify({ code: reasonCode, text: reasonText }));
                    setIsSaveModalOpen(false);
                }}
            />

            <AddJobModal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                driver={selectedCell ? drivers.find(d => d.id === selectedCell.driverId) || null : null}
                time={selectedCell?.time || null}
                masterPoints={masterPoints}
                onAdd={handleAddManualJob}
            />
        </div>
    );
}
