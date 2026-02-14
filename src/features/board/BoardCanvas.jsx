/**
 * @typedef {import('./types').Driver} Driver
 * @typedef {import('./types').Job} Job
 * @typedef {import('./types').Split} Split
 */
import React, { useState, useRef, useMemo } from 'react';
import {
    Calendar, Undo2, Redo2, Menu, Save,
    Check, X, AlertTriangle, Edit3, Trash2,
    SidebarClose, SidebarOpen, Clipboard
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
import { useAuth } from '../../contexts/AuthContext'; // Import Auth

export default function BoardCanvas() {
    const { currentUser } = useAuth(); // Use Auth
    const currentUserId = currentUser.id; // Dynamic User ID
    // Use today's date for production/demo (De-mocking Phase)
    // In a real app, this might come from a URL param or DatePicker
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const currentDateKey = `${yyyy}-${mm}-${dd}`;

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
        resizingState,
        handleJobMouseDown, handleSplitMouseDown,
        handleResizeStart,
        handleBackgroundMouseMove, handleBackgroundMouseUp
    } = useBoardDragDrop(
        jobs, drivers, splits,
        driverColRefs,
        setJobs, setSplits,
        recordHistory,
        currentUserId,
        createProposal
    );

    // 3. UI State (Modals, Selections)
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, type: null });
    const [reasonModal, setReasonModal] = useState({ isOpen: false, message: '', pendingJob: null, targetCell: null });
    const [contextMenu, setContextMenu] = useState(null);
    const [pendingFilter, setPendingFilter] = useState('全て');

    // New Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const handleSaveHeader = (courseName, assignedDriverName, assignedVehicleValue) => {
        recordHistory();

        // Find vehicle in master to get callsign
        const vehicleInfo = masterVehicles.find(v => (v.callsign || v.number) === assignedVehicleValue);
        const vehicleCallsign = vehicleInfo?.callsign || assignedVehicleValue;

        setDrivers(prev => prev.map(d => d.id === modalState.targetId ? {
            ...d,
            name: courseName,
            course: courseName.replace(/コース$/, ''),
            driverName: assignedDriverName,
            currentVehicle: assignedVehicleValue, // Value used for selection
            vehicleCallsign: vehicleCallsign // Added for display
        } : d));
        setModalState({ isOpen: false });
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

        // Reset selection & Close Sidebar (UX Improvement)
        setSelectedCell(null);
        setIsSidebarOpen(false); // Auto-close logic
    };

    if (!isDataLoaded) {
        return <div className="p-10 text-center text-gray-500 animate-pulse">読み込み中...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden"
            onMouseMove={handleBackgroundMouseMove}
            onMouseUp={handleBackgroundMouseUp}
            onClick={() => {
                // Background Click: Close details
                setSelectedCell(null);
                setSelectedJobId(null);
                setContextMenu(null);
                // Optional: Close Sidebar on background click if desired, but might be annoying.
                // leaving it open is better for repeated tasks.
            }}
        >
            {/* 配車盤専用アクションバー: サイドバーブランド領域と同じ高さ (h-14) */}
            <div className="h-14 flex justify-end items-center px-4 bg-white border-b border-gray-200 shadow-sm z-30 sticky top-0">
                <div className="flex items-center gap-2">
                    {/* Save Button */}
                    {editMode && (
                        <button
                            onClick={() => handleSave()}
                            disabled={isSyncing}
                            className={`p-2 h-10 rounded-lg flex items-center gap-2 text-sm font-bold transition-all
                                ${isSyncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-sm'}
                            `}
                        >
                            <Save size={18} />
                            {isSyncing ? '保存中...' : '保存'}
                        </button>
                    )}

                    {/* Sidebar Toggle Button (未配車リスト) */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`relative w-10 h-10 rounded-lg transition-all flex items-center justify-center
                            ${isSidebarOpen ? 'bg-blue-50 text-blue-600 shadow-inner' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'}
                        `}
                        title={isSidebarOpen ? 'リストを閉じる' : '未配車リスト'}
                    >
                        <Clipboard size={20} />
                        {pendingJobs.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ring-2 ring-white">
                                未{pendingJobs.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Canvas Area */}
                <div className="flex-1 overflow-auto relative select-none h-full">
                    {/* DriverHeader はスクロール領域内に配置し、sticky で固定 */}
                    <DriverHeader
                        drivers={drivers}
                        onEditHeader={openHeaderEdit}
                        onAddColumn={addColumn}
                        canEditBoard={canEditBoard}
                        stickyTop="top-0"
                    />
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
                                    // Auto-Open Sidebar Logic (UX Improvement)
                                    if (!isSidebarOpen) {
                                        setIsSidebarOpen(true);
                                    }
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
                            resizingState={resizingState}
                            onJobMouseDown={handleJobMouseDown}
                            onSplitMouseDown={handleSplitMouseDown}
                            onResizeStart={handleResizeStart}
                            onJobClick={(id, e) => {
                                e.stopPropagation();
                                setSelectedJobId(id);
                            }}
                            selectedJobId={selectedJobId}
                        />
                    </div>
                </div>

                {/* Pending Jobs Sidebar (Overlay Mode) */}
                {/* Condition: Render always but translate-x for animation */}
                <div className={`
                    absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out border-l border-gray-200
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <PendingJobSidebar
                        pendingJobs={pendingJobs}
                        pendingFilter={pendingFilter}
                        setPendingFilter={setPendingFilter}
                        selectedCell={selectedCell}
                        selectedJobId={selectedJobId}
                        onAddJob={handleAssignPendingJob}
                        onClose={() => setIsSidebarOpen(false)} // Pass close handler
                    />
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
            <div className="p-2 bg-gray-100 border-t border-gray-300 text-xs flex gap-4 text-gray-500 z-40 relative">
                <span>Mode: {editMode ? 'Editing' : 'View Only'}</span>
                <span>User: {currentUser.name} ({currentUser.role})</span>
                <span>Jobs: {jobs.length}</span>
                <span>Pending: {pendingJobs.length}</span>
            </div>
        </div>
    );
}
