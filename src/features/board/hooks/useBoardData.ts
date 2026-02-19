import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification, NotificationProvider } from './contexts/NotificationContext';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory,
    Profile, AppUser, SupabaseJob, UserRole
} from '../../../types';

export const useBoardData = (currentUserId: string | undefined, currentDateKey: string) => {
    const { drivers: masterDrivers, isLoading: isMasterLoading } = useMasterData();
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
    const [localUpdatedAt, setLocalUpdatedAt] = useState<string | number>(Date.now());

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

                    if (data.pending && Array.isArray(data.pending) && data.pending.length > 0) {
                        setPendingJobs(data.pending as BoardJob[]);
                    } else {
                        const fallbackJobs = await fetchUnassignedJobsFallback();
                        setPendingJobs(fallbackJobs);
                    }

                    setLocalUpdatedAt(data.updated_at);
                    setIsOffline(false);
                } else {
                    const fallbackJobs = await fetchUnassignedJobsFallback();
                    setJobs([]);
                    setDrivers([]);
                    setSplits([]);
                    setPendingJobs(fallbackJobs);
                    setLocalUpdatedAt(new Date().toISOString());
                    setIsOffline(false);
                }

                // 2. Fetch User Permissions
                if (currentUserId) {
                    const { data: userProfile, error: profileError } = await supabase
                        .from('profiles')
                        .select('can_edit_board')
                        .eq('id', currentUserId)
                        .maybeSingle() as { data: any, error: any };

                    if (!profileError && userProfile) {
                        setCanEditBoard(userProfile.can_edit_board || false);
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
    }, [currentDateKey, currentUserId]);

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
                .maybeSingle();

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
            await supabase.from('routes').update({
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
            await supabase.from('routes').update({
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

            const newTimestamp = new Date().toISOString();
            setLocalUpdatedAt(newTimestamp);
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
                    showNotification(`${newData.edit_locked_by}が編集中です`, "warning");
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
                    setLocalUpdatedAt(newData.updated_at);
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
