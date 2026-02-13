/**
 * @typedef {import('../types').Driver} Driver
 * @typedef {import('../types').Job} Job
 * @typedef {import('../types').Split} Split
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { generateJobColorMap } from '../../core/config/theme';
import { timeToMinutes } from '../logic/timeUtils';

export const useBoardData = (currentUserId, currentDateKey) => {
    // --- Master Data ---
    const { drivers: masterDrivers, vehicles, customers, items, customerItemDefaults, isLoading: isMasterLoading } = useMasterData();

    // --- State ---
    const [drivers, setDrivers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [splits, setSplits] = useState([]);

    // Supabase / Persistence State
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [localUpdatedAt, setLocalUpdatedAt] = useState(Date.now());

    // Lock & Permission State
    const [editMode, setEditMode] = useState(false);
    const [lockedBy, setLockedBy] = useState(null);
    const [canEditBoard, setCanEditBoard] = useState(false);

    // History State
    const [history, setHistory] = useState({ past: [], future: [] });

    // Notification State
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // ----------------------------------------
    // 1. Logic Helpers
    // ----------------------------------------
    const recordHistory = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { jobs, pendingJobs, splits, drivers }],
            future: []
        }));
    }, [jobs, pendingJobs, splits, drivers]);

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

    // ----------------------------------------
    // 2. Initialization & Data Loading
    // ----------------------------------------
    const generateInitialData = useCallback(() => {
        setJobs([]);
        setPendingJobs([]);
        setSplits([]);
        setDrivers([]);
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            setIsSyncing(true);
            try {
                // 1. Fetch Board Data
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .eq('date', currentDateKey)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    if (data.jobs) setJobs(data.jobs);
                    if (data.drivers && data.drivers.length > 0) setDrivers(data.drivers);
                    if (data.splits) setSplits(data.splits);
                    if (data.pending) setPendingJobs(data.pending);
                    setLocalUpdatedAt(data.updated_at);
                    setIsOffline(false);
                } else {
                    // generateInitialData(); // OLD: Clears data


                    // Fallback: Load unassigned jobs from 'jobs' table
                    console.log("[Debug] Fetching unassigned jobs for fallback...");
                    const { data: unassignedJobs, error: jobsError } = await supabase
                        .from('jobs')
                        .select('*')
                        .is('driver_id', null);

                    console.log("[Debug] Unassigned Jobs Result:", { data: unassignedJobs, error: jobsError });

                    if (jobsError) {
                        console.error('Failed to load unassigned jobs:', jobsError);
                        generateInitialData();
                    } else {
                        // Transform DB fields to Frontend Model
                        const mappedJobs = (unassignedJobs || []).map(j => ({

                            id: j.id,
                            title: j.job_title,
                            bucket: j.bucket_type,
                            duration: j.duration_minutes,
                            area: j.area || j.customer_name, // Fallback area to customer name if empty
                            requiredVehicle: j.required_vehicle,
                            note: j.special_notes || j.note,

                            // Essential for filtering
                            isSpot: j.bucket_type === 'スポット',
                            timeConstraint: j.start_time, // e.g. "09:00"
                            taskType: j.bucket_type === '特殊' ? 'special' : 'collection'
                        }));

                        setJobs([]);
                        setDrivers([]);
                        setSplits([]);
                        setPendingJobs(mappedJobs);
                        setLocalUpdatedAt(new Date().toISOString());
                        setIsOffline(false);
                    }
                }

                // 2. Fetch User Permissions
                if (currentUserId) {
                    const { data: userProfile, error: profileError } = await supabase
                        .from('profiles')
                        .select('can_edit_board')
                        .eq('id', currentUserId)
                        .single();

                    if (!profileError && userProfile) {
                        setCanEditBoard(userProfile.can_edit_board || false);
                    } else {
                        console.warn("Permission fetch failed or no profile", profileError);
                        // Fallback for admin-001 in dev
                        if (currentUserId === 'admin-001') {
                            setCanEditBoard(true);
                        } else {
                            setCanEditBoard(false);
                        }
                    }
                }
            } catch (err) {
                console.warn("Supabase load failed, falling back to local storage.", err);
                setIsOffline(true);
                // LocalStorage Fallback
                const storedJobs = localStorage.getItem('repaper_route_jobs');
                const storedDrivers = localStorage.getItem('repaper_route_drivers');
                const storedSplits = localStorage.getItem('repaper_route_splits');
                const storedPending = localStorage.getItem('repaper_route_pending');

                if (storedJobs) setJobs(JSON.parse(storedJobs));
                if (storedDrivers) setDrivers(JSON.parse(storedDrivers));
                if (storedSplits) setSplits(JSON.parse(storedSplits));
                if (storedPending) setPendingJobs(JSON.parse(storedPending));
            } finally {
                setIsDataLoaded(true);
                setIsSyncing(false);
            }
        };

        initializeData();
    }, [currentDateKey, currentUserId, generateInitialData]);

    // Master Data Sync - Phase 7: Course-Based Initialization
    useEffect(() => {
        if (!isDataLoaded) return;

        setDrivers(prev => {
            if (prev.length === 0) {
                // Initialize Default Courses A-E
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
                (Date.now() - new Date(route.last_activity_at).getTime()) > TIMEOUT_MS;

            if (!route?.edit_locked_by || isLockExpired || route.edit_locked_by === currentUserId) {
                let updateData = {
                    date: currentDateKey,
                    edit_locked_by: currentUserId,
                    edit_locked_at: currentTime,
                    last_activity_at: currentTime,
                    updated_at: currentTime
                };

                if (!route) {
                    // New row: include empty data structure
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
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId);

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
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId);
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
    // LocalStorage Sync
    useEffect(() => {
        if (!isDataLoaded) return;
        localStorage.setItem('repaper_route_jobs', JSON.stringify(jobs));
        localStorage.setItem('repaper_route_drivers', JSON.stringify(drivers));
        localStorage.setItem('repaper_route_splits', JSON.stringify(splits));
        localStorage.setItem('repaper_route_pending', JSON.stringify(pendingJobs));
    }, [jobs, drivers, splits, pendingJobs, isDataLoaded]);

    const handleSave = async (reason = 'Manual Save') => {
        setIsSyncing(true);
        try {
            // Optimistic Concurrency Check (Client-side pre-check)
            const { data: latest } = await supabase.from('routes').select('updated_at').eq('date', currentDateKey).maybeSingle();

            if (latest && localUpdatedAt && latest.updated_at !== localUpdatedAt) {
                showNotification("他ユーザーによる変更があります。リロードします", "error");
                setTimeout(() => window.location.reload(), 1500);
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
                    edit_locked_by: lockedBy, // Pass lock info to preserve it
                    edit_locked_at: new Date().toISOString() // or maintain current lock time
                },
                p_decision_type: 'MANUAL_SAVE',
                p_reason: reason
            });

            if (error) throw error;

            const newTimestamp = new Date().toISOString();
            setLocalUpdatedAt(newTimestamp);
            setIsOffline(false);
            showNotification("保存しました (SDR記録完了)", "success");
        } catch (e) {
            console.error("Save error:", e);
            setIsOffline(true);
            showNotification("保存失敗 (オフラインまたは権限エラー)", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    // Real-time Subscription (RESTORED)
    useEffect(() => {
        const channel = supabase.channel('board_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'routes', filter: `date=eq.${currentDateKey}` }, (payload) => {
                const newData = payload.new;

                // Lock Logic
                if (newData.edit_locked_by && newData.edit_locked_by !== currentUserId) {
                    setEditMode(false);
                    setLockedBy(newData.edit_locked_by);
                    showNotification(`${newData.edit_locked_by}が編集中です`, "warning");
                }
                if (!newData.edit_locked_by && !editMode && lockedBy) {
                    setLockedBy(null);
                    showNotification("編集可能になりました", "success");
                }

                // Data Internalize (ReadOnly Mode) or Conflict Detect (Edit Mode)
                if (newData.updated_at) {
                    // Ignore updates if I am the locker (My own saves)
                    const isMyUpdate = newData.edit_locked_by === currentUserId;

                    if (editMode && !isMyUpdate && localUpdatedAt && newData.updated_at !== localUpdatedAt) {
                        showNotification("競合を検知しました。リロードします", "error");
                        // setTimeout(() => window.location.reload(), 2000);
                        console.warn("RELOAD BLOCKED FOR DEBUGGING: Conflict detected", newData.updated_at, localUpdatedAt);
                    } else if (!editMode) {
                        // Auto-update in read-only
                        if (newData.jobs) setJobs(newData.jobs);
                        if (newData.drivers) setDrivers(newData.drivers);
                        if (newData.splits) setSplits(newData.splits);
                        if (newData.pending) setPendingJobs(newData.pending);
                        setLocalUpdatedAt(newData.updated_at);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentDateKey, currentUserId, editMode, lockedBy, localUpdatedAt, showNotification]);

    const addColumn = useCallback(() => {
        if (!editMode) return;
        setDrivers(prev => {
            const newCourseName = String.fromCharCode(65 + prev.length);
            const newColumn = {
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

    const deleteColumn = useCallback((columnId) => {
        if (!editMode) return;
        if (jobs.some(j => j.driverId === columnId)) {
            showNotification('案件が残っているコースは削除できません', 'error');
            return;
        }
        setDrivers(prev => prev.filter(d => d.id !== columnId));
        recordHistory();
    }, [editMode, jobs, recordHistory, showNotification]);

    return {
        masterDrivers, vehicles, customers, items, customerItemDefaults,
        drivers, setDrivers,
        jobs, setJobs,
        pendingJobs, setPendingJobs,
        splits, setSplits,
        isDataLoaded, isOffline, isSyncing,
        editMode, lockedBy, canEditBoard,
        notification, showNotification,
        requestEditLock, releaseEditLock, handleSave,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
