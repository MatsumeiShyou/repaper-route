import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import { isPastDayJST } from '../utils/dateUtils';
import { useDataSync } from './useDataSync';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, ExceptionReasonMaster
} from '../../../types';
import { Staff } from '../../../os/auth/types';

// --- Types ---
export interface BoardState {
    drivers: BoardDriver[];
    jobs: BoardJob[];
    pendingJobs: BoardJob[];
    splits: BoardSplit[];
}

export const useBoardData = (user: Staff | null, currentDateKey: string, isInteracting: boolean = false) => {
    const currentUserId = user?.id;

    const { drivers: masterDrivers, customers: masterPoints } = useMasterData();
    const { showNotification } = useNotification();

    const getDefaultDrivers = useCallback(() => ['A', 'B', 'C', 'D', 'E'].map(courseName => ({
        id: `course_${courseName}`,
        name: `${courseName}コース`,
        driverName: '未割当',
        currentVehicle: '未定',
        course: courseName,
        color: 'bg-gray-50 border-gray-200'
    })), []);

    // ----------------------------------------
    // 2. Data Synchronization (Phase 3-2: SWR Layer)
    // ----------------------------------------
    const { data: remoteData, isLoading: isSyncing, error: syncError, mutate: mutateCache } = useDataSync(
        currentDateKey, 
        getDefaultDrivers,
        user?.role
    );

    // ----------------------------------------
    // 3. Unified Local State (SSOT)
    // ----------------------------------------
    const [state, setState] = useState<BoardState>({
        drivers: [],
        jobs: [],
        pendingJobs: [],
        splits: []
    });

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [history, setHistory] = useState<BoardHistory>({ past: [], future: [] });

    // Sync remote data to local state
    useEffect(() => {
        if (remoteData && history.past.length === 0 && !isInteracting) {
            setState(remoteData);
            setIsDataLoaded(true);
        }
    }, [remoteData, history.past.length, isInteracting]);

    // Handle sync errors
    useEffect(() => {
        if (syncError) {
            showNotification("データ同期中にエラーが発生しました", "error");
        }
    }, [syncError, showNotification]);

    const [isOffline, setIsOffline] = useState(false);
    const [lockState, setLockState] = useState<{ userId: string | null, dateKey: string | null }>({ userId: null, dateKey: null });
    
    const canEditBoard = useMemo(() => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return !!user.permissions?.can_edit_board;
    }, [user]);

    const [exceptionReasons, setExceptionReasons] = useState<ExceptionReasonMaster[]>([]);
    const [confirmedSnapshot, setConfirmedSnapshot] = useState<any>(null);
    
    useEffect(() => {
        supabase.from('exception_reason_masters').select('*').eq('is_active', true).order('created_at', { ascending: true })
            .then(({ data }) => { if (data) setExceptionReasons(data as any); });
        
        if (currentDateKey) {
            supabase.from('routes').select('confirmed_snapshot').eq('date', currentDateKey).maybeSingle()
                .then(({ data }) => { if (data) setConfirmedSnapshot(data.confirmed_snapshot); });
        }
    }, [currentDateKey]);

    const isPastDate = useMemo(() => isPastDayJST(new Date(currentDateKey)), [currentDateKey]);
    const isTargetDateLockedByMe = useMemo(() => {
        return lockState.userId === currentUserId && lockState.dateKey === currentDateKey;
    }, [lockState, currentUserId, currentDateKey]);

    const isOutOfRange = useMemo(() => {
        if (canEditBoard && user?.role === 'admin') return false;
        const target = new Date(currentDateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const min = new Date(today);
        min.setMonth(today.getMonth() - 1);
        min.setDate(1); 
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        return target < min || target > lastDayOfNextMonth;
    }, [currentDateKey, canEditBoard, user?.role]);

    const editMode = useMemo(() => {
        const pastCheck = (user?.role === 'admin') ? true : !isPastDate;
        return isTargetDateLockedByMe && pastCheck && canEditBoard;
    }, [isTargetDateLockedByMe, isPastDate, canEditBoard, user?.role]);

    const boardMode = useMemo(() => {
        if (isPastDate && user?.role !== 'admin') return 'VIEW_PAST' as const;
        if (state.jobs.some(j => j.status === 'confirmed')) return 'CONFIRM' as const;
        if (!editMode) return 'VIEW_LOCKED' as const;
        return 'EDIT' as const;
    }, [isPastDate, state.jobs, editMode, user?.role]);

    const lockedBy = lockState.userId;

    const recordHistory = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { ...state }],
            future: []
        }));
    }, [state]);

    const requestEditLock = useCallback(async () => {
        if (!canEditBoard || isPastDate) return;
        const currentTime = new Date().toISOString();
        const TIMEOUT_MS = 15 * 60 * 1000;
        try {
            const { data: route, error: fetchError } = await supabase
                .from('routes')
                .select('edit_locked_by, edit_locked_at, last_activity_at')
                .eq('date', currentDateKey)
                .maybeSingle();
            if (fetchError) throw fetchError;
            const isLockExpired = route?.last_activity_at &&
                (Date.now() - new Date(route.last_activity_at as string).getTime()) > TIMEOUT_MS;
            if (!route?.edit_locked_by || isLockExpired || route.edit_locked_by === currentUserId) {
                let updateData: any = {
                    date: currentDateKey,
                    edit_locked_by: currentUserId,
                    edit_locked_at: currentTime,
                    last_activity_at: currentTime,
                    updated_at: currentTime
                };
                const { error: lockError } = await supabase.rpc('rpc_execute_board_update', {
                    p_date: currentDateKey,
                    p_new_state: {
                        ...updateData,
                        edit_locked_by: currentUserId,
                        edit_locked_at: currentTime
                    },
                    p_decision_type: 'LOCK_ACQUIRE',
                    p_reason: 'Acquiring edit lock',
                    p_user_id: currentUserId
                } as any);
                if (lockError) throw lockError;
                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
            } else {
                setLockState({ userId: route.edit_locked_by, dateKey: currentDateKey });
            }
        } catch (e) {
            console.error("Lock error:", e);
        }
    }, [currentUserId, currentDateKey, canEditBoard, isPastDate, user?.role]);

    const releaseEditLock = useCallback(async () => {
        if (!editMode) return;
        try {
            await (supabase.from('routes') as any).update({
                edit_locked_by: null,
                edit_locked_at: null,
                last_activity_at: null
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');
            setLockState({ userId: null, dateKey: currentDateKey });
        } catch (e) {
            console.error("Release lock error:", e);
        }
    }, [editMode, currentDateKey, currentUserId]);

    useEffect(() => {
        if (!editMode) return;
        const interval = setInterval(async () => {
            await (supabase.from('routes') as any).update({
                last_activity_at: new Date().toISOString()
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');
        }, 60000);
        return () => clearInterval(interval);
    }, [editMode, currentDateKey, currentUserId]);

    useEffect(() => {
        if (isDataLoaded && !isPastDate) requestEditLock();
    }, [isDataLoaded, currentDateKey, requestEditLock, isPastDate]);

    useEffect(() => {
        return () => { if (editMode) releaseEditLock(); };
    }, [currentDateKey, editMode, releaseEditLock]);

    const handleSave = async (reason = '一時保存') => {
        if (state.pendingJobs.length === 0 && state.jobs.length === 0) return;
        try {
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...state,
                    pending: state.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: {},
                p_decision_type: 'MANUAL_SAVE',
                p_reason: reason,
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);
            if (error) throw error;
            setIsOffline(false);
            showNotification("一時保存しました", "success");
            mutateCache(state);
            setHistory({ past: [], future: [] });
        } catch (err) {
            console.error("Save error:", err);
            setIsOffline(true);
        }
    };

    const handleConfirmAll = async (reason = '一括確定') => {
        if (!editMode) return;
        const plannedJobs = state.jobs.filter(j => j.status === 'planned');
        if (plannedJobs.length === 0) return;
        if (!window.confirm(`${plannedJobs.length}件の案件を確定しますか？`)) return;
        try {
            const confirmedJobs = state.jobs.map(j => ({ ...j, status: 'confirmed' as const }));
            const newState = { ...state, jobs: confirmedJobs };
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...newState,
                    pending: newState.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: {},
                p_decision_type: 'BULK_CONFIRM',
                p_reason: reason,
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);
            if (error) throw error;
            setState(newState);
            mutateCache(newState);
            showNotification(`${plannedJobs.length}件を確定しました`, "success");
            setHistory({ past: [], future: [] });
        } catch (err) {
            console.error("Confirm all error:", err);
        }
    };

    const handleExceptionChange = async (
        jobId: string,
        exceptionType: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL' | 'ADD',
        proposedState: any,
        reasonMasterId?: string,
        reasonFreeText?: string,
        promoteRequested?: boolean
    ) => {
        try {
            const targetJob = state.jobs.find(j => j.id === jobId);
            if (!targetJob) throw new Error("Job not found");
            const updatedJobs = state.jobs.map(j => j.id === jobId ? { ...j, ...proposedState } : j);
            const newState = { ...state, jobs: updatedJobs };
            const { error: exceptionError } = await supabase.from('board_exceptions').insert([{
                route_date: currentDateKey, job_id: jobId, exception_type: exceptionType,
                before_state: { ...targetJob }, after_state: proposedState,
                reason_master_id: reasonMasterId, reason_free_text: reasonFreeText,
                promote_requested: promoteRequested, actor_id: currentUserId
            }]);
            if (exceptionError) throw exceptionError;
            await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...newState,
                    pending: newState.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: { exception_type: exceptionType, job_id: jobId },
                p_decision_type: `EXCEPTION_${exceptionType}`,
                p_reason: reasonFreeText || reasonMasterId || 'Exception Change',
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);
            setState(newState);
            mutateCache(newState);
            setHistory({ past: [], future: [] });
            showNotification(`例外変更を記録しました`, "success");
        } catch (err) {
            console.error("Exception change error:", err);
        }
    };

    const undo = useCallback(() => {
        if (!editMode) return;
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            setState(previous as BoardState);
            return { past: prev.past.slice(0, -1), future: [state, ...prev.future] };
        });
    }, [editMode, state]);

    const redo = useCallback(() => {
        if (!editMode) return;
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            setState(next as BoardState);
            return { past: [...prev.past, state], future: prev.future.slice(1) };
        });
    }, [editMode, state]);

    const addColumn = useCallback(() => {
        if (!editMode) return;
        setState(prev => {
            const newCourseName = String.fromCharCode(65 + prev.drivers.length);
            const newColumn: BoardDriver = {
                id: `course_${newCourseName}_${Date.now()}`,
                name: `${newCourseName}コース`,
                driverName: '未割当', currentVehicle: '未定', course: newCourseName,
                color: 'bg-gray-50 border-gray-200'
            };
            return { ...prev, drivers: [...prev.drivers, newColumn] };
        });
        recordHistory();
    }, [editMode, recordHistory]);

    const deleteColumn = useCallback((columnId: string) => {
        if (!editMode) return;
        if (state.jobs.some(j => j.driverId === columnId)) {
            showNotification('案件が残っているコースは削除できません', 'error');
            return;
        }
        setState(prev => ({ ...prev, drivers: prev.drivers.filter(d => d.id !== columnId) }));
        recordHistory();
    }, [editMode, state.jobs, recordHistory, showNotification]);

    const unassignJob = useCallback((jobId: string) => {
        if (!editMode) return;
        const targetJob = state.jobs.find(j => j.id === jobId);
        if (!targetJob || targetJob.status === 'confirmed') return;
        let restoredTimeConstraint = targetJob.timeConstraint;
        if (targetJob.location_id) {
            const masterPoint = masterPoints.find(p => p.id === targetJob.location_id);
            if (masterPoint) {
                restoredTimeConstraint = masterPoint.time_constraint || undefined;
            }
        }
        setState(prev => ({
            ...prev,
            jobs: prev.jobs.filter(j => j.id !== jobId),
            pendingJobs: [...prev.pendingJobs, { 
                ...targetJob, 
                driverId: undefined, 
                startTime: undefined,
                timeConstraint: restoredTimeConstraint
            }]
        }));
        recordHistory();
    }, [editMode, state.jobs, masterPoints, recordHistory]);

    const assignPendingJob = useCallback((job: BoardJob, driverId: string, time: string) => {
        if (!editMode) return;
        setState(prev => ({
            ...prev,
            jobs: [...prev.jobs, { ...job, driverId, startTime: time }],
            pendingJobs: prev.pendingJobs.filter(j => j.id !== job.id)
        }));
        recordHistory();
    }, [editMode, recordHistory]);

    return {
        masterDrivers,
        drivers: state.drivers, setDrivers: (d: BoardDriver[] | ((prev: BoardDriver[]) => BoardDriver[])) => setState(s => ({ ...s, drivers: typeof d === 'function' ? d(s.drivers) : d })),
        jobs: state.jobs, setJobs: (j: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, jobs: typeof j === 'function' ? j(s.jobs) : j })),
        pendingJobs: state.pendingJobs, setPendingJobs: (pj: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, pendingJobs: typeof pj === 'function' ? pj(s.pendingJobs) : pj })),
        splits: state.splits, setSplits: (sp: BoardSplit[] | ((prev: BoardSplit[]) => BoardSplit[])) => setState(s => ({ ...s, splits: typeof sp === 'function' ? sp(s.splits) : sp })),
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard, isPastDate, boardMode, isOutOfRange,
        showNotification,
        requestEditLock, releaseEditLock, handleSave, handleConfirmAll,
        handleExceptionChange, exceptionReasons, confirmedSnapshot,
        assignPendingJob, unassignJob,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
