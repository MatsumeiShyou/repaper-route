import { useState, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase/client';
import { TemplateManager } from '../logic/core/TemplateManager';

import {
    AlertTriangle
} from 'lucide-react';
import { TemplateExpander } from '../logic/core/TemplateExpander';
import { useBoardData } from './hooks/useBoardData';
import { useBoardDragDrop } from './hooks/useBoardDragDrop';
import { useBoardValidation } from './hooks/useBoardValidation';
import { useMasterData } from './hooks/useMasterData';
import { TIME_SLOTS } from '../board/logic/constants';

import { DriverHeader } from './components/DriverHeader';
import { BoardSkeleton } from './components/BoardSkeleton';

import { TimeGrid } from './components/TimeGrid';
import { JobLayer } from './components/JobLayer';
import { PendingJobSidebar } from './components/PendingJobSidebar';
import { useAuth } from '../../contexts/AuthProvider';
import { BoardJob, BoardDriver } from '../../types';

import { AuditTrailPanel } from './components/AuditTrailPanel';
import HeaderEditModal from './components/HeaderEditModal';
import { SaveReasonModal } from './components/SaveReasonModal';
import { AddJobModal } from './components/AddJobModal';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { BoardActionBar } from './components/BoardActionBar';
import { JobDetailPanel } from './components/JobDetailPanel';
import { getJSTNow, formatDateKey } from './utils/dateUtils';

export default function BoardCanvas() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();

    // 0. Master Data (Parallel Load)
    const {
        customers: masterPoints,
        vehicles: masterVehicles,
        isLoading: masterLoading
    } = useMasterData();

    // 1. Data & Logic Hook
    const [selectedDate, setSelectedDate] = useState<Date>(getJSTNow());
    const currentDateKey = formatDateKey(selectedDate);
    const [isInteracting, setIsInteracting] = useState(false);

    const {
        masterDrivers,
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isSyncing,
        editMode, canEditBoard, boardMode,
        handleSave, handleConfirmAll, handleRegisterTemplate, recordHistory, undo, redo,
        assignPendingJob, unassignJob, handleExceptionChange,
        addColumn, showNotification
    } = useBoardData(currentUser, currentDateKey, isInteracting);

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
        jobs, pendingJobs, drivers, splits,
        driverColRefs,
        gridContainerRef,
        setJobs, setPendingJobs, setSplits,
        recordHistory,
        setIsInteracting
    );

    // 2.5. Board Validation (Logic Base 全域連動)
    const validation = useBoardValidation(jobs, drivers, splits);

    // 2.6. Derived State: Validated Jobs (Enriching with soft/hard validation results)
    const validatedJobs = useMemo(() => {
        const overlapIds = new Set(validation.overlapViolations.map(v => v.jobId).concat(validation.overlapViolations.map(v => v.conflictJobId)));
        const slotViolationsMap = new Map(validation.slotViolations.map(v => [v.jobId, v.message]));

        return jobs.map(job => {
            const slotMsg = slotViolationsMap.get(job.id);
            return {
                ...job,
                hasError: overlapIds.has(job.id),
                hasWarning: !!slotMsg,
                warningMessage: slotMsg
            };
        });
    }, [jobs, validation]);

    // 3. UI State
    const [selectedCell, setSelectedCell] = useState<{ driverId: string, time: string } | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingFilter, setPendingFilter] = useState('全て');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
    const [isHeaderEditModalOpen, setIsHeaderEditModalOpen] = useState(false);
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [headerEditTargetId, setHeaderEditTargetId] = useState<string | null>(null);
    const [auditJobId, setAuditJobId] = useState<string | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);

    // 3.5. Board Context (Auth & Interaction logic)


    const selectedDriverForEdit = headerEditTargetId
        ? drivers.find(d => d.id === headerEditTargetId) || null
        : null;

    // 4. Handlers
    const handleMouseDown = () => {
        // No longer relying on mousePos for drag-canceling click logic
    };

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
        const jobWithReason: BoardJob = { ...job, creation_reason: reason };
        setJobs(prev => [...prev, jobWithReason]);
        recordHistory();
        setSelectedCell(null);
        setIsAddJobModalOpen(false);
    };

    const handleAssignPendingJob = (job: BoardJob) => {
        if (!editMode || !selectedCell) return;
        assignPendingJob(job, selectedCell.driverId, selectedCell.time);
        setSelectedCell(null);
    };

    const handleUnassignAndOpen = (id: string) => {
        unassignJob(id);
        setIsSidebarOpen(true);
    };

    const handleUpdateJob = (jobId: string, updates: Partial<BoardJob>) => {
        if (!editMode) return;
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j));
        recordHistory();
        showNotification("案件情報を更新しました", "success");
    };

    const handleExceptionRequest = (jobId: string, _type: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL') => {
        // Use handleExceptionChange to trigger modal
        console.log("Exception requested:", jobId, _type, handleExceptionChange);
        setAuditJobId(jobId);
    };

    const handleApplyTemplate = async () => {
        if (!editMode || isExpanding) return;

        const confirmMsg = "当日の周期（第N曜日）に合わせたテンプレートを展開しますか？現日のリソース状況（出勤・車両）に合わせて自動配置および不整合案件の排避を行います。";
        if (!window.confirm(confirmMsg)) return;

        setIsExpanding(true);
        try {
            // 1. 全ての有効なテンプレートを取得
            const { data: templates, error: fetchError } = await (supabase
                .from('board_templates')
                .select('*')
                .eq('is_active', true) as any);

            if (fetchError) throw fetchError;

            // 2. 最適なテンプレートを選択 (nth_week 優先、なければ毎週)
            const template = TemplateManager.findBestMatchingTemplate(templates || [], selectedDate);

            if (!template) {
                alert("該当するテンプレートが見つかりませんでした。");
                return;
            }

            console.log(`[Template] Applying template: ${template.name}`);

            // 3. スナップショットから Job[] 等を抽出
            const templateJobs = (template.jobs_json || []) as any[];

            // 4. Expander 実行
            const result = TemplateExpander.expand(templateJobs as any, drivers as any, masterVehicles as any);

            // 5. 結果の反映 (盤面の状態をテンプレート+リソース照合結果で上書き)
            setJobs(result.assigned.map(j => ({
                ...j,
                status: 'planned' as const
            })) as unknown as BoardJob[]);

            if (result.unassigned.length > 0) {
                setPendingJobs(prev => {
                    const assignedIds = new Set(result.assigned.map(j => j.id));
                    const stillPending = prev.filter(j => !assignedIds.has(j.id));
                    return [...stillPending, ...result.unassigned] as BoardJob[];
                });
                showNotification(`${result.unassigned.length} 件の案件がリソース制約により未配車リストへ退避されました。`, "info");
            }

            // 運転手と中抜きの状態もテンプレートから復元（必要に応じて）
            if (template.drivers_json) setDrivers(template.drivers_json as unknown as BoardDriver[]);
            if (template.splits_json) setSplits(template.splits_json as any[]);

            recordHistory();
            showNotification(`テンプレート「${template.name}」を適用しました`, "success");
        } catch (err) {
            console.error("[Template] Expansion failed:", err);
            showNotification("テンプレートの展開に失敗しました。", "error");
        } finally {
            setIsExpanding(false);
        }
    };

    const openHeaderEdit = (driverId: string) => {
        setHeaderEditTargetId(driverId);
        setIsHeaderEditModalOpen(true);
    };

    if (isAuthLoading || !isDataLoaded || masterLoading) {
        return <BoardSkeleton />;
    }





    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!editMode || isAddJobModalOpen) return;

        if (e.key === 'Escape') {
            setSelectedCell(null);
            return;
        }

        if (selectedCell) {
            const currentDriverIdx = drivers.findIndex(d => d.id === selectedCell.driverId);
            const currentTimeIdx = TIME_SLOTS.indexOf(selectedCell.time);

            if (e.key === 'ArrowUp' && currentTimeIdx > 0) {
                setSelectedCell({ ...selectedCell, time: TIME_SLOTS[currentTimeIdx - 1] });
            } else if (e.key === 'ArrowDown' && currentTimeIdx < TIME_SLOTS.length - 1) {
                setSelectedCell({ ...selectedCell, time: TIME_SLOTS[currentTimeIdx + 1] });
            } else if (e.key === 'ArrowLeft' && currentDriverIdx > 0) {
                setSelectedCell({ ...selectedCell, driverId: drivers[currentDriverIdx - 1].id });
            } else if (e.key === 'ArrowRight' && currentDriverIdx < drivers.length - 1) {
                setSelectedCell({ ...selectedCell, driverId: drivers[currentDriverIdx + 1].id });
            } else if (e.key === ' ' || e.key === 'Enter') {
                setIsAddJobModalOpen(true);
            }
        }

        // --- Task 3: Delete / Backspace handling ---
        if (selectedJobId && (e.key === 'Delete' || (e.key === 'Backspace' && !isAddJobModalOpen && !isHeaderEditModalOpen))) {
            unassignJob(selectedJobId);
            setSelectedJobId(null);
        }
    };

    return (
        <div
            className="h-full flex flex-col bg-slate-50 relative overflow-hidden select-none outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => handleBackgroundMouseMove(e.nativeEvent)}
            onMouseUp={(e) => handleBackgroundMouseUp(e.nativeEvent)}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setSelectedCell(null);
                    setSelectedJobId(null);
                }
            }}
        >
            {/* Action Bar (Isolated Component for UI Stability) */}
            <BoardActionBar
                boardMode={boardMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                isSyncing={isSyncing}
                undo={undo}
                redo={redo}
                handleConfirmAll={handleConfirmAll}
                setIsSaveTemplateModalOpen={setIsSaveTemplateModalOpen}
                handleApplyTemplate={handleApplyTemplate}
                isExpanding={isExpanding}
                validation={validation}
                setIsSaveModalOpen={setIsSaveModalOpen}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                pendingJobs={pendingJobs}
            />

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
                            jobs={validatedJobs}
                            splits={splits}
                            selectedCell={selectedCell}
                            dropPreview={dropPreview}
                            draggingJobId={draggingJobId}
                            draggingSplitId={draggingSplitId}
                            onCellClick={(driverId: string, time: string) => {
                                if (editMode) {
                                    const isSame = selectedCell?.driverId === driverId && selectedCell?.time === time;

                                    if (isSame) {
                                        setIsAddJobModalOpen(true);
                                    } else {
                                        setSelectedCell({ driverId, time });
                                    }
                                }
                            }}
                            onCellDoubleClick={(driverId: string, time: string) => {
                                if (editMode) {
                                    setSelectedCell({ driverId, time });
                                }
                            }}
                            driverColRefs={driverColRefs}
                            isCellOccupied={() => false}
                        />
                        <JobLayer
                            jobs={validatedJobs}
                            splits={splits}
                            drivers={drivers}
                            draggingJobId={draggingJobId}
                            draggingSplitId={draggingSplitId}
                            dropSplitPreview={dropSplitPreview}
                            resizingState={resizingState}
                            onJobMouseDown={handleJobMouseDown}
                            onSplitMouseDown={handleSplitMouseDown}
                            onResizeStart={handleResizeStart}
                            onJobClick={(id) => {
                                setSelectedJobId(id);
                                setIsSidebarOpen(false);
                            }}
                            onAuditClick={(id: string) => {
                                setAuditJobId(id);
                                setIsSidebarOpen(false);
                            }}
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

                <div
                    className={`
                        absolute top-0 right-0 h-full bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-gray-200
                        ${selectedJobId ? 'translate-x-0' : 'translate-x-full'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {selectedJobId && (
                        <JobDetailPanel
                            job={validatedJobs.find(j => j.id === selectedJobId) || jobs.find(j => j.id === selectedJobId)!}
                            drivers={drivers}
                            currentUser={currentUser}
                            canEdit={editMode}
                            onClose={() => setSelectedJobId(null)}
                            onUpdate={handleUpdateJob}
                            onUnassign={handleUnassignAndOpen}
                            onExceptionRequest={handleExceptionRequest}
                        />
                    )}
                </div>
            </div>

            {/* フッター (最小情報のみ表示) */}
            <div className="h-7 px-4 bg-slate-100 border-t border-slate-200 text-[10px] font-bold flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${editMode ? 'bg-emerald-500' : 'bg-slate-400'} `} />
                    {editMode ? '編集可能' : '読み取り専用'}
                </span>
                <span className="ml-auto">
                    {!validation.isValid ? (
                        <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle size={12} />
                            {validation.summary}
                        </span>
                    ) : (
                        <span className="text-emerald-600 italic">READY: {validation.summary}</span>
                    )}
                </span>
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
                onCommit={(reasonCode: string, reasonText: string) => {
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

            {auditJobId && (
                <AuditTrailPanel
                    job={validatedJobs.find(j => j.id === auditJobId) || pendingJobs.find(j => j.id === auditJobId)!}
                    onClose={() => setAuditJobId(null)}
                    history={[
                        {
                            version: 1,
                            decision: '初期配車確定',
                            reason: 'ルート最適化に基づく自動割り当て',
                            userName: 'System Analyzer',
                            updatedAt: '2026-03-01 10:00'
                        }
                    ]}
                />
            )}

            <SaveTemplateModal
                isOpen={isSaveTemplateModalOpen}
                onClose={() => setIsSaveTemplateModalOpen(false)}
                onSave={handleRegisterTemplate}
                currentDate={selectedDate}
            />
        </div>
    );
}
