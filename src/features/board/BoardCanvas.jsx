import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Calendar,
    GripVertical,
    Clock,
    Database,
    AlertTriangle,
    Edit3,
    Trash2,
    Undo2,
    Redo2,
    Menu,
    MoreVertical,
    Copy,
    Scissors,
    Check,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from './logic/timeUtils';
import { calculateCollision, checkVehicleCompatibility } from './logic/collision';
import { MASTER_CONFIG } from '../core/config/masters';
import { generateJobColorMap, getPendingJobColor } from '../core/config/theme';
import { BoardModals } from './components/BoardModals';

// ==========================================
// 1. 定数 & ヘルパー
// ==========================================
const QUARTER_HEIGHT_REM = 2;
const PIXELS_PER_REM = 16;
const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;

// --- Date Logic ---
// 1. URL searchParams (e.g. ?date=2024-01-01)
// 2. Default: Today (YYYY-MM-DD)
const getUrlDate = () => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) return dateParam;

    // Return Today in YYYY-MM-DD (Local Time)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CURRENT_DATE_KEY = getUrlDate();

const TIME_SLOTS = [];
for (let h = 6; h < 18; h++) {
    ['00', '15', '30', '45'].forEach(m => {
        TIME_SLOTS.push(`${h}:${m}`);
    });
}

