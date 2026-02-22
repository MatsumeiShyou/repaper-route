import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, AppUser
} from '../../../types';

export const useBoardData = (user: AppUser | null, currentDateKey: string) => {
    const currentUserId = user?.id;

    const { drivers: masterDrivers } = useMasterData();
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
    const [canEditBoard, setCanEditBoard] = useState(user?.role === 'admin');

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
    const mapSupabaseToBoardJob = (j: any): BoardJob => ({
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
    });

    // ----------------------------------------
    // 3. Initialization & Data Loading
    // ----------------------------------------
    useEffect(() => {
        const initializeData = async () => {
            if (!currentDateKey) return;
            setIsSyncing(true);
            try {
                // 1. Fetch Board Data
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .eq('date', currentDateKey)
                    .maybeSingle() as { data: any, error: any };

                if (error) throw error;

                // Internal Helper for Job Sync
                const fetchUnassignedJobsFallback = async (): Promise<BoardJob[]> => {
                    const { data: unassignedJobs, error: jobsError } = await supabase
                        .from('jobs')
                        .select('*')
                        .is('driver_id', null);

                    if (jobsError) {
                        console.error('Failed to load unassigned jobs:', jobsError);
                        return [];
                    }
                    return (unassignedJobs || []).map(mapSupabaseToBoardJob);
                };

                if (data) {
                    if (data.jobs) setJobs(data.jobs as BoardJob[]);
                    if (data.drivers && Array.isArray(data.drivers) && data.drivers.length > 0) {
                        setDrivers(data.drivers as BoardDriver[]);
                    }
                    if (data.splits) setSplits(data.splits as BoardSplit[]);

                    // 【再発防止 / Single Source of Truth】
                    // routes.pending に保存されているデータは「スナップショット」であり、
                    // マスター jobs テーブルの更新（新規追加等）を反映していない可能性があります。
                    // 常に jobs テーブル (driver_id IS NULL) を最新の候補リストとして取得し、
                    // 保存済みデータと ID ベースでマージ（補完）することで、データの断絶を防ぎます。
                    const latestUnassignedFromMaster = await fetchUnassignedJobsFallback();

                    const savedPending = (data.pending || []) as BoardJob[];
                    const savedIds = new Set(savedPending.map(j => j.id));

                    // routes に未保存の新しい案件のみを抽出して補完
                    const newUnseenJobs = latestUnassignedFromMaster.filter(j => !savedIds.has(j.id));

                    // さらに、routes に保存されている案件が jobs テーブル側で削除・変更（配車済み化）
                    // されている可能性も考慮し、有効な（driver_id IS NULL のままの）案件のみを維持。
                    const masterUnassignedIds = new Set(latestUnassignedFromMaster.map(j => j.id));
                    const stillUnassignedSavedPending = savedPending.filter(j => masterUnassignedIds.has(j.id));

                    setPendingJobs([...stillUnassignedSavedPending, ...newUnseenJobs]);

                    setIsOffline(false);
                } else {
                    const fallbackJobs = await fetchUnassignedJobsFallback();
                    setJobs([]);
                    setDrivers([]);
                    setSplits([]);
                    setPendingJobs(fallbackJobs);
                    setIsOffline(false);
                }

                // 2. Fetch User Permissions
                if (currentUserId) {
                    const { data: userProfile, error: profileError } = await supabase
                        .from('profiles')
                        .select('can_edit_board, role')
                        .eq('id', currentUserId)
                        .maybeSingle() as { data: any, error: any };

                    if (!profileError && userProfile) {
                        const hasAdminRole = userProfile.role === 'admin' || user?.role === 'admin';
                        setCanEditBoard(userProfile.can_edit_board || hasAdminRole);
                    } else if (user?.role === 'admin') {
                        // DBに存在しないモックユーザーであっても、コンテキスト上で管理者なら権限付与
                        setCanEditBoard(true);
                    }
                }
            } catch (err) {
                console.warn("Supabase load failed, check offline status", err);
                setIsOffline(true);
            } finally {
                setIsDataLoaded(true);
                setIsSyncing(false);
            }
        };

        initializeData();
    }, [currentDateKey, currentUserId, user?.role]);

    // Phase 7: Default Course Initialization
    useEffect(() => {
        if (!isDataLoaded) return;
        setDrivers(prev => {
            if (prev.length === 0) {
                return ['A', 'B', 'C', 'D', 'E'].map(courseName => ({
                    id: `course_${courseName}`,
                    name: `${courseName}コース`,
                    driverName: '未割当',
                    currentVehicle: '未定',
                    course: courseName,
                    color: 'bg-gray-50 border-gray-200'
                }));
            }
            return prev;
        });
    }, [isDataLoaded]);

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
            const { data: route } = await supabase
                .from('routes')
                .select('edit_locked_by, edit_locked_at, last_activity_at')
                .eq('date', currentDateKey)
                .maybeSingle() as { data: any, error: any };

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

                const { error } = await supabase.from('routes').upsert(updateData, { onConflict: 'date' });

                if (!error) {
                    setEditMode(true);
                    setLockedBy(null);
                    showNotification("編集モードで開きました", "success");
                }
            } else {
                setEditMode(false);
                setLockedBy(route.edit_locked_by);
                showNotification(`${route.edit_locked_by}が編集中です`, "info");
            }
        } catch (e) {
            console.error("Lock error:", e);
        }
    }, [currentUserId, currentDateKey, canEditBoard, showNotification]);

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

    // Initial Lock Request
    const lockRequestedRef = useRef(false);
    useEffect(() => {
        if (isDataLoaded && !lockRequestedRef.current) {
            lockRequestedRef.current = true;
            requestEditLock();
        }
    }, [isDataLoaded, requestEditLock]);

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
                    if (newData.drivers) setDrivers(newData.drivers);
                    if (newData.splits) setSplits(newData.splits);
                    if (newData.pending && newData.pending.length > 0) setPendingJobs(newData.pending);
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
