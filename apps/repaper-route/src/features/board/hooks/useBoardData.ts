import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { nativeSupabaseFetch } from '../../../lib/supabase/nativeFetch';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import { isPastDayJST } from '../utils/dateUtils';
import { useDataSync } from './useDataSync';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, ExceptionReasonMaster,
    BoardAction, BoardActionType
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

    const { 
        drivers: masterDrivers, 
        customers: masterPoints,
        vehicles: masterVehicles 
    } = useMasterData();
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
    const { data: remoteData, isLoading: isInitialLoading, error: syncError, mutate: mutateCache } = useDataSync(
        currentDateKey, 
        getDefaultDrivers,
        user?.role
    );

    const [isManualSyncing, setIsManualSyncing] = useState(false);
    const isSyncing = isInitialLoading || isManualSyncing;

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

    // Sync remote data to local state with Physical Hydration
    useEffect(() => {
        if (remoteData && history.past.length === 0 && !isInteracting) {
            // 車両マスタのスペックを BoardDriver に結合 (物理回帰)
            const enrichedDrivers = (remoteData.drivers || []).map((driver: BoardDriver) => {
                const mv = masterVehicles.find(v => 
                    v.callsign === driver.vehicleCallsign || 
                    v.number === (driver as any).vehicleNumber
                );
                return {
                    ...driver,
                    max_payload: mv?.max_payload,
                    vehicleNumber: mv?.number || (driver as any).vehicleNumber
                };
            });

            setState({
                ...remoteData,
                drivers: enrichedDrivers
            });
            setIsDataLoaded(true);
        }
    }, [remoteData, history.past.length, isInteracting, masterVehicles]);

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
    const [actions, setActions] = useState<BoardAction[]>([]);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    // Fetch Actions for Timeline
    useEffect(() => {
        const fetchActions = async () => {
            try {
                const { data, error } = await nativeSupabaseFetch(
                    'board_actions', 
                    `date=eq.${currentDateKey}&order=created_at.asc`
                );
                if (error) throw error;
                setActions(data as BoardAction[]);
            } catch (err) {
                console.error("Fetch actions error:", err);
            }
        };
        fetchActions();
    }, [currentDateKey]);

    useEffect(() => {
        nativeSupabaseFetch('exception_reason_masters', 'select=*&is_active=eq.true&order=created_at.asc')
            .then(({ data }) => { if (data) setExceptionReasons(data as any); });
        
        if (currentDateKey) {
            nativeSupabaseFetch('routes', `select=confirmed_snapshot&date=eq.${currentDateKey}`)
                .then(({ data }) => { if (data && (data as any)[0]) setConfirmedSnapshot((data as any)[0].confirmed_snapshot); });
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

    // Phase 13: Action-based Event Sourcing
    const recordAction = useCallback(async (action: Omit<BoardAction, 'date' | 'user_id'>, skipHistory = false) => {
        if (!editMode || isPastDate) return;

        setIsManualSyncing(true);
        // 1. Optimistic Update (Record history for UI undo)
        if (!skipHistory) recordHistory();

        const fullAction: BoardAction = {
            ...action,
            date: currentDateKey,
            user_id: currentUserId || undefined
        };

        try {
            // 2. Atomic RPC sync
            const { error } = await nativeSupabaseFetch('rpc/rpc_record_board_action', '', 'POST', {
                p_date: currentDateKey,
                p_action_type: fullAction.action_type,
                p_payload: fullAction.payload,
                p_reason: fullAction.reason
            });
            if (error) throw error;
            setIsManualSyncing(false);
        } catch (err) {
            console.error("Action sync error:", err);
            showNotification("同期エラーが発生しました。オフラインで継続します。", "warning");
            setIsOffline(true);
            setIsManualSyncing(false);
        }
    }, [editMode, isPastDate, currentDateKey, currentUserId, recordHistory, showNotification, setIsManualSyncing]);

    const requestEditLock = useCallback(async () => {
        if (!canEditBoard || isPastDate) return;
        const currentTime = new Date().toISOString();
        const TIMEOUT_MS = 15 * 60 * 1000;
        try {
            const { data: routeArr, error: fetchError } = await nativeSupabaseFetch(
                'routes',
                `select=edit_locked_by,edit_locked_at,last_activity_at&date=eq.${currentDateKey}`
            );
            if (fetchError) throw fetchError;
            const route = Array.isArray(routeArr) && routeArr.length > 0 ? (routeArr as any[])[0] : null;
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
                const { error: lockError } = await nativeSupabaseFetch('rpc/rpc_execute_board_update', '', 'POST', {
                    p_date: currentDateKey,
                    p_new_state: {
                        ...updateData,
                        edit_locked_by: currentUserId,
                        edit_locked_at: currentTime
                    },
                    p_ext_data: {},
                    p_decision_type: 'LOCK_ACQUIRE',
                    p_reason: 'Acquiring edit lock',
                    p_user_id: currentUserId,
                    p_client_meta: { source: 'useBoardData' }
                });
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
            await nativeSupabaseFetch('routes', `date=eq.${currentDateKey}&edit_locked_by=eq.${currentUserId || ''}`, 'PATCH', {
                edit_locked_by: null,
                edit_locked_at: null,
                last_activity_at: null
            });
            setLockState({ userId: null, dateKey: currentDateKey });
        } catch (e) {
            console.error("Release lock error:", e);
        }
    }, [editMode, currentDateKey, currentUserId]);

    useEffect(() => {
        if (!editMode) return;
        const interval = setInterval(async () => {
            await nativeSupabaseFetch('routes', `date=eq.${currentDateKey}&edit_locked_by=eq.${currentUserId || ''}`, 'PATCH', {
                last_activity_at: new Date().toISOString()
            });
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
            const { error } = await nativeSupabaseFetch('rpc/rpc_execute_board_update', '', 'POST', {
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
            });
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
            const { error } = await nativeSupabaseFetch('rpc/rpc_execute_board_update', '', 'POST', {
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
            });
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
            const updatedJobs = state.jobs.map(j => j.id === jobId ? { ...j, ...proposedState, status: 'planned' as const } : j);
            const newState = { ...state, jobs: updatedJobs };
            const { error: exceptionError } = await supabase.from('board_exceptions').insert([{
                route_date: currentDateKey, job_id: jobId, exception_type: exceptionType,
                before_state: { ...targetJob }, after_state: proposedState,
                reason_master_id: reasonMasterId, reason_free_text: reasonFreeText,
                promote_requested: promoteRequested, actor_id: currentUserId
            }]);
            if (exceptionError) throw exceptionError;
            await nativeSupabaseFetch('rpc/rpc_execute_board_update', '', 'POST', {
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
            });
            if (error) throw error;

            // Phase 13: Also record as Action for timeline tracking
            recordAction({
                action_type: 'MOVE_JOB',
                payload: { jobId, toColumnId: proposedState.driverId, data: proposedState },
                reason: reasonFreeText || reasonMasterId
            }, true);

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

    // Phase 13: Time Machine Replay Logic
    const reconstructStateAt = useCallback((index: number) => {
        if (!remoteData || index < 0 || index > actions.length) return;
        
        // Start from base state (Remote data or Snapshot)
        let newState: BoardState = JSON.parse(JSON.stringify(remoteData));
        
        // Apply actions up to the index
        const actionsToApply = actions.slice(0, index);
        actionsToApply.forEach(action => {
            const { action_type, payload } = action;
            switch (action_type) {
                case 'MOVE_JOB':
                    newState.jobs = newState.jobs.map(j => 
                        j.id === payload.jobId ? { ...j, driverId: payload.toColumnId, startTime: payload.newTime || j.startTime } : j
                    );
                    break;
                case 'UNASSIGN_JOB':
                    const targetJob = newState.jobs.find(j => j.id === payload.jobId);
                    if (targetJob) {
                        newState.jobs = newState.jobs.filter(j => j.id !== payload.jobId);
                        newState.pendingJobs.push({ ...targetJob, driverId: undefined, startTime: undefined });
                    }
                    break;
                case 'ADD_COLUMN':
                    if (payload.data) newState.drivers.push(payload.data);
                    break;
                case 'DELETE_COLUMN':
                    newState.drivers = newState.drivers.filter(d => d.id !== payload.columnId);
                    break;
                case 'UPDATE_DRIVER':
                    newState.drivers = newState.drivers.map(d => 
                        d.id === payload.driverId ? { ...d, ...payload.data } : d
                    );
                    break;
                case 'DELETE_DRIVER':
                    newState.drivers = newState.drivers.filter(d => d.id !== payload.driverId);
                    newState.jobs = newState.jobs.filter(j => j.driverId !== payload.driverId);
                    break;
                case 'ADD_JOB':
                    if (payload.data) newState.jobs.push(payload.data);
                    break;
                case 'UPDATE_JOB':
                    newState.jobs = newState.jobs.map(j => 
                        j.id === payload.jobId ? { ...j, ...payload.data } : j
                    );
                    break;
            }
        });
        
        setState(newState);
        setPreviewIndex(index);
    }, [remoteData, actions]);

    const resetTimeline = useCallback(() => {
        setPreviewIndex(null);
        if (remoteData) setState(remoteData);
    }, [remoteData]);

    const addColumn = useCallback(() => {
        if (!editMode) return;
        const newCourseName = String.fromCharCode(65 + state.drivers.length);
        const newColumn: BoardDriver = {
            id: `course_${newCourseName}_${Date.now()}`,
            name: `${newCourseName}コース`,
            driverName: '未割当', currentVehicle: '未定', course: newCourseName,
            color: 'bg-gray-50 border-gray-200'
        };
        setState(prev => ({ ...prev, drivers: [...prev.drivers, newColumn] }));
        recordAction({
            action_type: 'ADD_COLUMN',
            payload: { columnId: newColumn.id, data: newColumn }
        });
    }, [editMode, state.drivers.length, recordAction]);

    const deleteColumn = useCallback((columnId: string) => {
        if (!editMode) return;
        if (state.jobs.some(j => j.driverId === columnId)) {
            showNotification('案件が残っているコースは削除できません', 'error');
            return;
        }
        setState(prev => ({ ...prev, drivers: prev.drivers.filter(d => d.id !== columnId) }));
        recordAction({
            action_type: 'DELETE_COLUMN',
            payload: { columnId }
        });
    }, [editMode, state.jobs, recordAction, showNotification]);

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
        recordAction({
            action_type: 'UNASSIGN_JOB',
            payload: { jobId }
        });
    }, [editMode, state.jobs, masterPoints, recordAction]);

    const assignPendingJob = useCallback((job: BoardJob, driverId: string, time: string) => {
        if (!editMode) return;
        setState(prev => ({
            ...prev,
            jobs: [...prev.jobs, { ...job, driverId, startTime: time }],
            pendingJobs: prev.pendingJobs.filter(j => j.id !== job.id)
        }));
        recordAction({
            action_type: 'MOVE_JOB',
            payload: { jobId: job.id, toColumnId: driverId, newTime: time }
        });
    }, [editMode, recordAction]);

    const moveJob = useCallback((jobId: string, toColumnId: string) => {
        if (!editMode) return;
        const job = state.jobs.find(j => j.id === jobId);
        const fromColumnId = job?.driverId;

        setState(prev => {
            const updatedJobs = prev.jobs.map(j => 
                j.id === jobId ? { ...j, driverId: toColumnId } : j
            );
            return { ...prev, jobs: updatedJobs };
        });
        recordAction({
            action_type: 'MOVE_JOB',
            payload: { jobId, fromColumnId, toColumnId }
        });
    }, [editMode, state.jobs, recordAction]);

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
        actions, previewIndex, reconstructStateAt, resetTimeline,
        recordAction,
        addColumn, deleteColumn
    };
};
