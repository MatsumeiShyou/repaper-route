import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import { isPastDayJST } from '../utils/dateUtils';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, AppUser, ExceptionReasonMaster
} from '../../../types';

export const useBoardData = (user: AppUser | null, currentDateKey: string) => {
    const currentUserId = user?.id;

    const { drivers: masterDrivers, isLoading: masterLoading } = useMasterData();
    const { showNotification } = useNotification();

    // --- State ---
    const [drivers, setDrivers] = useState<BoardDriver[]>([]);
    const [jobs, setJobs] = useState<BoardJob[]>([]);
    const [pendingJobs, setPendingJobs] = useState<BoardJob[]>([]);
    const [splits, setSplits] = useState<BoardSplit[]>([]);

    // Supabase / Persistence State
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Lock & Permission State
    const [lockState, setLockState] = useState<{ userId: string | null, dateKey: string | null }>({ userId: null, dateKey: null });
    const [canEditBoard, setCanEditBoard] = useState(false);

    // Exception Model State (Phase 12)
    const [exceptionReasons, setExceptionReasons] = useState<ExceptionReasonMaster[]>([]);
    const [confirmedSnapshot, setConfirmedSnapshot] = useState<any>(null);
    const isPastDate = useMemo(() => isPastDayJST(new Date(currentDateKey)), [currentDateKey]);

    const isTargetDateLockedByMe = useMemo(() => {
        return lockState.userId === currentUserId && lockState.dateKey === currentDateKey;
    }, [lockState, currentUserId, currentDateKey]);

    const editMode = useMemo(() => {
        return isTargetDateLockedByMe && !isPastDate && canEditBoard;
    }, [isTargetDateLockedByMe, isPastDate, canEditBoard]);

    const boardMode = useMemo(() => {
        if (isPastDate) return 'VIEW_PAST' as const;
        if (jobs.some(j => j.status === 'confirmed')) return 'CONFIRM' as const;
        if (!editMode) return 'VIEW_LOCKED' as const;
        return 'EDIT' as const;
    }, [isPastDate, jobs, editMode]);

    const lockedBy = lockState.userId;


    // History State
    const [history, setHistory] = useState<BoardHistory>({ past: [], future: [] });

    // ----------------------------------------
    // 1. Logic Helpers
    // ----------------------------------------
    const recordHistory = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { jobs, pendingJobs, splits, drivers }],
            future: []
        }));
    }, [jobs, pendingJobs, splits, drivers]);



    // ----------------------------------------
    // 2. Data Mapping (Adapters)
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
    // 3. Initialization & Data Loading
    // ----------------------------------------
    const prevDateRef = useRef<string | null>(null);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        let ignore = false;
        const initializeData = async () => {
            if (!currentDateKey || masterLoading) return;

            const isDateChanged = prevDateRef.current !== currentDateKey;
            prevDateRef.current = currentDateKey;

            // --- Robust Sync Start ---
            setIsSyncing(true);

            if (isFirstLoadRef.current) {
                // First-time load: show loading screen
                setIsDataLoaded(false);
                setDrivers([]);
            } else if (isDateChanged) {
                // Soft Reset: keep headers, clear data to avoid flicker
                setJobs([]);
                setPendingJobs([]);
                setDrivers(getDefaultDrivers());
                setSplits([]);

                // 【重要】日付変更時は一旦 Loaded を false にし、useEffect による
                // 古い isPastDate での requestEditLock 暴走を防ぐ
                setIsDataLoaded(false);
            }

            setIsOffline(false);
            try {
                // 1. Fetch Board Data & Permissions in Parallel
                const fetchRoutePromise = supabase
                    .from('routes')
                    .select('*')
                    .eq('date', currentDateKey)
                    .maybeSingle();

                const fetchUnassignedJobsPromise = supabase
                    .from('jobs')
                    .select('*')
                    .is('driver_id', null);

                const fetchProfilePromise = currentUserId ? supabase
                    .from('profiles')
                    .select('can_edit_board, role')
                    .eq('id', currentUserId)
                    .maybeSingle() : Promise.resolve({ data: null, error: null });

                const fetchExceptionReasonsPromise = supabase
                    .from('exception_reason_masters')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });

                const [routeRes, jobsRes, profileRes, exceptionReasonsRes] = await Promise.all([
                    fetchRoutePromise,
                    fetchUnassignedJobsPromise,
                    fetchProfilePromise,
                    fetchExceptionReasonsPromise
                ]) as [any, any, any, any];

                if (ignore) return;

                if (routeRes.error || jobsRes.error || profileRes.error || exceptionReasonsRes.error) {
                    const err = routeRes.error || jobsRes.error || profileRes.error || exceptionReasonsRes.error;
                    console.error('[Board] Initialization fetch failed:', err);
                    // Throw to be caught by ErrorBoundary instead of silent whiteout
                    throw new Error(`Data fetch failed: ${err.message || 'Unknown error'}`);
                }

                if (exceptionReasonsRes.data) setExceptionReasons(exceptionReasonsRes.data);

                const data = routeRes.data;
                const unassignedJobs = jobsRes.data;
                const fallbackJobs = (unassignedJobs || []).map(mapSupabaseToBoardJob);

                // getDefaultDrivers は外側の useCallback 版を使用

                // ---------------------------------------------------------
                // 3. Apply Fetched Data to State
                // ---------------------------------------------------------
                if (data) {
                    setJobs((data.jobs || []) as BoardJob[]);
                    if (data.drivers && Array.isArray(data.drivers) && data.drivers.length > 0) {
                        setDrivers(data.drivers as BoardDriver[]);
                    } else {
                        setDrivers(getDefaultDrivers());
                    }
                    setSplits((data.splits || []) as BoardSplit[]);
                    setConfirmedSnapshot(data.confirmed_snapshot); // Load snapshot

                    // 【再発防止 / Single Source of Truth】
                    // routes.pending のスナップショットと、最新のマスター jobs テーブルをマージ
                    const latestUnassignedFromMaster = fallbackJobs;
                    const savedPending = (data.pending || []) as BoardJob[];
                    const masterUnassignedIds = new Set(latestUnassignedFromMaster.map((j: BoardJob) => j.id));

                    const savedIds = new Set(savedPending.map((j: BoardJob) => j.id));
                    const newUnseenJobs = latestUnassignedFromMaster.filter((j: BoardJob) => !savedIds.has(j.id));
                    const stillUnassignedSavedPending = savedPending.filter((j: BoardJob) => masterUnassignedIds.has(j.id));

                    setPendingJobs([...stillUnassignedSavedPending, ...newUnseenJobs]);
                    setIsOffline(false);
                } else {
                    setJobs([]);
                    setDrivers(getDefaultDrivers());
                    setSplits([]);
                    setPendingJobs(fallbackJobs);
                    setIsOffline(false);
                }

                // 2. Handle User Permissions (using data fetched in parallel)
                if (currentUserId && profileRes.data) {
                    const userProfile = profileRes.data;
                    const userContextRole = user?.role;
                    const hasAdminRole = userProfile.role === 'admin' || userContextRole === 'admin';
                    setCanEditBoard(!!(userProfile.can_edit_board || hasAdminRole));
                } else if (user?.role === 'admin') {
                    setCanEditBoard(true);
                } else {
                    setCanEditBoard(false);
                }
            } catch (err) {
                if (ignore) return;
                console.warn("Board load failed, using fallback UI", err);
                setIsOffline(true);
                // Ensure UI doesn't break even on sync failure
                setDrivers(getDefaultDrivers());
            } finally {
                if (!ignore) {
                    isFirstLoadRef.current = false;
                    setIsDataLoaded(true);
                    setIsSyncing(false);
                }
            }
        };

        initializeData();
        return () => { ignore = true; };
    }, [currentDateKey, currentUserId, masterLoading, mapSupabaseToBoardJob, getDefaultDrivers]);

    // ----------------------------------------
    // 3. Lock Management
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

            if (fetchError) {
                console.error("[Board] Lock fetch error:", fetchError);
                throw fetchError;
            }

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

                if (upsertError) {
                    throw upsertError;
                }

                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("編集モードで開きました", "success");
            } else {
                console.log("[Board] Locked by another user:", route.edit_locked_by);
                setLockState({ userId: route.edit_locked_by, dateKey: currentDateKey });
                showNotification(`${route.edit_locked_by}が編集中です`, "info");
            }
        } catch (e: any) {
            // 【再発防止 / 統治】RLS制限や401が発生した場合でも、管理者はローカル編集を続行可能にする
            const userContextRole = user?.role;
            if (userContextRole === 'admin') {
                setCanEditBoard(true);
                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("管理者モード（ローカル保存）で開きました", "success");
            } else {
                const msg = e?.message?.includes('401') ? "認証エラーが発生しました。再ログインを推奨します。" : "同期中にエラーが発生しました。";
                showNotification(msg, "error");
            }
        }
    }, [currentUserId, currentDateKey, canEditBoard, showNotification, user?.role]);

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

    // Auto-Heartbeat
    useEffect(() => {
        if (!editMode) return;
        const interval = setInterval(async () => {
            await (supabase.from('routes') as any).update({
                last_activity_at: new Date().toISOString()
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');
        }, 60000);
        return () => clearInterval(interval);
    }, [editMode, currentDateKey, currentUserId]);

    // Initial Lock Request (Reset per Date)
    useEffect(() => {
        if (isDataLoaded && !isPastDate) {
            requestEditLock();
        }
    }, [isDataLoaded, currentDateKey, requestEditLock, isPastDate]);

    // Cleanup when DateKey changes (Zombie Lock Prevention)
    useEffect(() => {
        return () => {
            if (editMode) {
                releaseEditLock();
            }
        };
    }, [currentDateKey, editMode, releaseEditLock]);

    // ----------------------------------------
    // 4. Persistence & Real-time
    // ----------------------------------------
    const handleSave = async (reason = 'Manual Save') => {
        setIsSyncing(true);
        try {
            if (pendingJobs.length === 0 && jobs.length === 0) {
                showNotification("⚠️ データが空です。保存を中止します。", "error");
                setIsSyncing(false);
                return;
            }

            // Execute SDR RPC
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    jobs,
                    drivers,
                    splits,
                    pending: pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_decision_type: 'MANUAL_SAVE',
                p_reason: reason
            } as any);

            if (error) throw error;

            setIsOffline(false);
            showNotification("保存しました (SDR記録完了)", "success");
        } catch (e) {
            console.error("Save error:", e);
            setIsOffline(true);
            showNotification("保存失敗", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    // Phase 5: Confirm All Jobs (Planned -> Confirmed)
    const handleConfirmAll = async (reason = 'Bulk Confirmation') => {
        if (!editMode) return;

        const plannedJobs = jobs.filter(j => j.status === 'planned');
        if (plannedJobs.length === 0) {
            showNotification("確定待ちの案件はありません", "info");
            return;
        }

        if (!window.confirm(`${plannedJobs.length}件の案件を確定しますか？確定後は通常の編集が制限されます。`)) return;

        setIsSyncing(true);
        try {
            const confirmedJobs = jobs.map(j => ({
                ...j,
                status: 'confirmed' as const
            }));

            // Execute SDR RPC for bulk confirmation
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    jobs: confirmedJobs,
                    drivers,
                    splits,
                    pending: pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_decision_type: 'BULK_CONFIRM',
                p_reason: reason
            } as any);

            if (error) throw error;

            setJobs(confirmedJobs);
            showNotification(`${plannedJobs.length}件を確定しました`, "success");
            recordHistory();
        } catch (e) {
            console.error("Confirm all error:", e);
            showNotification("一括確定に失敗しました", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    // Phase 12: Handle Post-Confirmation Exception Logging
    const handleExceptionChange = async (
        jobId: string,
        exceptionType: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL' | 'ADD',
        proposedState: any, // The new job object, mapped to SupabaseJob structure, or BoardJob if keeping logic local
        reasonMasterId?: string,
        reasonFreeText?: string,
        promoteRequested?: boolean
    ) => {
        setIsSyncing(true);
        try {
            const targetJob = jobs.find(j => j.id === jobId);
            if (!targetJob) throw new Error("Job not found");

            const beforeState = { ...targetJob };

            const boardException = {
                route_date: currentDateKey,
                job_id: jobId,
                exception_type: exceptionType,
                before_state: beforeState,
                after_state: proposedState,
                reason_master_id: reasonMasterId,
                reason_free_text: reasonFreeText,
                promote_requested: promoteRequested,
                actor_id: currentUserId
            };

            // 1. Log the Exception
            const { error: exceptionError } = await supabase
                .from('board_exceptions')
                .insert([boardException]);

            if (exceptionError) throw exceptionError;

            // 2. Optimistic UI update for the single job directly (since it bypasses typical edit rules)
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...proposedState } : j));
            recordHistory();

            // 3. Persist actual state to handle real-time sync across clients (we trigger an RPC to keep SDR coherent)
            const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, ...proposedState } : j);
            await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    jobs: updatedJobs,
                    drivers,
                    splits,
                    pending: pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_decision_type: `EXCEPTION_${exceptionType}`,
                p_reason: reasonFreeText || reasonMasterId || 'Exception Change'
            } as any);

            showNotification(`例外変更を記録しました`, "success");
        } catch (e) {
            console.error("Exception handling error:", e);
            showNotification(`例外記録に失敗しました`, "error");
        } finally {
            setIsSyncing(false);
        }
    };

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase.channel('board_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'routes', filter: `date=eq.${currentDateKey}` }, (payload) => {
                const newData = payload.new as any;
                if (newData.edit_locked_by && newData.edit_locked_by !== currentUserId) {
                    setLockState({ userId: newData.edit_locked_by, dateKey: currentDateKey });
                    showNotification(`${newData.edit_locked_by}が編集中です`, "info");
                }
                if (!newData.edit_locked_by && !editMode && lockState.userId) {
                    setLockState({ userId: null, dateKey: currentDateKey });
                    showNotification("編集可能になりました", "success");
                }
                if (newData.updated_at && !editMode) {
                    if (newData.jobs) setJobs(newData.jobs);
                    if (newData.drivers && Array.isArray(newData.drivers) && newData.drivers.length > 0) {
                        setDrivers(newData.drivers);
                    } else if (newData.drivers === null || (Array.isArray(newData.drivers) && newData.drivers.length === 0)) {
                        // Keep current drivers if real-time update sends empty to avoid header flicker
                        // unless it's a deliberate clear (not handled here for stability)
                    }
                    if (newData.splits) setSplits(newData.splits);
                    if (newData.pending) setPendingJobs(newData.pending);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentDateKey, currentUserId, editMode, lockState.userId, showNotification]);

    const undo = useCallback(() => {
        if (!editMode) return; // Prevent hallucinated state changes in view-only mode
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);
            const newFuture = [{ jobs, pendingJobs, splits, drivers }, ...prev.future];

            setJobs(previous.jobs);
            setPendingJobs(previous.pendingJobs);
            setSplits(previous.splits);
            setDrivers(previous.drivers);

            return { past: newPast, future: newFuture };
        });
    }, [jobs, pendingJobs, splits, drivers]);

    const redo = useCallback(() => {
        if (!editMode) return; // Prevent hallucinated state changes in view-only mode
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            const newFuture = prev.future.slice(1);
            const newPast = [...prev.past, { jobs, pendingJobs, splits, drivers }];

            setJobs(next.jobs);
            setPendingJobs(next.pendingJobs);
            setSplits(next.splits);
            setDrivers(next.drivers);

            return { past: newPast, future: newFuture };
        });
    }, [jobs, pendingJobs, splits, drivers]);

    const addColumn = useCallback(() => {
        if (!editMode) return;
        setDrivers(prev => {
            const newCourseName = String.fromCharCode(65 + prev.length);
            const newColumn: BoardDriver = {
                id: `course_${newCourseName}_${Date.now()}`,
                name: `${newCourseName}コース`,
                driverName: '未割当',
                currentVehicle: '未定',
                course: newCourseName,
                color: 'bg-gray-50 border-gray-200'
            };
            return [...prev, newColumn];
        });
        recordHistory();
    }, [editMode, recordHistory]);

    const deleteColumn = useCallback((columnId: string) => {
        if (!editMode) return;
        if (jobs.some(j => j.driverId === columnId)) {
            showNotification('案件が残っているコースは削除できません', 'error');
            return;
        }
        setDrivers(prev => prev.filter(d => d.id !== columnId));
        recordHistory();
    }, [editMode, jobs, recordHistory, showNotification]);

    // Phase 4: Import Periodic Jobs from Master
    const importPeriodicJobs = useCallback(async () => {
        if (!editMode || !currentDateKey) return;

        setIsSyncing(true);
        try {
            const { PeriodicJobImporter } = await import('../../../lib/PeriodicJobImporter');
            const targetDate = new Date(currentDateKey);
            const masterPoints = await PeriodicJobImporter.fetchPointsByDate(targetDate);

            if (masterPoints.length === 0) {
                showNotification("本日（マスタ設定）の定期案件はありません", "info");
                return;
            }

            // Map master points to BoardJob objects
            const newJobs: BoardJob[] = masterPoints.map(p => ({
                id: `periodic_${p.location_id}_${currentDateKey.replace(/-/g, '')}`,
                title: p.name,
                bucket: p.visit_slot === 'AM' ? 'AM' : p.visit_slot === 'PM' ? 'PM' : 'AM', // Default logic
                duration: (p as any).duration_minutes || 60, // Use duration_minutes from Master if exists
                area: p.area || p.display_name || '',
                requiredVehicle: p.restricted_vehicle_id ? '要車両' : undefined,
                note: p.note || undefined,
                isSpot: p.is_spot_only || false,
                timeConstraint: p.time_constraint_type !== 'NONE' ? '要確認' : undefined,
                taskType: p.special_type === 'NONE' ? 'collection' : 'special',
                status: 'planned' as const,
                location_id: p.location_id // Correct field name from index.ts
            }));

            // Duplicate Prevention: Check if already exists in jobs or pendingJobs
            const existingLocationIds = new Set([
                ...jobs.map(j => j.location_id),
                ...pendingJobs.map(j => j.location_id)
            ].filter(Boolean));

            const finalNewJobs = newJobs.filter(nj => !existingLocationIds.has(nj.location_id));

            if (finalNewJobs.length === 0) {
                showNotification("すべての定期案件は既に読み込み済みです", "info");
                return;
            }

            setPendingJobs(prev => [...prev, ...finalNewJobs]);
            showNotification(`${finalNewJobs.length}件の定期案件を読み込みました`, "success");
            recordHistory();

        } catch (e) {
            console.error("[Board] Import periodic jobs failed:", e);
            showNotification("マスタからの読み込みに失敗しました", "error");
        } finally {
            setIsSyncing(false);
        }
    }, [editMode, currentDateKey, jobs, pendingJobs, showNotification, recordHistory]);

    // Phase 6.2: Register current state as a template
    const handleRegisterTemplate = useCallback(async (name: string, dayOfWeek: number, nthWeek: number | null) => {
        setIsSyncing(true);
        try {
            const { error } = await supabase.from('board_templates').insert({
                name,
                day_of_week: dayOfWeek,
                nth_week: nthWeek,
                jobs_json: jobs as any,
                drivers_json: drivers as any,
                splits_json: splits as any,
                is_active: true
            });

            if (error) throw error;
            showNotification(`テンプレート「${name}」を登録しました`, "success");
        } catch (e) {
            console.error("Template registration error:", e);
            showNotification("テンプレートの登録に失敗しました", "error");
            throw e;
        } finally {
            setIsSyncing(false);
        }
    }, [jobs, drivers, splits, showNotification]);

    return {
        masterDrivers,
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard, isPastDate, boardMode,
        showNotification,
        requestEditLock, releaseEditLock, handleSave, handleConfirmAll,
        handleExceptionChange, exceptionReasons, confirmedSnapshot,
        handleRegisterTemplate,
        importPeriodicJobs, // Export new function
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
