/**
 * @typedef {import('../types').Driver} Driver
 * @typedef {import('../types').Job} Job
 * @typedef {import('../types').Split} Split
 */
import { useState, useCallback, useEffect } from 'react';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from '../logic/timeUtils';
import { calculateCollision, checkVehicleCompatibility } from '../logic/collision';

const QUARTER_HEIGHT_REM = 2;
const PIXELS_PER_REM = 16;
const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;

export const useBoardDragDrop = (jobs, drivers, splits, driverColRefs, setJobs, setSplits, recordHistory, currentUserId, createProposal = null) => {
    // Drag State
    const [draggingJobId, setDraggingJobId] = useState(null);
    const [draggingSplitId, setDraggingSplitId] = useState(null);
    const [dragButton, setDragButton] = useState(null);
    const [dropPreview, setDropPreview] = useState(null);
    const [dropSplitPreview, setDropSplitPreview] = useState(null);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
    const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });

    const [resizingState, setResizingState] = useState(null);

    // ----------------------------------------
    // Calculation Logic
    // ----------------------------------------
    const calculateDropTarget = useCallback((currentX, currentY, targetJobId) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        const moveYMinutes = calculateTimeFromY(currentY);
        let newStartMin = timeToMinutes(targetJob.startTime) + moveYMinutes;
        newStartMin = Math.max(timeToMinutes('06:00'), Math.min(timeToMinutes('17:45'), newStartMin));
        const newStartTime = minutesToTime(newStartMin);

        let newDriverId = targetJob.driverId;
        // Use refs to find column
        if (driverColRefs.current) {
            Object.entries(driverColRefs.current).forEach(([dId, el]) => {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // Using global mouse pos or relative? 
                    // calculateDropTarget is called with relative coords usually if dragOffset is applied?
                    // Original code: e.clientX - dragOffset.x is passed as currentX.
                    // But here we need to check if mouse passed into another column.
                    // The mouse pos X (e.clientX) is needed.
                    // Wait, calculateDropTarget in original code used `dragMousePos.x` (global) to detect column.
                    // So we need `dragMousePos` in state or pass it in.
                }
            });
        }

        // RE-CHECK Original Logic:
        // calculateDropTarget used `dragMousePos.x` which was updated on mousemove.
        // We need to ensure we have access to the latest mouse position.

        // Refactored approach: Pass `pointerX` (global) to this function.
        return null; // Placeholder as we refactor logic below
    }, [jobs, splits, drivers, dragButton, driverColRefs]);

    // Redefine with proper arguments
    const calculateDropTargetRef = (pointerX, relativeY, targetJobId) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        const moveYMinutes = calculateTimeFromY(relativeY);
        let newStartMin = timeToMinutes(targetJob.startTime) + moveYMinutes;
        newStartMin = Math.max(timeToMinutes('06:00'), Math.min(timeToMinutes('17:45'), newStartMin));
        const newStartTime = minutesToTime(newStartMin);

        let newDriverId = targetJob.driverId;
        if (driverColRefs.current) {
            Object.entries(driverColRefs.current).forEach(([dId, el]) => {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (pointerX >= rect.left && pointerX <= rect.right) {
                        newDriverId = dId;
                    }
                }
            });
        }

        const { isOverlapError, adjustedDuration } = calculateCollision({
            proposedDriverId: newDriverId,
            proposedStartMin: newStartMin,
            proposedDuration: targetJob.duration,
            ignoreJobId: targetJobId,
            existingJobs: jobs,
            splits: splits,
            isResize: dragButton === 2
        });

        const isVehicleError = checkVehicleCompatibility(
            newDriverId,
            newStartMin,
            splits,
            drivers,
            targetJob.requiredVehicle
        );

        return {
            driverId: newDriverId,
            startTime: newStartTime,
            duration: adjustedDuration,
            isVehicleError,
            isOverlapError
        };
    };

    const calculateSplitDropTargetRef = (pointerX, relativeY, splitId) => {
        const targetSplit = splits.find(s => s.id === splitId);
        if (!targetSplit) return null;

        const moveYBlocks = Math.round(relativeY / CELL_HEIGHT_PX);
        const moveYMinutes = moveYBlocks * 15;
        let newStartMin = timeToMinutes(targetSplit.time) + moveYMinutes;
        newStartMin = Math.max(timeToMinutes('06:00'), Math.min(timeToMinutes('17:45'), newStartMin));
        const newStartTime = minutesToTime(newStartMin);

        let newDriverId = targetSplit.driverId;
        if (driverColRefs.current) {
            Object.entries(driverColRefs.current).forEach(([dId, el]) => {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (pointerX >= rect.left && pointerX <= rect.right) newDriverId = dId;
                }
            });
        }

        let isOverlapError = false;
        const jobsInCol = jobs.filter(j => j.driverId === newDriverId);
        const hasJobCollision = jobsInCol.some(j => {
            const s = timeToMinutes(j.startTime);
            const e = s + j.duration;
            return newStartMin >= s && newStartMin < e;
        });
        if (hasJobCollision) isOverlapError = true;

        const otherSplits = splits.filter(s => s.driverId === newDriverId && s.id !== splitId);
        const hasSplitCollision = otherSplits.some(s => s.time === newStartTime);
        if (hasSplitCollision) isOverlapError = true;

        return { driverId: newDriverId, time: newStartTime, isOverlapError };
    };

    // ----------------------------------------
    // Handlers
    // ----------------------------------------
    const handleMouseDownJob = (e, job) => {
        if (e.button !== 0) return;
        setDraggingJobId(job.id);
        setDragButton(e.button);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDropPreview({ driverId: job.driverId, startTime: job.startTime, duration: job.duration, isOverlapError: false });
        setDragCurrent({ x: 0, y: 0 });
    };

    const handleMouseDownSplit = (e, split) => {
        if (e.button !== 0) return;
        setDraggingSplitId(split.id);
        setDragOffset({ x: e.clientX, y: e.clientY }); // Logic differs slightly in original (no rect subtraction for split handle?)
        // Original: setDragOffset({ x: e.clientX, y: e.clientY });
        // The split visual is a line.
        setDropSplitPreview({ driverId: split.driverId, time: split.time, isOverlapError: false });
        setDragCurrent({ x: 0, y: 0 });
    };

    const handleResizeStart = (e, job, direction) => {
        e.stopPropagation();
        setResizingState({
            id: job.id,
            direction,
            startY: e.clientY,
            originalStartTime: job.startTime,
            originalDuration: job.duration
        });
    };

    // Window Events (MouseMove / Up)
    const handleWindowMouseMove = (e) => {
        setDragMousePos({ x: e.clientX, y: e.clientY });

        if (resizingState) {
            const deltaY = e.clientY - resizingState.startY;
            const deltaBlocks = Math.round(deltaY / CELL_HEIGHT_PX);
            const deltaMinutes = deltaBlocks * 15;

            setJobs(prev => prev.map(j => {
                if (j.id !== resizingState.id) return j;
                if (resizingState.direction === 'bottom') {
                    const newDuration = Math.max(15, resizingState.originalDuration + deltaMinutes);
                    return { ...j, duration: newDuration };
                } else {
                    const originalStartMin = timeToMinutes(resizingState.originalStartTime);
                    let newStartMin = originalStartMin + deltaMinutes;
                    let newDuration = resizingState.originalDuration - deltaMinutes;
                    if (newDuration < 15) {
                        newDuration = 15;
                        newStartMin = originalStartMin + (resizingState.originalDuration - 15);
                    }
                    return { ...j, startTime: minutesToTime(newStartMin), duration: newDuration };
                }
            }));
            return;
        }

        if (draggingJobId) {
            const currentX = e.clientX - dragOffset.x;
            const currentY = e.clientY - dragOffset.y;
            setDragCurrent({ x: currentX, y: currentY });
            setDropPreview(calculateDropTargetRef(e.clientX, currentY, draggingJobId));
        }

        if (draggingSplitId) {
            const currentX = e.clientX - dragOffset.x;
            const currentY = e.clientY - dragOffset.y;
            setDragCurrent({ x: currentX, y: currentY });
            setDropSplitPreview(calculateSplitDropTargetRef(e.clientX, currentY, draggingSplitId));
        }
    };

    const handleWindowMouseUp = (e) => {
        if (resizingState) {
            recordHistory();
            setResizingState(null);
        }

        if (draggingJobId) {
            const currentY = e.clientY - dragOffset.y;
            const preview = calculateDropTargetRef(e.clientX, currentY, draggingJobId);
            if (preview && !preview.isOverlapError) {
                // recordHistory(); // Move to confirmation

                const proposedState = {
                    ...jobs.find(j => j.id === draggingJobId),
                    startTime: preview.startTime,
                    driverId: preview.driverId,
                    duration: preview.duration,
                    isVehicleError: preview.isVehicleError,
                    type: 'move'
                };

                // If createProposal acts as a callback for "Request Change"
                if (createProposal) {
                    createProposal(proposedState);
                } else {
                    setJobs(prev => prev.map(j => j.id === draggingJobId ? proposedState : j));
                    recordHistory();
                }
            }
            setDraggingJobId(null);
            setDragButton(null);
            setDragCurrent({ x: 0, y: 0 });
            setDropPreview(null);
        }

        if (draggingSplitId) {
            const currentY = e.clientY - dragOffset.y;
            const preview = calculateSplitDropTargetRef(e.clientX, currentY, draggingSplitId);
            if (preview && !preview.isOverlapError) {
                const proposedState = {
                    ...splits.find(s => s.id === draggingSplitId),
                    driverId: preview.driverId,
                    time: preview.time,
                    type: 'split'
                };

                if (createProposal) {
                    createProposal(proposedState);
                } else {
                    setSplits(prev => prev.map(s => s.id === draggingSplitId ? proposedState : s));
                    recordHistory();
                }
            }
            setDraggingSplitId(null);
            setDragCurrent({ x: 0, y: 0 });
            setDropSplitPreview(null);
        }
    };

    // ----------------------------------------
    // Window Event Registration (like prototype)
    // ----------------------------------------
    useEffect(() => {
        if (resizingState || draggingJobId || draggingSplitId) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [resizingState, draggingJobId, draggingSplitId]);

    return {
        // State
        draggingJobId, draggingSplitId,
        dropPreview, dropSplitPreview,
        dragMousePos, dragCurrent, dragOffset,
        resizingState,

        // Handlers (exposed for component binding)
        handleJobMouseDown: handleMouseDownJob,
        handleSplitMouseDown: handleMouseDownSplit,
        handleResizeStart,
        // Window events are now auto-registered via useEffect,
        // but expose for backward compat if needed:
        handleBackgroundMouseMove: handleWindowMouseMove,
        handleBackgroundMouseUp: handleWindowMouseUp
    };
};
