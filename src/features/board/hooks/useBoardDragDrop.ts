import { useState, useCallback, useEffect, useMemo } from 'react';

import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from '../logic/timeUtils';
import { calculateCollision, checkVehicleCompatibility } from '../logic/collision';
import { CELL_HEIGHT_PX } from '../logic/constants';

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
    gridContainerRef: React.RefObject<HTMLDivElement>,
    setJobs: React.Dispatch<React.SetStateAction<BoardJob[]>>,
    _setSplits: React.Dispatch<React.SetStateAction<BoardSplit[]>>, // unused but kept for interface match
    recordHistory: () => void,
    createProposal: ((state: any) => void) | null = null,
    onExceptionRequest?: (job: BoardJob, proposedState: any) => void // Phase 12: Exception Logging
) => {

    const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
    const [draggingSplitId, setDraggingSplitId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizingState, setResizingState] = useState<any | null>(null);

    // [F-SSOT] dropPreview は状態ではなく、マウス位置とドラッグ対象からの「純粋導出」
    const dropPreview = useMemo(() => {
        if (!draggingJobId) return null;

        // 相対Y座標の計算（calculateDropTargetRef 内のロジックをここに集約または呼び出し）
        let relativeY = mousePos.y;
        if (gridContainerRef.current) {
            const containerRect = gridContainerRef.current.getBoundingClientRect();
            relativeY = mousePos.y - containerRect.top;
        }

        const currentY = relativeY - dragOffset.y;
        return calculateDropTargetRef(mousePos.x, currentY, draggingJobId);
    }, [draggingJobId, mousePos, dragOffset, jobs, splits, drivers]);

    const dropSplitPreview = null; // 簡略化

    const calculateDropTargetRef = (pointerX: number, relativeY: number, targetJobId: string) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        const absoluteYMinutes = calculateTimeFromY(relativeY);
        let newStartMin = timeToMinutes('06:00') + absoluteYMinutes;
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
            logicResult: collision.logicResult // 追加: Logic Base の詳細結果
        };
    };

    const handleMouseDownJob = (e: React.MouseEvent, job: BoardJob) => {
        if (e.button !== 0) return;

        // [GUARDRAIL] Lock check
        // Phase 12: 'confirmed' status allows dragging to trigger Exception Logging modal. Only isLocked blocks.
        if ((job as any).isLocked) {
            return;
        }

        setDraggingJobId(job.id);

        const cardElement = (e.currentTarget as HTMLElement).closest('[data-job-id]');
        const rect = cardElement ? cardElement.getBoundingClientRect() : (e.currentTarget as HTMLElement).getBoundingClientRect();

        // 1. カード内のどの位置を掴んだか（相対座標）を dragOffset に保持
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleSplitMouseDown = (e: React.MouseEvent, split: BoardSplit) => {
        if (e.button !== 0) return;
        setDraggingSplitId(split.id);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleResizeStart = (e: React.MouseEvent, job: BoardJob, direction: 'top' | 'bottom') => {

        e.stopPropagation();

        // [GUARDRAIL] Lock check
        if ((job as any).isLocked || (job as any).status === 'confirmed') {
            return;
        }

        let relativeStartY = e.clientY;
        if (gridContainerRef.current) {
            const containerRect = gridContainerRef.current.getBoundingClientRect();
            relativeStartY = e.clientY - containerRect.top;
        }

        setResizingState({
            id: job.id,
            direction,
            startY: relativeStartY,
            originalStartTime: job.timeConstraint,
            originalDuration: job.duration
        });
    };


    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        let relativeY = e.clientY;
        if (gridContainerRef.current) {
            const containerRect = gridContainerRef.current.getBoundingClientRect();
            relativeY = e.clientY - containerRect.top;
        }

        if (resizingState) {
            const deltaY = relativeY - resizingState.startY;
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
                    const newStartTime = minutesToTime(newStartMin);
                    return {
                        ...j,
                        timeConstraint: newStartTime,
                        startTime: newStartTime,
                        duration: newDuration
                    };
                }
            }));
            return;
        }

        if (draggingJobId) {
            setMousePos({ x: e.clientX, y: e.clientY });
        }
    }, [draggingJobId, resizingState, dragOffset, jobs, setJobs]);

    const handleWindowMouseUp = useCallback((_e: MouseEvent) => {
        if (resizingState) {
            recordHistory();
            setResizingState(null);
        }

        if (draggingJobId) {
            try {
                const preview = dropPreview;
                if (preview && !preview.isOverlapError) {
                    const target = jobs.find(j => j.id === draggingJobId);
                    if (target) {
                        // [GUARDRAIL] Optimistic Lock - version check
                        const currentJob = jobs.find(j => j.id === draggingJobId);
                        if (currentJob && target.version !== currentJob.version) {
                            alert("他のユーザーがこの案件を更新しました。画面をリロードしてください。");
                            return;
                        }

                        const proposedState = {
                            ...target,
                            timeConstraint: preview.startTime,
                            startTime: preview.startTime,
                            driverId: preview.driverId,
                            duration: preview.duration
                        };

                        // Phase 12: Handle Confirmed Jobs Exception Request
                        if (target.status === 'confirmed' && onExceptionRequest) {
                            onExceptionRequest(target, proposedState);
                            return; // Do NOT update state immediately
                        }

                        if (createProposal) {
                            createProposal(proposedState);
                        } else {
                            setJobs(prev => prev.map(j => j.id === draggingJobId ? proposedState : j));
                            recordHistory();
                        }
                    }
                }
            } catch (err) {
                console.error("[DragDrop] MouseUp Error:", err);
            } finally {
                setDraggingJobId(null);
            }
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
        resizingState,
        handleJobMouseDown: handleMouseDownJob,
        handleResizeStart,
        handleSplitMouseDown,
        handleBackgroundMouseMove: handleWindowMouseMove,
        handleBackgroundMouseUp: handleWindowMouseUp
    };

};
