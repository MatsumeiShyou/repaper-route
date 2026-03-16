import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import { isPastDayJST } from '../utils/dateUtils';
import { useDataSync } from './useDataSync';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, AppUser, ExceptionReasonMaster
} from '../../../types';

// --- Types ---
export interface BoardState {
    drivers: BoardDriver[];
    jobs: BoardJob[];
    pendingJobs: BoardJob[];
    splits: BoardSplit[];
}

export const useBoardData = (user: AppUser | null, currentDateKey: string, isInteracting: boolean = false) => {
    const currentUserId = user?.id;

    const { drivers: masterDrivers } = useMasterData();
    const { showNotification } = useNotification();

    // ----------------------------------------
    // 1. Logic Helpers (Adapters)
    // ----------------------------------------
    const mapSupabaseToBoardJob = useCallback((j: any): BoardJob => ({
        id: j.id,
        title: j.job_title,
        bucket: j.bucket_type || '',
        duration: j.duration_minutes || 0,
        area: j.area || j.customer_name || '',
        requiredVehicle: j.required_vehicle || undefined,
        note: j.special_notes || j.note || undefined,
        isSpot: j.bucket_type === 'スポット',
        timeConstraint: j.start_time || undefined,
        visitSlot: j.visit_slot || undefined,
        taskType: j.bucket_type === '特殊' ? 'special' : 'collection',
        status: (j.status as 'planned' | 'confirmed') || 'planned',
        is_admin_forced: j.is_admin_forced || false,
        is_skipped: j.is_skipped || false
    }), []);

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
        mapSupabaseToBoardJob, 
        getDefaultDrivers
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

    // Sync remote data to local state if no unsaved changes (history is empty) and not interacting
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

    // Supabase / Persistence State
    const [isOffline, setIsOffline] = useState(false);

    // Lock & Permission State
    const [lockState, setLockState] = useState<{ userId: string | null, dateKey: string | null }>({ userId: null, dateKey: null });
    
    // Permission derivation (F-SSOT)
    const [profile, setProfile] = useState<{ can_edit_board: boolean, role: string } | null>(null);
    const canEditBoard = useMemo(() => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return !!profile?.can_edit_board;
    }, [user, profile]);

    // Fetch Profile once
    useEffect(() => {
        if (currentUserId) {
            supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle()
                .then(({ data }) => { if (data) setProfile(data as any); });
        }
    }, [currentUserId]);

    // Exception Model State
    const [exceptionReasons, setExceptionReasons] = useState<ExceptionReasonMaster[]>([]);
    const [confirmedSnapshot, setConfirmedSnapshot] = useState<any>(null);
    
    // Fetch Master Metadata (Exception Reasons)
    useEffect(() => {
        supabase.from('exception_reason_masters').select('*').eq('is_active', true).order('created_at', { ascending: true })
            .then(({ data }) => { if (data) setExceptionReasons(data); });
        
        // Fetch Confirmed Snapshot for the route
        if (currentDateKey) {
            supabase.from('routes').select('confirmed_snapshot').eq('date', currentDateKey).maybeSingle()
                .then(({ data }) => { if (data) setConfirmedSnapshot(data.confirmed_snapshot); });
        }
    }, [currentDateKey]);

    // Derived States (Pure Derivation)
    const isPastDate = useMemo(() => isPastDayJST(new Date(currentDateKey)), [currentDateKey]);

    const isTargetDateLockedByMe = useMemo(() => {
        return lockState.userId === currentUserId && lockState.dateKey === currentDateKey;
    }, [lockState, currentUserId, currentDateKey]);

    const editMode = useMemo(() => {
        return isTargetDateLockedByMe && !isPastDate && canEditBoard;
    }, [isTargetDateLockedByMe, isPastDate, canEditBoard]);

    const boardMode = useMemo(() => {
        if (isPastDate) return 'VIEW_PAST' as const;
        if (state.jobs.some(j => j.status === 'confirmed')) return 'CONFIRM' as const;
        if (!editMode) return 'VIEW_LOCKED' as const;
        return 'EDIT' as const;
    }, [isPastDate, state.jobs, editMode]);

    const lockedBy = lockState.userId;

    // ----------------------------------------
    // 4. History Management
    // ----------------------------------------
    const recordHistory = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { ...state }],
            future: []
        }));
    }, [state]);

    // ----------------------------------------
    // 5. Lock Management
    // ----------------------------------------
    const requestEditLock = useCallback(async () => {
        if (!canEditBoard || isPastDate) {
            const reason = isPastDate ? "過去の配車は「閲覧のみ」です（不変原則）" : "編集権限がありません（閲覧専用）";
            showNotification(reason, "error");
            return;
        }

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

                if (!route) {
                    updateData = { ...updateData, jobs: [], drivers: [], splits: [], pending: [] };
                }

                const { error: upsertError } = await supabase.from('routes').upsert(updateData, { onConflict: 'date' });
                
                // [GUARDRAIL] Ignore 409 Conflict in lock-refresh context
                // This happens when multiple tabs/syncs try to refresh the lock simultaneously.
                if (upsertError && (upsertError as any).code !== '409' && (upsertError as any).status !== 409) {
                    throw upsertError;
                }

                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("編集モードで開きました", "success");
            } else {
                setLockState({ userId: route.edit_locked_by, dateKey: currentDateKey });
                showNotification(`${route.edit_locked_by}が編集中です`, "info");
            }
        } catch (e: any) {
            if (user?.role === 'admin') {
                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("管理者モード（ローカル保存）で開きました", "success");
            } else {
                showNotification("同期中にエラーが発生しました。", "error");
            }
        }
    }, [currentUserId, currentDateKey, canEditBoard, isPastDate, showNotification, user?.role, user]);

    const releaseEditLock = useCallback(async () => {
        if (!editMode) return;
        try {
            await (supabase.from('routes') as any).update({
                edit_locked_by: null,
                edit_locked_at: null,
                last_activity_at: null
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');

            setLockState({ userId: null, dateKey: currentDateKey });
            showNotification("編集権を解放しました", "success");
        } catch (e) {
            console.error("Release lock error:", e);
        }
    }, [editMode, currentDateKey, currentUserId, showNotification]);

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

    // ----------------------------------------
    // 6. Persistence Operations
    // ----------------------------------------
    const handleSave = async (reason = 'Manual Save') => {
        if (state.pendingJobs.length === 0 && state.jobs.length === 0) {
            showNotification("⚠️ データが空です。保存を中止します。", "error");
            return;
        }

        try {
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...state,
                    pending: state.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_decision_type: 'MANUAL_SAVE',
                p_reason: reason
            } as any);

            if (error) throw error;
            setIsOffline(false);
            showNotification("保存しました (SDR記録完了)", "success");
            
            // Update cache after successful save
            mutateCache(state);
            setHistory({ past: [], future: [] }); // Clear history after save
        } catch (e) {
            console.error("Save error:", e);
            setIsOffline(true);
            showNotification("保存失敗", "error");
        }
    };

    const handleConfirmAll = async (reason = 'Bulk Confirmation') => {
        if (!editMode) return;
        const plannedJobs = state.jobs.filter(j => j.status === 'planned');
        if (plannedJobs.length === 0) {
            showNotification("確定待ちの案件はありません", "info");
            return;
        }

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
                p_decision_type: 'BULK_CONFIRM',
                p_reason: reason
            } as any);

            if (error) throw error;
            setState(newState);
            mutateCache(newState);
            showNotification(`${plannedJobs.length}件を確定しました`, "success");
            setHistory({ past: [], future: [] });
        } catch (e) {
            showNotification("一括確定に失敗しました", "error");
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
                p_decision_type: `EXCEPTION_${exceptionType}`,
                p_reason: reasonFreeText || reasonMasterId || 'Exception Change'
            } as any);

            setState(newState);
            mutateCache(newState);
            setHistory({ past: [], future: [] });
            showNotification(`例外変更を記録しました`, "success");
        } catch (e) {
            showNotification(`例外記録に失敗しました`, "error");
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

    const assignPendingJob = useCallback((job: BoardJob, driverId: string, time: string) => {
        if (!editMode) return;
        setState(prev => ({
            ...prev,
            jobs: [...prev.jobs, { ...job, driverId, timeConstraint: time, startTime: time }],
            pendingJobs: prev.pendingJobs.filter(j => j.id !== job.id)
        }));
        recordHistory();
    }, [editMode, recordHistory]);

    const handleRegisterTemplate = useCallback(async (name: string, dayOfWeek: number, nthWeek: number | null) => {
        try {
            const { error } = await supabase.from('board_templates').insert({
                name, day_of_week: dayOfWeek, nth_week: nthWeek,
                jobs_json: state.jobs as any, drivers_json: state.drivers as any, splits_json: state.splits as any, is_active: true
            });
            if (error) throw error;
            showNotification(`テンプレート「${name}」を登録しました`, "success");
        } catch (e) {
            showNotification("登録に失敗しました", "error");
            throw e;
        }
    }, [state.jobs, state.drivers, state.splits, showNotification]);

    return {
        masterDrivers,
        drivers: state.drivers, setDrivers: (d: BoardDriver[] | ((prev: BoardDriver[]) => BoardDriver[])) => setState(s => ({ ...s, drivers: typeof d === 'function' ? d(s.drivers) : d })),
        jobs: state.jobs, setJobs: (j: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, jobs: typeof j === 'function' ? j(s.jobs) : j })),
        pendingJobs: state.pendingJobs, setPendingJobs: (pj: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, pendingJobs: typeof pj === 'function' ? pj(s.pendingJobs) : pj })),
        splits: state.splits, setSplits: (sp: BoardSplit[] | ((prev: BoardSplit[]) => BoardSplit[])) => setState(s => ({ ...s, splits: typeof sp === 'function' ? sp(s.splits) : sp })),
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard, isPastDate, boardMode,
        showNotification,
        requestEditLock, releaseEditLock, handleSave, handleConfirmAll,
        handleExceptionChange, exceptionReasons, confirmedSnapshot,
        handleRegisterTemplate, assignPendingJob,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