// Initial Data = Empty (Repo First Pattern)
const INITIAL_DRIVERS = []; // Will be loaded from DB or Master
const INITIAL_JOBS = [];    // Will be loaded from DB

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function BoardCanvas() {

    // --- State ---
    const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
    const [jobs, setJobs] = useState(INITIAL_JOBS);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [splits, setSplits] = useState([]);

    // Supabase / Persistence State
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [, setIsOffline] = useState(false); // Using offline state for internal logic fallback
    const [, setIsSyncing] = useState(false);
    const [localUpdatedAt, setLocalUpdatedAt] = useState(null); // Phase 2: Optimistic Lock

    // Phase 2.2: Exclusive Edit Lock
    const [editMode, setEditMode] = useState(false); // true: 編集可能, false: 閲覧専用
    const [lockedBy, setLockedBy] = useState(null); // 他ユーザーが編集中の場合、そのユーザー名
    const [canEditBoard, setCanEditBoard] = useState(false); // Phase 2.3: 編集権限フラグ
    const currentUserId = "admin1"; // TODO: App.jsxからpropsで受け取る（Phase 2.3で対応） - Changed to match profiles.id

    // 履歴管理State
    const [history, setHistory] = useState({ past: [], future: [] });

    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);

    // 編集モーダル用State
    const [modalState, setModalState] = useState({ isOpen: false, type: null });

    // コンテキストメニューState
    const [contextMenu, setContextMenu] = useState(null); // { x, y, jobId, driverId, time }

    // 通知State
    const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // ドラッグ & リサイズ管理
    const [draggingJobId, setDraggingJobId] = useState(null);
    const [draggingSplitId, setDraggingSplitId] = useState(null);
    const [dragButton, setDragButton] = useState(null);
    const [dropPreview, setDropPreview] = useState(null);
    const [dropSplitPreview, setDropSplitPreview] = useState(null);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
    const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });

    const [resizingState, setResizingState] = useState(null);
    const [pendingFilter, setPendingFilter] = useState('全て');
    const driverColRefs = useRef({});

    // ----------------------------------------
    // 初期化 (Load) [Read Logic with Supabase]
    // ----------------------------------------
    useEffect(() => {
        const initializeData = async () => {
            setIsSyncing(true);

            // 1. Supabaseからデータ取得を試みる
            try {
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .eq('date', CURRENT_DATE_KEY)
                    .single();

                if (error) throw error;

                if (data) {
                    // Restore from DB
                    if (data.jobs) setJobs(data.jobs);
                    // Use saved drivers if exist, otherwise master defaults
                    if (data.drivers && data.drivers.length > 0) {
                        setDrivers(data.drivers);
                    } else {
                        // Fallback: If no drivers saved for this date, init from Master
                        setDrivers(MASTER_CONFIG.drivers.map(d => ({
                            id: d.id,
                            name: d.name,
                            currentVehicle: d.defaultVehicle,
                            course: d.defaultCourse,
                            color: 'bg-gray-50 border-gray-200'
                        })));
                    }

                    if (data.splits) setSplits(data.splits);
                    if (data.pending) setPendingJobs(data.pending);

                    // Phase 2.3: Fetch user's edit permission
                    try {
                        const { data: userProfile, error: profileError } = await supabase
                            .from('profiles')
                            .select('can_edit_board')
                            .eq('id', currentUserId) // Phase 2.3: Changed from user_id to id
                            .single();

                        if (!profileError && userProfile) {
                            setCanEditBoard(userProfile.can_edit_board || false);
                        } else {
                            console.warn("Could not fetch user permissions, defaulting to read-only");
                            setCanEditBoard(false);
                        }
                    } catch (permErr) {
                        console.error("Permission fetch error:", permErr);
                        setCanEditBoard(false);
                    }

                    // Phase 2: Record timestamp for optimistic locking
                    setLocalUpdatedAt(data.updated_at);
                    setIsOffline(false);
                } else {
                    // New Date: Initialize Empty
                    generateInitialData();
                }
            } catch (err) {
                console.warn("Supabase load failed, falling back to local storage.", err);
                setIsOffline(true);

                // 2. 失敗時はLocalStorageから復元
                const storedJobs = localStorage.getItem('repaper_route_jobs');
                const storedDrivers = localStorage.getItem('repaper_route_drivers');
                const storedSplits = localStorage.getItem('repaper_route_splits');
                const storedPending = localStorage.getItem('repaper_route_pending');

                if (storedJobs || storedDrivers) {
                    if (storedJobs) setJobs(JSON.parse(storedJobs));
                    if (storedDrivers) setDrivers(JSON.parse(storedDrivers));
                    if (storedSplits) setSplits(JSON.parse(storedSplits));
                    if (storedPending) setPendingJobs(JSON.parse(storedPending));
                } else {
                    // No Local Storage -> Init Empty
                    generateInitialData();
                }
            } finally {
                setIsDataLoaded(true);
                setIsSyncing(false);
            }
        };

        const generateInitialData = () => {
            // Initialize Drivers from Master
            setDrivers(MASTER_CONFIG.drivers.map(d => ({
                id: d.id,
                name: d.name,
                currentVehicle: d.defaultVehicle,
                course: d.defaultCourse,
                color: 'bg-gray-50 border-gray-200'
            })));

            // Jobs logic: Empty for now (Admin builds them)
            // Pending: Empty for now (Or fetch from Master if required)
            setPendingJobs([]);
            setSplits([]);
        };

        initializeData();
    }, []);

    // ----------------------------------------
    // Phase 2.2: Edit Lock Management
    // ----------------------------------------

    // ロック取得関数（15分タイムアウト判定あり）
    const requestEditLock = useCallback(async () => {
        // Phase 2.3: Permission check (highest priority)
        if (!canEditBoard) {
            showNotification("編集権限がありません（閲覧専用）", "error");
            setEditMode(false);
            setLockedBy("権限なし");
            return;
        }

        const currentTime = new Date().toISOString();
        const TIMEOUT_MS = 15 * 60 * 1000; // 15分

        try {
            // 現在のロック状態を確認
            const { data: route } = await supabase
                .from('routes')
                .select('edit_locked_by, edit_locked_at, last_activity_at, jobs, drivers, splits, pending, updated_at')
                .eq('date', CURRENT_DATE_KEY)
                .maybeSingle();

            // タイムアウト判定
            const isLockExpired = route?.last_activity_at &&
                (Date.now() - new Date(route.last_activity_at).getTime()) > TIMEOUT_MS;

            // ケース1: ロックなし or タイムアウト → 編集権取得
            if (!route?.edit_locked_by || isLockExpired) {
                const { error } = await supabase.from('routes').upsert({
                    date: CURRENT_DATE_KEY,
                    edit_locked_by: currentUserId,
                    edit_locked_at: currentTime,
                    last_activity_at: currentTime,
                    jobs: route?.jobs || [],
                    drivers: route?.drivers || [],
                    splits: route?.splits || [],
                    pending: route?.pending || [],
                    updated_at: currentTime
                });

                if (!error) {
                    setEditMode(true);
                    setLockedBy(null);
                    showNotification("編集モードで開きました", "success");
                } else {
                    console.error("Lock acquisition error:", error);
                    setEditMode(false);
                }
                return;
            }

            // ケース2: 自分がロック保持中 → 編集モード継続
            if (route.edit_locked_by === currentUserId) {
                setEditMode(true);
                setLockedBy(null);
                // Update last_activity
                await supabase.from('routes').update({
                    last_activity_at: currentTime
                }).eq('date', CURRENT_DATE_KEY);
                return;
            }

            // ケース3: 他ユーザーが編集中 → 閲覧モード
            setEditMode(false);
            setLockedBy(route.edit_locked_by);
            showNotification(`${route.edit_locked_by}が編集中です（閲覧モード）`, "info");
        } catch (e) {
            console.error("ロック取得エラー:", e);
            setEditMode(false);
        }
    }, [currentUserId, canEditBoard]); // Phase 2.3: added canEditBoard dependency


    // ハートビート（アクティビティ更新）
    const updateActivity = useCallback(async () => {
        if (!editMode) return;

        try {
            await supabase.from('routes').update({
                last_activity_at: new Date().toISOString()
            }).eq('date', CURRENT_DATE_KEY)
                .eq('edit_locked_by', currentUserId);
        } catch (e) {
            console.error("Activity update error:", e);
        }
    }, [editMode, currentUserId]);

    // ロック解放（明示的）
    const releaseEditLock = useCallback(async () => {
        if (!editMode) return;

        try {
            await supabase.from('routes').update({
                edit_locked_by: null,
                edit_locked_at: null,
                last_activity_at: null
            }).eq('date', CURRENT_DATE_KEY)
                .eq('edit_locked_by', currentUserId);

            setEditMode(false);
            setLockedBy(null);
            showNotification("編集権を解放しました", "success");
        } catch (e) {
            console.error("Lock release error:", e);
        }
    }, [editMode, currentUserId]);


    // 初回ロック取得（データ読み込み後）
    const lockRequestedRef = useRef(false);
    useEffect(() => {
        if (isDataLoaded && !lockRequestedRef.current) {
            lockRequestedRef.current = true;
            requestEditLock();
        }
    }, [isDataLoaded]); // Fixed: removed requestEditLock from deps, use ref for single execution

    // 1分ごとのハートビート
    useEffect(() => {
        if (!editMode) return;

        const heartbeat = setInterval(() => {
            updateActivity();
        }, 60000); // 60秒

        return () => clearInterval(heartbeat);
    }, [editMode, updateActivity]);

    // ページ離脱時にロック解放
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (editMode) {
                // Synchronous API for beforeunload
                navigator.sendBeacon('/api/release-lock', JSON.stringify({
                    date: CURRENT_DATE_KEY,
                    userId: currentUserId
                }));
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Cleanup on component unmount
            if (editMode) {
                releaseEditLock();
            }
        };
    }, [editMode, releaseEditLock]);


    // ----------------------------------------
    // 同期保存 & リアルタイム購読 (Real-time Sync)
    // ----------------------------------------
    // A. 変更検知と保存 (Optimistic UI + Save)
    useEffect(() => {
        if (!isDataLoaded) return;

        const saveData = async () => {
            // LocalStorage Sync
            localStorage.setItem('repaper_route_jobs', JSON.stringify(jobs));
            localStorage.setItem('repaper_route_drivers', JSON.stringify(drivers));
            localStorage.setItem('repaper_route_splits', JSON.stringify(splits));
            localStorage.setItem('repaper_route_pending', JSON.stringify(pendingJobs));

            // Supabase Sync (Debounced or Triggered)
            // Note: For MVP we save on every change, but in production we might want to debounce or use a "Save" button for heavy data.
            // Currently relies on "Save" button for Explicit Sync to DB to avoid hitting limits too hard, 
            // BUT requirements asked for Real-time. Let's do auto-save on major changes? 
            // The user asked to RESTORE real-time. Original app had auto-save.
            // We will keep the "Save Button" for manual force, but we should also auto-save or at least listen.

            // For now, we will NOT auto-save to DB on every drag to save quota, relying on the "Save Button" (Line 643) for strictly persisting to DB.
            // HOWEVER, we MUST listen for changes from others.
        };
        saveData();
    }, [jobs, drivers, splits, pendingJobs, isDataLoaded]);

    // B. Real-time Subscription (Receive Changes + Lock State Monitoring)
    useEffect(() => {
        const channel = supabase
            .channel('board_changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'routes', filter: `date=eq.${CURRENT_DATE_KEY}` },
                (payload) => {
                    // console.log('Real-time update received:', payload);
                    const newData = payload.new;

                    // Phase 2.2: Lock State Monitoring
                    if (newData && newData.edit_locked_by !== undefined) {
                        // 他ユーザーがロック取得 → 強制的に閲覧モード
                        if (newData.edit_locked_by && newData.edit_locked_by !== currentUserId) {
                            setEditMode(false);
                            setLockedBy(newData.edit_locked_by);
                            showNotification(`${newData.edit_locked_by}が編集中です`, "warning");
                        }

                        // ロックが解放された → 編集可能通知
                        if (!newData.edit_locked_by && !editMode && lockedBy) {
                            setLockedBy(null);
                            showNotification("編集可能になりました", "success");
                        }
                    }

                    // Phase 2: Optimistic Lock - Check for conflicts (閲覧モード時のみデータ自動反映)
                    if (newData && newData.updated_at) {
                        // 編集モード時: 競合検知（Phase 2のロジック継続）
                        if (editMode && localUpdatedAt && newData.updated_at !== localUpdatedAt) {
                            // Conflict detected: reload to get latest version
                            showNotification("他のユーザーが編集しました。最新版を読み込みます", "error");
                            setTimeout(() => window.location.reload(), 1500);
                            return;
                        }

                        // 閲覧モード時: データを自動反映
                        if (!editMode) {
                            if (newData.jobs) setJobs(newData.jobs);
                            if (newData.drivers) setDrivers(newData.drivers);
                            if (newData.splits) setSplits(newData.splits);
                            if (newData.pending) setPendingJobs(newData.pending);
                            setLocalUpdatedAt(newData.updated_at);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [editMode, lockedBy, localUpdatedAt, currentUserId]);


    // Explicit Save Function (Called by Button or Auto-Interval)
    const handleSaveToSupabase = async () => {
        setIsSyncing(true);
        try {
            // Phase 2: Check for conflicts before saving
            const { data: latestData } = await supabase
                .from('routes')
                .select('updated_at')
                .eq('date', CURRENT_DATE_KEY)
                .maybeSingle();

            // If record exists and timestamps don't match, another user has edited
            if (latestData && localUpdatedAt && latestData.updated_at !== localUpdatedAt) {
                showNotification("他のユーザーが編集しました。再読込します", "error");
                setIsSyncing(false);
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            // No conflict: proceed with save
            const newTimestamp = new Date().toISOString();
            await supabase.from('routes').upsert({
                date: CURRENT_DATE_KEY,
                jobs, drivers, splits, pending: pendingJobs,
                updated_at: newTimestamp
            }, { onConflict: 'date' });

            // Update local timestamp after successful save
            setLocalUpdatedAt(newTimestamp);
            setIsOffline(false);
            showNotification("保存しました", "success");
        } catch (e) {
            console.error(e);
            setIsOffline(true);
            showNotification("保存に失敗しました", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    // ----------------------------------------
    // Smart Coloring Logic (Delegated to Pure Logic)
    // ----------------------------------------
    const jobColorMap = useMemo(() => {
        const driverOrder = drivers.map(d => d.id);
        return generateJobColorMap(jobs, driverOrder, timeToMinutes);
    }, [jobs, drivers]);

    // ----------------------------------------
    // 履歴管理 (Undo/Redo)
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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                redo();
                return;
            }
            if (modalState.isOpen || selectedCell) return;
            if (!selectedJobId) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedJobId) handleDeleteJob(selectedJobId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedJobId, jobs, modalState, selectedCell, undo, redo]); // Fixed dep editModal -> modalState

    // ----------------------------------------
    // アクション処理
    // ----------------------------------------
    const handleDeleteJob = (jobId) => {
        recordHistory();
        const targetJob = jobs.find(j => j.id === jobId);
        if (targetJob) {
            const restoredPending = { ...targetJob, bucket: targetJob.bucket || 'Free' };
            setPendingJobs(prev => [...prev, restoredPending]);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setSelectedJobId(null);
        }
    };

    const openHeaderEdit = (driverId) => {
        const driver = drivers.find(d => d.id === driverId);
        if (!driver) return;
        setModalState({
            isOpen: true,
            type: 'header',
            targetId: driverId,
            initialDriverName: driver.name,
            initialVehicle: driver.currentVehicle
        });
    };

    const openSplitEdit = (e, driverId, time) => {
        e.stopPropagation();
        if (draggingSplitId) return;
        const split = splits.find(s => s.driverId === driverId && s.time === time);
        const driver = drivers.find(d => d.id === driverId);

        setModalState({
            isOpen: true,
            type: 'split',
            targetId: driverId,
            time: time,
            initialDriverName: split ? split.driverName : (driver?.name || ''),
            initialVehicle: split ? split.vehicle : (driver?.currentVehicle || '')
        });
    };

    const openJobEditModel = (jobId) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;
        setModalState({
            isOpen: true,
            type: 'job',
            targetId: jobId,
            job: { ...job }
        });
    };

    const handleSaveHeader = (newName, newVehicle) => {
        recordHistory();
        setDrivers(prev => prev.map(d => d.id === modalState.targetId ? { ...d, name: newName, currentVehicle: newVehicle } : d));
        setModalState({ isOpen: false });
        handleSaveToSupabase();
    };

    const handleSaveSplit = (newName, newVehicle) => {
        recordHistory();
        setSplits(prev => {
            const idx = prev.findIndex(s => s.driverId === modalState.targetId && s.time === modalState.time);
            if (idx >= 0) {
                const newSplits = [...prev];
                newSplits[idx] = { ...newSplits[idx], driverName: newName, vehicle: newVehicle };
                return newSplits;
            } else {
                return [...prev, { id: `split_${modalState.targetId}_${Date.now()}`, driverId: modalState.targetId, time: modalState.time, driverName: newName, vehicle: newVehicle }];
            }
        });
        setModalState({ isOpen: false });
        handleSaveToSupabase();
    };

    const handleSaveJob = (jobId, newData) => {
        recordHistory();
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...newData, originalDuration: newData.duration } : j)); // Update originalDuration if duration changed
        setModalState({ isOpen: false });
        handleSaveToSupabase();
    };

    const handleDeleteSplit = () => {
        recordHistory();
        setSplits(prev => prev.filter(s => !(s.driverId === modalState.targetId && s.time === modalState.time)));
        setModalState({ isOpen: false });
        handleSaveToSupabase();
    };

    const handleContextMenu = (e, type, payload) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggingJobId || draggingSplitId) return;

        // Show custom menu
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type,
            ...payload // jobId or driverId/time
        });
    };

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // ----------------------------------------
    // ドロップ判定ロジック
    // ----------------------------------------
    const calculateDropTarget = (currentX, currentY, targetJobId) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        // 1. View Logic: Determine Proposed Position
        const moveYMinutes = calculateTimeFromY(currentY);
        let newStartMin = timeToMinutes(targetJob.startTime) + moveYMinutes;
        newStartMin = Math.max(timeToMinutes('06:00'), Math.min(timeToMinutes('17:45'), newStartMin));
        const newStartTime = minutesToTime(newStartMin);

        let newDriverId = targetJob.driverId;
        Object.entries(driverColRefs.current).forEach(([dId, el]) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                if (dragMousePos.x >= rect.left && dragMousePos.x <= rect.right) {
                    newDriverId = dId;
                }
            }
        });

        // 2. Business Logic: Collision & Constraints
        const { isOverlapError, adjustedDuration } = calculateCollision({
            proposedDriverId: newDriverId,
            proposedStartMin: newStartMin,
            proposedDuration: targetJob.duration,
            ignoreJobId: targetJobId,
            existingJobs: jobs,
            splits: splits,
            isResize: dragButton === 2
        });

        // 3. Business Logic: Vehicle Check
        const isVehicleError = checkVehicleCompatibility(
            newDriverId,
            newStartMin,
            splits,
            drivers,
            targetJob.requiredVehicle
        );

        return {
            driverId: newDriverId,
            startTime: newStartTime,
            duration: adjustedDuration,
            isVehicleError,
            isOverlapError
        };
    };

    const calculateSplitDropTarget = (currentX, currentY, splitId) => {
        const targetSplit = splits.find(s => s.id === splitId);
        if (!targetSplit) return null;

        const moveYBlocks = Math.round(currentY / CELL_HEIGHT_PX);
        const moveYMinutes = moveYBlocks * 15;
        let newStartMin = timeToMinutes(targetSplit.time) + moveYMinutes;
        newStartMin = Math.max(timeToMinutes('06:00'), Math.min(timeToMinutes('17:45'), newStartMin));
        const newStartTime = minutesToTime(newStartMin);

        let newDriverId = targetSplit.driverId;
        Object.entries(driverColRefs.current).forEach(([dId, el]) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                if (dragMousePos.x >= rect.left && dragMousePos.x <= rect.right) newDriverId = dId;
            }
        });

        let isOverlapError = false;
        const jobsInCol = jobs.filter(j => j.driverId === newDriverId);
        const hasJobCollision = jobsInCol.some(j => {
            const s = timeToMinutes(j.startTime);
            const e = s + j.duration;
            return newStartMin >= s && newStartMin < e;
        });
        if (hasJobCollision) isOverlapError = true;

        const otherSplits = splits.filter(s => s.driverId === newDriverId && s.id !== splitId);
        const hasSplitCollision = otherSplits.some(s => s.time === newStartTime);
        if (hasSplitCollision) isOverlapError = true;

        return { driverId: newDriverId, time: newStartTime, isOverlapError };
    };

    // ----------------------------------------
    // マウスイベントハンドラ
    // ----------------------------------------
    useEffect(() => {
        const handleMouseMove = (e) => {
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
                        return { ...j, startTime: minutesToTime(newStartMin), duration: newDuration };
                    }
                }));
                return;
            }

            if (draggingJobId) {
                const currentX = e.clientX - dragOffset.x;
                const currentY = e.clientY - dragOffset.y;
                setDragCurrent({ x: currentX, y: currentY });
                setDropPreview(calculateDropTarget(currentX, currentY, draggingJobId));
            }

            if (draggingSplitId) {
                const currentX = e.clientX - dragOffset.x;
                const currentY = e.clientY - dragOffset.y;
                setDragCurrent({ x: currentX, y: currentY });
                setDropSplitPreview(calculateSplitDropTarget(currentX, currentY, draggingSplitId));
            }
        };

        const handleMouseUp = (e) => {
            if (resizingState) {
                recordHistory();
                setResizingState(null);
            }
            if (draggingJobId) {
                const preview = calculateDropTarget(e.clientX - dragOffset.x, e.clientY - dragOffset.y, draggingJobId);
                if (preview && !preview.isOverlapError) {
                    recordHistory();
                    setJobs(prev => prev.map(j => j.id === draggingJobId ? {
                        ...j,
                        startTime: preview.startTime,
                        driverId: preview.driverId,
                        duration: preview.duration,
                        isVehicleError: preview.isVehicleError
                    } : j));
                }
                setDraggingJobId(null);
                setDragButton(null);
                setDragCurrent({ x: 0, y: 0 });
                setDropPreview(null);
            }
            if (draggingSplitId) {
                const preview = calculateSplitDropTarget(e.clientX - dragOffset.x, e.clientY - dragOffset.y, draggingSplitId);
                if (preview && !preview.isOverlapError) {
                    recordHistory();
                    setSplits(prev => prev.map(s => s.id === draggingSplitId ? { ...s, driverId: preview.driverId, time: preview.time } : s));
                }
                setDraggingSplitId(null);
                setDragCurrent({ x: 0, y: 0 });
                setDropSplitPreview(null);
            }
        };

        if (resizingState || draggingJobId || draggingSplitId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingState, draggingJobId, draggingSplitId, dragOffset, jobs, splits, dragButton, dragMousePos, recordHistory]);

    const handleAddJob = (jobTemplate) => {
        if (!selectedCell) return;
        const split = splits.find(s => s.driverId === selectedCell.driverId && s.time === selectedCell.time);
        if (split) return;

        recordHistory();
        const existingJob = jobs.find(job => job.driverId === selectedCell.driverId && job.startTime === selectedCell.time);
        if (existingJob) {
            const restoredPending = { ...existingJob, bucket: existingJob.bucket || 'Free' };
            setPendingJobs(prev => [...prev, restoredPending]);
            setJobs(prev => prev.filter(j => j.id !== existingJob.id));
        }

        const newStartMin = timeToMinutes(selectedCell.time);
        const driver = drivers.find(d => d.id === selectedCell.driverId);
        let currentVeh = driver?.currentVehicle;
        const driverSplits = splits.filter(s => s.driverId === selectedCell.driverId).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        for (const s of driverSplits) {
            if (timeToMinutes(s.time) <= newStartMin) currentVeh = s.vehicle;
            else break;
        }

        let isVehicleError = jobTemplate.requiredVehicle && currentVeh && currentVeh !== jobTemplate.requiredVehicle;

        const newJob = {
            id: `new_${Date.now()}`,
            title: jobTemplate.title,
            driverId: selectedCell.driverId,
            startTime: selectedCell.time,
            duration: jobTemplate.duration,
            bucket: jobTemplate.bucket,
            requiredVehicle: jobTemplate.requiredVehicle,
            isVehicleError: isVehicleError,
            originalCustomerId: jobTemplate.originalCustomerId || jobTemplate.id
        };

        if (existingJob) setJobs(prev => [...prev.filter(j => j.id !== existingJob.id), newJob]);
        else setJobs(prev => [...prev, newJob]);

        setPendingJobs(prev => prev.filter(j => j.id !== jobTemplate.id));
        setSelectedCell(null);
    };

    const isCellOccupied = (driverId, time) => {
        const timeMin = timeToMinutes(time);
        return jobs.some(job => {
            if (job.id === draggingJobId || job.driverId !== driverId) return false;
            const startMin = timeToMinutes(job.startTime);
            const endMin = startMin + job.duration;
            return timeMin > startMin && timeMin < endMin;
        });
    };

    const renderJobHourLines = (job) => {
        const startMin = timeToMinutes(job.startTime);
        const endMin = startMin + job.duration;
        const lines = [];
        let nextHourMin = Math.ceil((startMin + 1) / 60) * 60;
        while (nextHourMin < endMin) {
            const offsetMin = nextHourMin - startMin;
            const topRem = (offsetMin / 15) * QUARTER_HEIGHT_REM;
            lines.push(
                <div key={nextHourMin} className="absolute border-t border-white z-20 pointer-events-none shadow-sm" style={{ top: `calc(${topRem}rem - 0.125rem - 1px)`, left: `calc(-0.25rem - 1px)`, width: `calc(100% + 0.5rem + 2px)` }} />
            );
            nextHourMin += 60;
        }
        return lines;
    };

    const filteredPendingJobs = pendingJobs.filter(job => {
        if (pendingFilter === '全て') return true;
        if (pendingFilter === 'スポット') return job.isSpot === true;
        if (pendingFilter === '時間指定') return job.timeConstraint != null;
        if (pendingFilter === '特殊案件') return job.taskType === 'special';
        return false;
    });

    return (
        <div className="flex flex-col h-screen bg-white text-sm font-sans text-gray-800 select-none">

            {/* Header */}
            <header className="bg-gray-900 text-white p-2 flex justify-between items-center shadow-md z-50 relative">
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors"><Menu size={20} /></button>
                    <h1 className="font-bold text-lg">回収シフト管理</h1>

                    {/* Phase 2.2 & 2.3: Edit Mode Indicator */}
                    {!canEditBoard ? (
                        <span className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm font-bold flex items-center gap-1">
                            🔒 閲覧専用（編集権限なし）
                        </span>
                    ) : editMode ? (
                        <span className="ml-4 px-3 py-1 bg-green-600 rounded text-sm font-bold flex items-center gap-1">
                            ✅ 編集モード
                        </span>
                    ) : (
                        <span className="ml-4 px-3 py-1 bg-yellow-500 text-black rounded text-sm font-bold flex items-center gap-1">
                            👁️ 閲覧モード {lockedBy && `（${lockedBy}が編集中）`}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 mr-4">
                        <button
                            onClick={undo}
                            disabled={!editMode || history.past.length === 0}
                            className={`p-1.5 rounded transition ${(!editMode || history.past.length === 0) ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`}
                            title={editMode ? "元に戻す (Ctrl+Z)" : "閲覧モードでは無効"}
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!editMode || history.future.length === 0}
                            className={`p-1.5 rounded transition ${(!editMode || history.future.length === 0) ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`}
                            title={editMode ? "やり直し (Ctrl+Y)" : "閲覧モードでは無効"}
                        >
                            <Redo2 size={18} />
                        </button>
                    </div>
                    <div className="bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{CURRENT_DATE_KEY}</span>
                    </div>

                    {/* Phase 2.2: Mode Control Buttons */}
                    {editMode ? (
                        <>
                            <button
                                onClick={handleSaveToSupabase}
                                className="bg-white text-gray-900 px-3 py-1 rounded font-bold hover:bg-gray-100 transition"
                            >
                                保存する
                            </button>
                            <button
                                onClick={releaseEditLock}
                                className="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition"
                                title="編集権を解放し、他のユーザーが編集できるようにします"
                            >
                                編集権を解放
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                disabled
                                className="bg-gray-500 text-gray-300 px-3 py-1 rounded font-bold cursor-not-allowed"
                                title="閲覧モードでは保存できません"
                            >
                                保存する
                            </button>
                            {!lockedBy && (
                                <button
                                    onClick={requestEditLock}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-600 transition"
                                >
                                    編集モードに切替
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div className={`absolute top-16 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
                    <span className="font-bold">{notification.message}</span>
                </div>
            )}

            {/* Main Board */}
            <div className="flex-1 overflow-auto relative bg-white" onClick={() => setSelectedJobId(null)}>
                <div className="min-w-max">
                    {/* Sticky Header Row */}
                    <div className="flex border-b border-white bg-black text-white sticky top-0 z-40 shadow-sm">
                        <div className="w-16 flex-shrink-0 border-r border-white bg-gray-900 flex items-center justify-center font-bold sticky left-0 z-50">時間</div>
                        <div className="flex">
                            {drivers.map(driver => (
                                <div
                                    key={driver.id}
                                    className="w-[180px] border-r border-white text-center font-bold flex flex-col cursor-pointer hover:bg-gray-800 transition-colors"
                                    onClick={() => openHeaderEdit(driver.id)}
                                >
                                    {/* ★紙ベースを再現したコース名の黄色い帯（アルファベットのみ） */}
                                    <div className="bg-yellow-400 text-black text-[11px] py-0.5 border-b border-black/20 font-bold tracking-widest">
                                        {driver.course}
                                    </div>
                                    {/* ドライバー・車両情報 */}
                                    <div className="py-2 text-sm">
                                        {driver.name} / {driver.currentVehicle}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex">
                        {/* Time Axis */}
                        <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-300 sticky left-0 z-30">
                            {TIME_SLOTS.map((time) => {
                                const isHour = time.endsWith('00');
                                const borderClass = isHour ? 'border-t border-t-orange-300 border-b border-b-gray-100 font-bold bg-gray-100' : 'border-b border-b-gray-200';
                                return (
                                    <div key={time} className={`h-8 flex items-center justify-end pr-2 text-xs text-gray-500 ${borderClass}`}>
                                        {isHour ? time : `:${time.split(':')[1]}`}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid Cells */}
                        <div className="flex">
                            {drivers.map((driver) => (
                                <div key={driver.id} className="w-[180px] border-r border-gray-300 relative" ref={el => driverColRefs.current[driver.id] = el}>
                                    {TIME_SLOTS.map((time, slotIndex) => {
                                        // DEBUG: Log rendering to identify cutoff point
                                        if (driver.id === drivers[0]?.id && slotIndex % 4 === 0) {
                                            console.log(`[DEBUG] Rendering slot ${slotIndex}: ${time} for driver ${driver.id}`);
                                        }

                                        const isHour = time.endsWith('00');
                                        const borderClass = isHour ? 'border-t border-t-red-200/50' : 'border-b border-b-gray-100/50';

                                        const isSelected = selectedCell?.driverId === driver.id && selectedCell?.time === time;
                                        const isTarget = dropPreview?.driverId === driver.id && dropPreview?.startTime === time;
                                        const isTargetOverlap = dropPreview?.isOverlapError;
                                        const isTargetVehicleError = dropPreview?.isVehicleError;

                                        const isDragSource = draggingJobId && time === minutesToTime(timeToMinutes(jobs.find(j => j.id === draggingJobId)?.startTime)); // Simplified source highlight

                                        let bgClass = "bg-white";
                                        if (isTarget) {
                                            bgClass = isTargetOverlap ? "bg-red-200/80" : (isTargetVehicleError ? "bg-orange-100" : "bg-blue-100");
                                        } else if (isSelected) {
                                            bgClass = "bg-blue-50";
                                        } else if (isHour) {
                                            bgClass = "bg-gray-50/30";
                                        }

                                        return (
                                            <div
                                                key={time}
                                                className={`h-8 box-border ${borderClass} ${bgClass} cursor-cell relative group transition-colors duration-75`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!draggingJobId && !draggingSplitId) setSelectedCell({ driverId: driver.id, time });
                                                }}
                                            >
                                                {/* Cell Content (Hover Add Button etc) */}
                                                {!isCellOccupied(driver.id, time) && isSelected && !draggingJobId && !draggingSplitId && (
                                                    <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                                                        <div className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none">
                                                            選択中
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}


                                    {/* Jobs Layer */}
                                    {jobs.filter(job => job.driverId === driver.id).map(job => {
                                        const startMin = timeToMinutes(job.startTime);
                                        const topRem = ((startMin - 360) / 15) * QUARTER_HEIGHT_REM; // 6:00 = 360min
                                        const heightRem = (job.duration / 15) * QUARTER_HEIGHT_REM;

                                        const isSelected = selectedJobId === job.id;
                                        const isDragging = draggingJobId === job.id;
                                        const isResizing = resizingState?.id === job.id;

                                        // Use centralized Theme Color
                                        const colorTheme = jobColorMap[job.id] || { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };

                                        if (isDragging) return null; // Hide original while dragging (show preview?) or keep generic placeholder? 
                                        // Current logic: Hide original, show drag preview handled by separate layer or just use pointer? 
                                        // React DND usually keeps original ghosted. Let's keep it simple: Hide original.

                                        return (
                                            <div
                                                key={job.id}
                                                className={`absolute w-[94%] left-[3%] rounded-md border text-xs shadow-sm overflow-hidden select-none transition-all duration-200 z-10
                                                    ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}
                                                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-30 shadow-md' : 'hover:shadow-md hover:brightness-95'}
                                                    ${job.isVehicleError ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                                                `}
                                                style={{
                                                    top: `calc(${topRem}rem + 1px)`,
                                                    height: `calc(${heightRem}rem - 3px)`,
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (e.button !== 0) return;
                                                    setDraggingJobId(job.id);
                                                    setDragButton(e.button);
                                                    setDragOffset({ x: e.clientX - e.currentTarget.getBoundingClientRect().left, y: e.clientY - e.currentTarget.getBoundingClientRect().top });
                                                    setDropPreview({ driverId: job.driverId, startTime: job.startTime, duration: job.duration, isOverlapError: false });
                                                    setDragCurrent({ x: 0, y: 0 }); // Reset visual delta
                                                    setSelectedJobId(job.id);
                                                }}
                                                onContextMenu={(e) => handleContextMenu(e, 'job', { jobId: job.id })}
                                                onDoubleClick={(e) => { e.stopPropagation(); openJobEditModel(job.id); }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedJobId(job.id);
                                                }}
                                            >
                                                {/* Top Resize Handle */}
                                                {!isDragging && (
                                                    <div
                                                        className="absolute top-0 left-0 w-full h-2 cursor-ns-resize z-20 hover:bg-black/10 transition-colors"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setResizingState({
                                                                id: job.id,
                                                                direction: 'top',
                                                                startY: e.clientY,
                                                                originalStartTime: job.startTime,
                                                                originalDuration: job.duration
                                                            });
                                                        }}
                                                    />
                                                )}

                                                <div className="px-2 py-1 h-full flex flex-col relative">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold truncate text-[11px] leading-tight">{job.title}</span>
                                                        {job.bucket && <span className="text-[9px] px-1 bg-white/50 rounded ml-1 flex-shrink-0">{job.bucket}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5 opacity-80 text-[10px]">
                                                        <Clock size={10} />
                                                        <span>{job.startTime} - {minutesToTime(timeToMinutes(job.startTime) + job.duration)}</span>
                                                    </div>
                                                    {job.isVehicleError && (
                                                        <div className="absolute bottom-1 right-1 text-red-600 bg-white/80 rounded-full p-0.5" title="車両不一致">
                                                            <AlertTriangle size={12} />
                                                        </div>
                                                    )}
                                                    {renderJobHourLines(job)}
                                                </div>

                                                {/* Bottom Resize Handle */}
                                                {!isDragging && (
                                                    <div
                                                        className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20 flex justify-center items-end pb-0.5 hover:bg-black/10 transition-colors group/handle"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setResizingState({
                                                                id: job.id,
                                                                direction: 'bottom',
                                                                startY: e.clientY,
                                                                originalStartTime: job.startTime,
                                                                originalDuration: job.duration
                                                            });
                                                        }}
                                                    >
                                                        <div className="w-8 h-1 bg-black/10 rounded-full group-hover/handle:bg-black/20" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Splits Drop Preview */}
                                    {dropSplitPreview && dropSplitPreview.driverId === driver.id && (
                                        <div
                                            className="absolute w-full border-t-4 border-dashed z-40 pointer-events-none transition-all duration-75"
                                            style={{
                                                top: `calc(${((timeToMinutes(dropSplitPreview.time) - 360) / 15) * QUARTER_HEIGHT_REM}rem - 2px)`,
                                                borderColor: dropSplitPreview.isOverlapError ? 'red' : 'blue'
                                            }}
                                        >
                                            <div className="absolute -top-7 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                                                {dropSplitPreview.time} 切替
                                            </div>
                                        </div>
                                    )}

                                    {/* Splits Layer */}
                                    {splits.filter(s => s.driverId === driver.id && s.id !== draggingSplitId).map(split => {
                                        const topRem = ((timeToMinutes(split.time) - 360) / 15) * QUARTER_HEIGHT_REM;
                                        return (
                                            <div
                                                key={split.id}
                                                className="absolute w-full z-20 hover:z-50 group"
                                                style={{ top: `calc(${topRem}rem - 1px)` }}
                                            >
                                                {/* Line */}
                                                <div className="border-t-2 border-red-500 border-dashed w-full shadow-sm group-hover:border-red-600 relative">
                                                    {/* Handle Left */}
                                                    <div
                                                        className="absolute -top-3 -left-2 p-1.5 cursor-grab active:cursor-grabbing bg-white/0 hover:bg-white/50 rounded-full transition-colors"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.button !== 0) return;
                                                            setDraggingSplitId(split.id);
                                                            setDragOffset({ x: e.clientX, y: e.clientY }); // Simplified for line
                                                            setDropSplitPreview({ driverId: split.driverId, time: split.time, isOverlapError: false });
                                                            setDragCurrent({ x: 0, y: 0 });
                                                        }}
                                                    >
                                                        <GripVertical size={16} className="text-red-500 drop-shadow-sm" />
                                                    </div>

                                                    {/* Info Label Right */}
                                                    <div
                                                        className="absolute -top-3 right-0 bg-red-100 border border-red-300 text-red-900 text-[10px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer hover:bg-red-200 transition-colors"
                                                        onClick={(e) => openSplitEdit(e, driver.id, split.time)}
                                                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openSplitEdit(e, driver.id, split.time); }} // Simplified: Right click also opens edit for split
                                                    >
                                                        <span className="font-bold">{split.time}</span>
                                                        <span>{split.driverName} / {split.vehicle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar (Pending Jobs) */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 shadow-xl flex flex-col z-50">
                <div className="p-4 bg-white border-b border-gray-200">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <Database size={18} />
                        未割当案件 ({filteredPendingJobs.length})
                    </h2>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {['全て', 'スポット', '時間指定', '特殊案件'].map(f => (
                            <button
                                key={f}
                                onClick={() => setPendingFilter(f)}
                                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${pendingFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredPendingJobs.map(job => {
                        const colorTheme = getPendingJobColor(job);
                        const isSelected = selectedCell && !selectedJobId;

                        return (
                            <div
                                key={job.id}
                                className={`group relative bg-white border ${colorTheme.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98]
                                    ${isSelected ? 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1' : ''}
                                `}
                                onClick={() => isSelected && handleAddJob(job)}
                            >
                                {/* Left Color Strip */}
                                <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-lg ${colorTheme.bg.replace('bg-', 'bg-').replace('100', '400')}`} />
                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-800 text-sm">{job.title}</h3>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${job.bucket === 'AM' ? 'bg-orange-100 text-orange-700' : job.bucket === 'PM' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {job.bucket}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{job.duration}分</span>
                                        </div>
                                        {job.area && <span className="bg-gray-100 px-1 rounded text-[10px]">{job.area}</span>}
                                        {job.requiredVehicle && <span className="text-red-600 font-bold text-[10px] flex items-center gap-0.5"><AlertTriangle size={10} /> {job.requiredVehicle}</span>}
                                    </div>
                                    {job.note && (
                                        <div className="mt-2 text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100 line-clamp-2">
                                            {job.note}
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none transform scale-110">
                                            {selectedCell.driverId} {selectedCell.time} に配置
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredPendingJobs.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            該当する案件はありません
                        </div>
                    )}
                </div>
            </div>

            {/* Overlays (Drag Preview) */}
            {dropPreview && (
                <div
                    className={`fixed pointer-events-none z-[100] border-2 rounded-md shadow-2xl opacity-90 transition-colors
                        ${dropPreview.isOverlapError ? 'bg-red-500/50 border-red-600' : (dropPreview.isVehicleError ? 'bg-orange-400/50 border-orange-500' : 'bg-blue-500/50 border-blue-600')}
                    `}
                    style={{
                        left: dragMousePos.x + 15,
                        top: dragMousePos.y + 15,
                        width: '160px',
                        height: `${(dropPreview.duration / 15) * QUARTER_HEIGHT_REM * PIXELS_PER_REM}px`
                    }}
                >
                    <div className="bg-white/90 text-[10px] font-bold px-2 py-1 rounded-sm inline-block m-1 shadow-sm">
                        {dropPreview.startTime} ({dropPreview.duration}分)
                        {dropPreview.isOverlapError && <span className="block text-red-600">⚠ 重複あり</span>}
                        {dropPreview.isVehicleError && <span className="block text-orange-600">⚠ 車両不適合</span>}
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && contextMenu.type === 'job' && (
                <div
                    className="fixed bg-white border border-gray-200 shadow-xl rounded-md z-[110] py-1 text-sm font-bold min-w-[120px] animate-in fade-in duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => { openJobEditModel(contextMenu.jobId); setContextMenu(null); }}
                    >
                        <Edit3 size={14} /> 編集
                    </button>
                    {/* Future: Color Change, Duplicate etc */}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                        onClick={() => { handleDeleteJob(contextMenu.jobId); setContextMenu(null); }}
                    >
                        <Trash2 size={14} /> 削除
                    </button>
                </div>
            )}

            <BoardModals
                modalState={modalState}
                onClose={() => setModalState({ isOpen: false })}
                onSaveHeader={handleSaveHeader}
                onSaveSplit={handleSaveSplit}
                onDeleteSplit={handleDeleteSplit}
                onSaveJob={handleSaveJob}
                onDeleteJob={(id) => { handleDeleteJob(id); setModalState({ isOpen: false }); }}
            />
        </div>
    );
}

// Ensure the helper function is removed or moved. We already used imported timeUtils.
