import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, AppUser
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
    const [editMode, setEditMode] = useState(false);
    const [lockedBy, setLockedBy] = useState<string | null>(null);
    const [canEditBoard, setCanEditBoard] = useState(false);

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
        taskType: j.bucket_type === '特殊' ? 'special' : 'collection'
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

                const [routeRes, jobsRes, profileRes] = await Promise.all([
                    fetchRoutePromise,
                    fetchUnassignedJobsPromise,
                    fetchProfilePromise
                ]) as [any, any, any];

                if (ignore) return;

                if (routeRes.error || jobsRes.error || profileRes.error) {
                    const err = routeRes.error || jobsRes.error || profileRes.error;
                    console.error('[Board] Initialization fetch failed:', err);
                    // Throw to be caught by ErrorBoundary instead of silent whiteout
                    throw new Error(`Data fetch failed: ${err.message || 'Unknown error'}`);
                }

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
        if (!canEditBoard) {
            showNotification("編集権限がありません（閲覧専用）", "error");
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

                setEditMode(true);
                setLockedBy(null);
                showNotification("編集モードで開きました", "success");
            } else {
                console.log("[Board] Locked by another user:", route.edit_locked_by);
                setEditMode(false);
                setLockedBy(route.edit_locked_by);
                showNotification(`${route.edit_locked_by}が編集中です`, "info");
            }
        } catch (e: any) {
            // 【再発防止 / 統治】RLS制限や401が発生した場合でも、管理者はローカル編集を続行可能にする
            const userContextRole = user?.role;
            if (userContextRole === 'admin') {
                setEditMode(true);
                setCanEditBoard(true);
                setLockedBy(null);
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

            setEditMode(false);
            setLockedBy(null);
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
    const [lastLockedDate, setLastLockedDate] = useState<string | null>(null);
    useEffect(() => {
        if (isDataLoaded && lastLockedDate !== currentDateKey) {
            setLastLockedDate(currentDateKey);
            requestEditLock();
        }
    }, [isDataLoaded, currentDateKey, lastLockedDate, requestEditLock]);

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

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase.channel('board_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'routes', filter: `date=eq.${currentDateKey}` }, (payload) => {
                const newData = payload.new as any;
                if (newData.edit_locked_by && newData.edit_locked_by !== currentUserId) {
                    setEditMode(false);
                    setLockedBy(newData.edit_locked_by);
                    showNotification(`${newData.edit_locked_by}が編集中です`, "info");
                }
                if (!newData.edit_locked_by && !editMode && lockedBy) {
                    setLockedBy(null);
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
    }, [currentDateKey, currentUserId, editMode, lockedBy, showNotification]);

    const undo = useCallback(() => {
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

    return {
        masterDrivers,
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard,
        showNotification,
        requestEditLock, releaseEditLock, handleSave,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
