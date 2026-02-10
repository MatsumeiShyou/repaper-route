/**
 * @typedef {import('./types').Driver} Driver
 * @typedef {import('./types').Job} Job
 * @typedef {import('./types').Split} Split
 */
import React, { useState, useRef, useMemo } from 'react';
import {
    Calendar, Undo2, Redo2, Menu,
    Check, X, AlertTriangle, Edit3, Trash2
} from 'lucide-react';
import { useBoardData } from './hooks/useBoardData';
import { useBoardDragDrop } from './hooks/useBoardDragDrop';
import { DriverHeader } from './components/DriverHeader';
import { TimeGrid } from './components/TimeGrid';
import { JobLayer } from './components/JobLayer';
import { BoardModals } from './components/BoardModals';
import { ReasonModal } from './components/ReasonModal';
import { BoardContextMenu } from './components/BoardContextMenu';
import { PendingJobSidebar } from './components/PendingJobSidebar';
import { timeToMinutes } from './logic/timeUtils';
import { ensureDefaultReason, createProposal, createDecision } from './logic/proposalLogic';

export default function BoardCanvas() {
    const currentUserId = 'admin-001';
    const currentDateKey = '2023-10-27';

    // 1. Data & Logic Hook
    const {
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        masterDrivers,
        vehicles: masterVehicles,
        items,
        customers,
        customerItemDefaults,
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard,
        notification, showNotification,
        requestEditLock, releaseEditLock, handleSave,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    } = useBoardData(currentUserId, currentDateKey);

    // 2. Drag & Drop Hook
    const driverColRefs = useRef({});
    const {
        draggingJobId, draggingSplitId,
        dropPreview, dropSplitPreview,
        dragMousePos,
        handleJobMouseDown, handleSplitMouseDown,
        handleBackgroundMouseMove, handleBackgroundMouseUp
    } = useBoardDragDrop(
        jobs, drivers, splits,
        driverColRefs,
        setJobs, setSplits,
        recordHistory,
        currentUserId,
        createProposal // Pass createProposal if needed by D&D? No, logic moved.
    );

    // 3. UI State (Modals, Selections)
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, type: null });
    const [reasonModal, setReasonModal] = useState({ isOpen: false, message: '', pendingJob: null, targetCell: null });
    const [contextMenu, setContextMenu] = useState(null);
    const [pendingFilter, setPendingFilter] = useState('全て');

    // ----------------------------------------
    // Handlers (Moved from original BoardCanvas)
    // ----------------------------------------
    const handleAddJob = (driverId, time) => {
        if (!editMode) return;
        setModalState({
            isOpen: true,
            type: 'job',
            targetId: 'new', // Flag for new job
            job: {
                driverId: driverId,
                startTime: time,
                duration: 30, // Default 30 min
                title: '',
                bucket: 'Free',
                items: [] // Will be populated by customer selection
            },
            // For new job, we might want to pass initial driver info
            initialDriverId: driverId
        });
    };

    const handleSplitTime = (driverId, time) => {
        if (!editMode) return;
        // Logic to split
    };

    const openHeaderEdit = (driverId) => {
        if (!editMode) {
            showNotification("編集モードではありません（ロック未取得）", "error");
            return;
        }
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
            setModalState({
                isOpen: true,
                type: 'header',
                targetId: driverId,
                initialCourseName: driver.name,
                initialDriverId: driver.driverName,
                initialVehicle: driver.currentVehicle
            });
        }
    };

    // Modal Saves
    const handleSaveHeader = (courseName, assignedDriverName, assignedVehicle) => {
        recordHistory();
        setDrivers(prev => prev.map(d => d.id === modalState.targetId ? {
            ...d,
            name: courseName,
            course: courseName.replace(/コース$/, ''),
            driverName: assignedDriverName,
            currentVehicle: assignedVehicle
        } : d));
        setModalState({ isOpen: false });
        // handleSave(); // Trigger save?
    };



    // ... (existing imports)

    // ... inside BoardCanvas component ...

    // New Handler for Sidebar Click assignment
    const handleAssignPendingJob = (job) => {
        if (!editMode) return;
        if (!selectedCell) return;

        const newJob = {
            ...job,
            driverId: selectedCell.driverId,
            startTime: selectedCell.time,
            // Keep other props
        };

        // Optimistic Update
        setJobs(prev => [...prev, newJob]);
        setPendingJobs(prev => prev.filter(j => j.id !== job.id));

        // Record History
        recordHistory();

        // Reset selection
        setSelectedCell(null);
    };

    if (!isDataLoaded) {
        return <div className="p-10 text-center text-gray-500 animate-pulse">読み込み中...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden"
            onMouseMove={handleBackgroundMouseMove}
            onMouseUp={handleBackgroundMouseUp}
            onClick={() => {
                setSelectedCell(null);
                setSelectedJobId(null);
                setContextMenu(null);
            }}
        >
            {/* Header */}
            <DriverHeader
                drivers={drivers}
                onEditHeader={openHeaderEdit}
                onAddColumn={addColumn}
                canEditBoard={canEditBoard}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Pending Jobs Sidebar (Restored) */}
                <PendingJobSidebar
                    pendingJobs={pendingJobs}
                    pendingFilter={pendingFilter}
                    setPendingFilter={setPendingFilter}
                    selectedCell={selectedCell}
                    selectedJobId={selectedJobId}
                    onAddJob={handleAssignPendingJob}
                />

                {/* Main Canvas */}
                <div className="flex-1 overflow-auto relative select-none" style={{ height: 'calc(100vh - 160px)' }}>
                    <div style={{ minWidth: 'max-content', position: 'relative' }}>
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
                                } else {
                                    setSelectedCell({ driverId, time });
                                }
                            }}
                            onCellDoubleClick={(driverId, time) => handleAddJob(driverId, time)}
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
                            onJobMouseDown={handleJobMouseDown}
                            onSplitMouseDown={handleSplitMouseDown}
                            onJobClick={(id, e) => {
                                e.stopPropagation();
                                setSelectedJobId(id);
                            }}
                            selectedJobId={selectedJobId}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <BoardModals
                modalState={modalState}
                onClose={() => setModalState({ isOpen: false })}
                onSaveHeader={handleSaveHeader}
                masterDrivers={masterDrivers}
                masterVehicles={masterVehicles}
                masterItems={items}
                customers={customers}
                customerItemDefaults={customerItemDefaults}
                onDeleteColumn={(id) => {
                    deleteColumn(id);
                    setModalState({ isOpen: false });
                }}
            />

            {/* Debug / Status Footer */}
            <div className="p-2 bg-gray-100 border-t border-gray-300 text-xs flex gap-4 text-gray-500">
                <span>Mode: {editMode ? 'Editing' : 'View Only'}</span>
                <span>Drivers: {drivers.length}</span>
                <span>Jobs: {jobs.length}</span>
                <span>Pending: {pendingJobs.length}</span>
            </div>
        </div>
    );
}
