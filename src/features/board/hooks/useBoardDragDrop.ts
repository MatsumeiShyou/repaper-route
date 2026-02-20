import { useState, useCallback, useEffect } from 'react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from '../logic/timeUtils';
import { calculateCollision, checkVehicleCompatibility } from '../logic/collision';

const CELL_HEIGHT_PX = 32;

export interface DragDropState {
    draggingJobId: string | null;
    draggingSplitId: string | null;
    dropPreview: any | null;
    dropSplitPreview: any | null;
    dragMousePos: { x: number, y: number };
    resizingState: any | null;
}

export const useBoardDragDrop = (
    jobs: BoardJob[],
    drivers: BoardDriver[],
    splits: BoardSplit[],
    driverColRefs: React.MutableRefObject<Record<string, HTMLElement | null>>,
    setJobs: React.Dispatch<React.SetStateAction<BoardJob[]>>,
    setSplits: React.Dispatch<React.SetStateAction<BoardSplit[]>>,
    recordHistory: () => void,
    currentUserId: string | undefined,
    createProposal: ((state: any) => void) | null = null
) => {
    const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
    const [draggingSplitId, setDraggingSplitId] = useState<string | null>(null);
    const [dropPreview, setDropPreview] = useState<any | null>(null);
    const [dropSplitPreview, setDropSplitPreview] = useState<any | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });
    const [resizingState, setResizingState] = useState<any | null>(null);

    const calculateDropTargetRef = (pointerX: number, relativeY: number, targetJobId: string) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        const moveYMinutes = calculateTimeFromY(relativeY);
        let newStartMin = timeToMinutes(targetJob.timeConstraint || '06:00') + moveYMinutes;
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

        const collision = calculateCollision({
            proposedDriverId: newDriverId || '',
            proposedStartMin: newStartMin,
            proposedDuration: targetJob.duration,
            ignoreJobId: targetJobId,
            existingJobs: jobs,
            splits: splits,
            drivers: drivers // 追加
        });

        const isVehicleError = checkVehicleCompatibility(
            newDriverId || '',
            newStartMin,
            splits,
            drivers,
            targetJob.requiredVehicle
        );

        return {
            driverId: newDriverId,
            startTime: newStartTime,
            duration: collision.adjustedDuration,
            isVehicleError,
            isOverlapError: collision.isOverlapError,
            logicResult: (collision as any).logicResult // 追加: Logic Base の詳細結果
        };
    };

    const handleMouseDownJob = (e: React.MouseEvent, job: BoardJob) => {
        if (e.button !== 0) return;
        setDraggingJobId(job.id);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDropPreview({ driverId: job.driverId, startTime: job.timeConstraint, duration: job.duration, isOverlapError: false });
    };

    const handleResizeStart = (e: React.MouseEvent, job: BoardJob, direction: 'top' | 'bottom') => {
        e.stopPropagation();
        setResizingState({
            id: job.id,
            direction,
            startY: e.clientY,
            originalStartTime: job.timeConstraint,
            originalDuration: job.duration
        });
    };

    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
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
                    return { ...j, timeConstraint: minutesToTime(newStartMin), duration: newDuration };
                }
            }));
            return;
        }

        if (draggingJobId) {
            const currentY = e.clientY - dragOffset.y;
            setDropPreview(calculateDropTargetRef(e.clientX, currentY, draggingJobId));
        }
    }, [draggingJobId, resizingState, dragOffset, jobs, splits, drivers, driverColRefs]);

    const handleWindowMouseUp = useCallback((e: MouseEvent) => {
        if (resizingState) {
            recordHistory();
            setResizingState(null);
        }

        if (draggingJobId) {
            const currentY = e.clientY - dragOffset.y;
            const preview = calculateDropTargetRef(e.clientX, currentY, draggingJobId);
            if (preview && !preview.isOverlapError) {
                const target = jobs.find(j => j.id === draggingJobId);
                if (target) {
                    const proposedState = {
                        ...target,
                        timeConstraint: preview.startTime,
                        driverId: preview.driverId,
                        duration: preview.duration
                    };

                    if (createProposal) {
                        createProposal(proposedState);
                    } else {
                        setJobs(prev => prev.map(j => j.id === draggingJobId ? proposedState : j));
                        recordHistory();
                    }
                }
            }
            setDraggingJobId(null);
            setDropPreview(null);
        }
    }, [draggingJobId, resizingState, dragOffset, jobs, recordHistory, createProposal]);

    useEffect(() => {
        if (resizingState || draggingJobId || draggingSplitId) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [resizingState, draggingJobId, draggingSplitId, handleWindowMouseMove, handleWindowMouseUp]);

    return {
        draggingJobId, draggingSplitId,
        dropPreview, dropSplitPreview,
        dragMousePos, resizingState,
        handleJobMouseDown: handleMouseDownJob,
        handleResizeStart,
        handleBackgroundMouseMove: handleWindowMouseMove,
        handleBackgroundMouseUp: handleWindowMouseUp
    };
};
