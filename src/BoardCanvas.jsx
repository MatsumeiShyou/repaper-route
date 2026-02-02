import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Calendar,
    Search,
    X,
    GripVertical,
    Sun,
    Moon,
    Clock,
    Database,
    AlertTriangle,
    Ban,
    Edit3,
    Trash2,
    Undo2,
    Redo2,
    Menu
} from 'lucide-react';
import { supabase } from './lib/supabase';

// ==========================================
// 1. データ定義 (マスタ & モック)
// ==========================================

// カラーパレット定義 (18色)
const COLOR_PALETTE = [
    { name: 'Red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
    { name: 'Orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
    { name: 'Amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900' },
    { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
    { name: 'Lime', bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-900' },
    { name: 'Green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
    { name: 'Emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900' },
    { name: 'Teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900' },
    { name: 'Cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900' },
    { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900' },
    { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
    { name: 'Indigo', bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900' },
    { name: 'Violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-900' },
    { name: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900' },
    { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
    { name: 'Rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900' },
    { name: 'Slate', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-900' },
];

const MASTER_DRIVERS_LIST = ['畑澤', '菊地', '万里', '片山', '大貴', '鈴木', '佐藤', '田中'];
const MASTER_VEHICLES_LIST = ['2025PK', '2267PK', '2618PK', '5122PK', '1111PK', '西濃運輸', '予備車', 'レンタカー'];

const CUSTOMERS = [
    { id: 'c1', name: '富士ロジ長沼', area: '厚木', defaultDuration: 45, visits: [{ type: 'AM', label: '午前便' }, { type: 'PM', label: '午後便' }] },
    { id: 'c2', name: 'ESPOT(スポット)', area: '伊勢原', defaultDuration: 30, visits: [{ type: 'Free', label: '回収', note: '要電話' }] },
    { id: 'c3', name: 'リバークレイン', area: '横浜', defaultDuration: 45, visits: [{ type: 'AM', label: '回収', note: '9時以降' }] },
    { id: 'c4', name: 'ユニマット', area: '厚木', defaultDuration: 15, visits: [{ type: 'Free', label: '回収' }] },
    { id: 'c5', name: '特別工場A', area: '海老名', defaultDuration: 60, requiredVehicle: '2025PK', visits: [{ type: 'AM', label: '指定車限定', note: '車両注意' }] },
    { id: 'c99', name: '富士電線', area: '厚木', defaultDuration: 30, visits: [] },
    { id: 'c98', name: '厚木事業所', area: '厚木', defaultDuration: 60, visits: [] },
];

const INITIAL_DRIVERS = [
    { id: 'd1', name: '畑澤', currentVehicle: '2025PK', color: 'bg-blue-50 border-blue-200', defaultSplit: null, course: 'A' },
    { id: 'd2', name: '菊地', currentVehicle: '2267PK', color: 'bg-green-50 border-green-200', defaultSplit: null, course: 'B' },
    { id: 'd3', name: '万里', currentVehicle: '2618PK', color: 'bg-purple-50 border-purple-200', defaultSplit: { time: '13:00', driverName: '大貴', vehicle: '西濃運輸' }, course: 'C' },
    { id: 'd4', name: '片山', currentVehicle: '5122PK', color: 'bg-orange-50 border-orange-200', defaultSplit: { time: '13:00', driverName: '片山', vehicle: '1111PK' }, course: 'D' },
];

const TIME_SLOTS = [];
for (let h = 6; h < 18; h++) {
    ['00', '15', '30', '45'].forEach(m => {
        TIME_SLOTS.push(`${h}:${m}`);
    });
}

const INITIAL_JOBS = [
    { id: 'j1', title: '富士電線', driverId: 'd1', startTime: '6:30', duration: 30, bucket: 'AM', originalCustomerId: 'c99' },
    { id: 'j2', title: '厚木事業所', driverId: 'd2', startTime: '7:00', duration: 60, bucket: 'AM', originalCustomerId: 'c98' },
];

// ==========================================
// 2. 定数 & ヘルパー
// ==========================================
const QUARTER_HEIGHT_REM = 2;
const PIXELS_PER_REM = 16;
const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;
const CURRENT_DATE_KEY = '2025-01-24'; // 仮の日付キー

const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
};

const getHashIndex = (str, max) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
};

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

    // 履歴管理State
    const [history, setHistory] = useState({ past: [], future: [] });

    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);

    // 編集モーダル用State
    const [editModal, setEditModal] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', vehicle: '' });

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
    const [pendingFilter, setPendingFilter] = useState('all');
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
                    if (data.jobs) setJobs(data.jobs);
                    if (data.drivers) setDrivers(data.drivers);
                    if (data.splits) setSplits(data.splits);
                    if (data.pending) setPendingJobs(data.pending);
                    setIsOffline(false);
                } else {
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
                    generateInitialData();
                }
            } finally {
                setIsDataLoaded(true);
                setIsSyncing(false);
            }
        };

        const generateInitialData = () => {
            const generatedPendingJobs = [];
            const targetCustomers = CUSTOMERS.filter(c => ['c1', 'c2', 'c3', 'c4', 'c5'].includes(c.id));

            targetCustomers.forEach(customer => {
                customer.visits.forEach((visit, index) => {
                    generatedPendingJobs.push({
                        id: `p_${customer.id}_${index}`,
                        title: customer.name + (visit.label ? ` (${visit.label})` : ''),
                        duration: customer.defaultDuration,
                        note: visit.note || '',
                        area: customer.area,
                        bucket: visit.type,
                        originalCustomerId: customer.id,
                        requiredVehicle: customer.requiredVehicle
                    });
                });
            });
            setPendingJobs(generatedPendingJobs);

            const initialSplits = INITIAL_DRIVERS.map((d) => {
                const base = { id: `split_${d.id}_init`, driverId: d.id };
                if (d.defaultSplit) {
                    return { ...base, time: d.defaultSplit.time, driverName: d.defaultSplit.driverName, vehicle: d.defaultSplit.vehicle };
                }
                return { ...base, time: '13:00', driverName: d.name, vehicle: d.currentVehicle };
            });
            setSplits(initialSplits);
        };

        initializeData();
    }, []);

    // ----------------------------------------
    // 同期保存ロジック (Write) [Dual Save + Sync]
    // ----------------------------------------
    useEffect(() => {
        if (!isDataLoaded) return;

        const saveData = async () => {
            // LocalStorage
            localStorage.setItem('repaper_route_jobs', JSON.stringify(jobs));
            localStorage.setItem('repaper_route_drivers', JSON.stringify(drivers));
            localStorage.setItem('repaper_route_splits', JSON.stringify(splits));
            localStorage.setItem('repaper_route_pending', JSON.stringify(pendingJobs));

            // Supabase
            setIsSyncing(true);
            try {
                const { error } = await supabase
                    .from('routes')
                    .upsert({
                        date: CURRENT_DATE_KEY,
                        jobs,
                        drivers,
                        splits,
                        pending: pendingJobs,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'date' });

                if (error) throw error;
                setIsOffline(false);
            } catch (err) {
                console.error("Supabase sync failed:", err);
                setIsOffline(true);
            } finally {
                setIsSyncing(false);
            }
        };

        saveData();
    }, [jobs, drivers, splits, pendingJobs, isDataLoaded]);

    // ----------------------------------------
    // Smart Coloring Logic
    // ----------------------------------------
    const jobColorMap = useMemo(() => {
        const map = {};
        const paletteLength = COLOR_PALETTE.length;
        const driverOrder = drivers.map(d => d.id);

        const sortedJobs = [...jobs].sort((a, b) => {
            const driverIndexA = driverOrder.indexOf(a.driverId);
            const driverIndexB = driverOrder.indexOf(b.driverId);
            if (driverIndexA !== driverIndexB) return driverIndexA - driverIndexB;
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });

        let globalColorIndex = 0;

        sortedJobs.forEach(job => {
            let candidateIndex = globalColorIndex;
            const avoidIndices = new Set();

            const currentJobStart = timeToMinutes(job.startTime);
            const prevJobInCol = sortedJobs
                .filter(j => j.driverId === job.driverId && timeToMinutes(j.startTime) < currentJobStart)
                .pop();

            if (prevJobInCol && map[prevJobInCol.id]) {
                const prevIdx = COLOR_PALETTE.indexOf(map[prevJobInCol.id]);
                if (prevIdx >= 0) avoidIndices.add(prevIdx);
            }

            const myDriverIdx = driverOrder.indexOf(job.driverId);
            if (myDriverIdx > 0) {
                const leftDriverId = driverOrder[myDriverIdx - 1];
                const currentJobEnd = currentJobStart + job.duration;
                const leftJobs = sortedJobs.filter(j => j.driverId === leftDriverId);

                leftJobs.forEach(leftJob => {
                    const lStart = timeToMinutes(leftJob.startTime);
                    const lEnd = lStart + leftJob.duration;
                    if (currentJobStart < lEnd && currentJobEnd > lStart) {
                        if (map[leftJob.id]) {
                            const leftIdx = COLOR_PALETTE.indexOf(map[leftJob.id]);
                            if (leftIdx >= 0) avoidIndices.add(leftIdx);
                        }
                    }
                });
            }

            let loopCount = 0;
            while (avoidIndices.has(candidateIndex) && loopCount < paletteLength) {
                candidateIndex = (candidateIndex + 1) % paletteLength;
                loopCount++;
            }

            map[job.id] = COLOR_PALETTE[candidateIndex];
            globalColorIndex = (candidateIndex + 1) % paletteLength;
        });

        return map;
    }, [jobs, drivers]);

    const getPendingJobColor = (job) => {
        const seed = job.originalCustomerId || job.id;
        const index = getHashIndex(seed, COLOR_PALETTE.length);
        return COLOR_PALETTE[index];
    };

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
            if (editModal || selectedCell) return;
            if (!selectedJobId) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                handleDeleteJob(selectedJobId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedJobId, jobs, editModal, selectedCell, undo, redo]);

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
        setEditForm({ name: driver.name, vehicle: driver.currentVehicle });
        setEditModal({
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

        const initialName = split ? split.driverName : (driver?.name || '');
        const initialVehicle = split ? split.vehicle : (driver?.currentVehicle || '');
        setEditForm({ name: initialName, vehicle: initialVehicle });

        setEditModal({
            isOpen: true,
            type: 'split',
            targetId: driverId,
            time: time,
            initialDriverName: initialName,
            initialVehicle: initialVehicle
        });
    };

    const handleSaveEdit = (newName, newVehicle) => {
        if (!editModal) return;
        recordHistory();
        if (editModal.type === 'header') {
            setDrivers(prev => prev.map(d => d.id === editModal.targetId ? { ...d, name: newName, currentVehicle: newVehicle } : d));
        } else if (editModal.type === 'split' && editModal.time) {
            setSplits(prev => {
                const idx = prev.findIndex(s => s.driverId === editModal.targetId && s.time === editModal.time);
                if (idx >= 0) {
                    const newSplits = [...prev];
                    newSplits[idx] = { ...newSplits[idx], driverName: newName, vehicle: newVehicle };
                    return newSplits;
                } else {
                    return [...prev, { id: `split_${editModal.targetId}_${Date.now()}`, driverId: editModal.targetId, time: editModal.time, driverName: newName, vehicle: newVehicle }];
                }
            });
        }
        setEditModal(null);
    };

    const handleDeleteSplit = () => {
        if (!editModal || editModal.type !== 'split' || !editModal.time) return;
        recordHistory();
        setSplits(prev => prev.filter(s => !(s.driverId === editModal.targetId && s.time === editModal.time)));
        setEditModal(null);
    };

    const handleContextMenu = (e, driverId, time) => {
        e.preventDefault();
        if (draggingJobId || draggingSplitId) return;
        recordHistory();
        setSplits(prev => {
            const existingIndex = prev.findIndex(s => s.driverId === driverId && s.time === time);
            if (existingIndex >= 0) {
                return prev.filter((_, i) => i !== existingIndex);
            } else {
                const driver = drivers.find(d => d.id === driverId);
                return [...prev, { id: `split_${driverId}_${Date.now()}`, driverId, time, driverName: driver?.name || '担当', vehicle: driver?.currentVehicle || '車両' }];
            }
        });
    };

    // ----------------------------------------
    // ドロップ判定ロジック
    // ----------------------------------------
    const calculateDropTarget = (currentX, currentY, targetJobId) => {
        const targetJob = jobs.find(j => j.id === targetJobId);
        if (!targetJob) return null;

        const moveYBlocks = Math.round(currentY / CELL_HEIGHT_PX);
        const moveYMinutes = moveYBlocks * 15;
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

        let newDuration = targetJob.duration;
        let isOverlapError = false;

        const driverSplits = splits.filter(s => s.driverId === newDriverId);
        const splitAtStart = driverSplits.find(s => s.time === newStartTime);
        if (splitAtStart) isOverlapError = true;

        const otherJobs = jobs.filter(j => j.driverId === newDriverId && j.id !== targetJobId);
        const isStartOverlapping = otherJobs.some(other => {
            const s = timeToMinutes(other.startTime);
            const e = s + other.duration;
            return newStartMin >= s && newStartMin < e;
        });

        if (isStartOverlapping) {
            isOverlapError = true;
        } else {
            const tentativeEndMin = newStartMin + newDuration;
            let nearestObstacleStart = 99999;
            const conflictingJob = otherJobs.find(other => {
                const s = timeToMinutes(other.startTime);
                return s >= newStartMin && s < tentativeEndMin;
            });
            if (conflictingJob) nearestObstacleStart = timeToMinutes(conflictingJob.startTime);

            const conflictingSplit = driverSplits.find(s => {
                const sMin = timeToMinutes(s.time);
                return sMin > newStartMin && sMin < tentativeEndMin;
            });
            if (conflictingSplit) {
                const sMin = timeToMinutes(conflictingSplit.time);
                if (sMin < nearestObstacleStart) nearestObstacleStart = sMin;
            }

            if (nearestObstacleStart !== 99999) {
                const availableDuration = nearestObstacleStart - newStartMin;
                if (availableDuration < 15) {
                    isOverlapError = true;
                    newDuration = 15;
                } else {
                    newDuration = availableDuration;
                }
            } else if (dragButton === 2) {
                newDuration = 15;
            }
        }

        const driver = drivers.find(d => d.id === newDriverId);
        let currentVeh = driver?.currentVehicle;
        const sortedSplits = [...driverSplits].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        for (const split of sortedSplits) {
            if (timeToMinutes(split.time) <= newStartMin) currentVeh = split.vehicle;
            else break;
        }

        let isVehicleError = false;
        if (targetJob.requiredVehicle && currentVeh && currentVeh !== targetJob.requiredVehicle) {
            isVehicleError = true;
        }

        return { driverId: newDriverId, startTime: newStartTime, duration: newDuration, isVehicleError, isOverlapError };
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

    const filteredPendingJobs = pendingJobs.filter(job => pendingFilter === 'all' || job.bucket === pendingFilter);

    return (
        <div className="flex flex-col h-screen bg-white text-sm font-sans text-gray-800 select-none">

            {/* Header */}
            <header className="bg-gray-900 text-white p-2 flex justify-between items-center shadow-md z-50 relative">
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors"><Menu size={20} /></button>
                    <h1 className="font-bold text-lg">回収シフト管理</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 mr-4">
                        <button onClick={undo} disabled={history.past.length === 0} className={`p-1.5 rounded transition ${history.past.length === 0 ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`} title="元に戻す (Ctrl+Z)"><Undo2 size={18} /></button>
                        <button onClick={redo} disabled={history.future.length === 0} className={`p-1.5 rounded transition ${history.future.length === 0 ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`} title="やり直し (Ctrl+Y)"><Redo2 size={18} /></button>
                    </div>
                    <div className="bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
                        <Calendar size={16} />
                        <span>2025年 1月 24日 (金)</span>
                    </div>
                    <button onClick={() => supabase.rpc('trigger_manual_sync')} className="bg-white text-gray-900 px-3 py-1 rounded font-bold hover:bg-gray-100 transition">保存する</button>
                </div>
            </header>

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
                                    {TIME_SLOTS.map((time) => {
                                        const isOccupied = isCellOccupied(driver.id, time);
                                        const job = jobs.find(j => j.driverId === driver.id && j.startTime === time);
                                        const split = splits.find(s => s.driverId === driver.id && s.time === time);
                                        const isHour = time.endsWith('00');
                                        const borderClass = isHour ? 'border-t border-t-orange-300 border-b border-b-gray-100' : 'border-b border-b-gray-100';
                                        const isPreviewStart = dropPreview && dropPreview.driverId === driver.id && dropPreview.startTime === time;
                                        const isSplitPreviewStart = dropSplitPreview && dropSplitPreview.driverId === driver.id && dropSplitPreview.time === time;

                                        return (
                                            <div key={time} className={`h-8 ${borderClass} relative`} onContextMenu={(e) => handleContextMenu(e, driver.id, time)}>

                                                {split && (
                                                    <div className={`absolute inset-0 bg-black text-white flex items-center justify-center text-sm font-bold z-10 border-b border-white cursor-pointer hover:bg-gray-800 transition-colors ${draggingSplitId === split.id ? 'opacity-50' : ''}`} onClick={(e) => openSplitEdit(e, driver.id, time)}>
                                                        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/20" onMouseDown={(e) => { e.stopPropagation(); setDraggingSplitId(split.id); setDragOffset({ x: e.clientX, y: e.clientY }); }}>
                                                            <GripVertical size={12} className="text-gray-400" />
                                                        </div>
                                                        {split.driverName} / {split.vehicle}
                                                    </div>
                                                )}

                                                {isSplitPreviewStart && (
                                                    <div className={`absolute inset-0 z-50 flex items-center justify-center text-xs font-bold border-2 ${dropSplitPreview.isOverlapError ? 'bg-red-600/80 border-red-800 text-white' : 'bg-black/50 border-black text-white'}`}>
                                                        {dropSplitPreview.isOverlapError ? <Ban size={14} /> : '移動先'}
                                                    </div>
                                                )}

                                                {isPreviewStart && (
                                                    <div className={`absolute left-0 right-0 z-30 border-2 rounded pointer-events-none flex flex-col p-1 shadow-sm transition-all duration-75 ${dropPreview.isOverlapError ? 'bg-red-200/90 border-red-600 z-50' : dropPreview.isVehicleError ? 'bg-red-50/90 border-red-400' : 'bg-emerald-50/90 border-emerald-400'}`} style={{ top: 0, height: `${(dropPreview.duration / 15) * QUARTER_HEIGHT_REM}rem` }}>
                                                        <div className="flex justify-between items-start">
                                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${dropPreview.isOverlapError ? 'bg-red-600 text-white' : dropPreview.isVehicleError ? 'bg-red-100 text-red-700' : 'bg-white/80 text-emerald-800'}`}>
                                                                {dropPreview.isOverlapError && <Ban size={10} />}
                                                                {dropPreview.isOverlapError ? '移動不可' : `${dropPreview.startTime} (${dropPreview.duration}分)`}
                                                            </div>
                                                            {!dropPreview.isOverlapError && dropPreview.isVehicleError && <AlertTriangle size={14} className="text-red-600 bg-white rounded-full shadow-sm" />}
                                                        </div>
                                                    </div>
                                                )}

                                                {job && (
                                                    <div
                                                        className={`px-1 py-0.5 group/card transition-transform duration-75 absolute top-0 left-0 w-full rounded shadow-sm border p-1 text-xs font-bold leading-tight flex flex-col justify-center ${job.isVehicleError ? 'bg-red-100 text-red-900 border-red-500' : `${(jobColorMap[job.id] || COLOR_PALETTE[0]).bg} ${(jobColorMap[job.id] || COLOR_PALETTE[0]).text} ${(jobColorMap[job.id] || COLOR_PALETTE[0]).border}`} ${draggingJobId === job.id ? 'opacity-40 shadow-none ring-0' : 'hover:brightness-95'} ${selectedJobId === job.id ? 'ring-2 ring-blue-600 z-40' : 'z-20'}`}
                                                        style={{ height: `${(job.duration / 15) * QUARTER_HEIGHT_REM}rem`, transform: draggingJobId === job.id ? `translate(${dragCurrent.x}px, ${dragCurrent.y - 60}px)` : 'none' }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); }}
                                                        onDoubleClick={(e) => { e.stopPropagation(); setSelectedCell({ driverId: driver.id, time }); }}
                                                    >
                                                        {renderJobHourLines(job)}
                                                        {job.isVehicleError && <div className="absolute top-0 right-0 p-0.5 z-30 bg-red-500 text-white rounded-bl-md shadow"><AlertTriangle size={12} /></div>}
                                                        <div className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-black/10 transition-colors rounded-t" onMouseDown={(e) => { e.stopPropagation(); recordHistory(); setResizingState({ id: job.id, direction: 'top', startY: e.clientY, originalDuration: job.duration, originalStartTime: job.startTime }); }} />
                                                        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 hover:bg-black/5 rounded-l" onMouseDown={(e) => { e.stopPropagation(); if (e.button === 2) e.preventDefault(); setDraggingJobId(job.id); setSelectedJobId(job.id); setDragButton(e.button); setDragOffset({ x: e.clientX, y: e.clientY }); setDragCurrent({ x: 0, y: 0 }); setDragMousePos({ x: e.clientX, y: e.clientY }); }}>
                                                            <GripVertical size={12} className="text-black/20" />
                                                        </div>
                                                        <div className="truncate pl-5 pointer-events-none">{job.title}</div>
                                                        {job.duration > 15 && <div className="text-[10px] opacity-75 font-normal pl-5 pointer-events-none">{job.startTime} - ({job.duration}分)</div>}
                                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-black/10 transition-colors rounded-b" onMouseDown={(e) => { e.stopPropagation(); recordHistory(); setResizingState({ id: job.id, direction: 'bottom', startY: e.clientY, originalDuration: job.duration, originalStartTime: job.startTime }); }} />
                                                    </div>
                                                )}

                                                {!job && !isOccupied && !split && <div className="absolute inset-0 hover:bg-emerald-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedCell({ driverId: driver.id, time }); }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {selectedCell && !editModal && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setSelectedCell(null)}></div>
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-300">{drivers.find(d => d.id === selectedCell.driverId)?.name} / {selectedCell.time}〜</div>
                                    <div className="font-bold flex items-center gap-2"><Database size={16} />未配車リスト (自動生成)</div>
                                </div>
                                <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                            </div>
                            <div className="p-2 border-b bg-gray-50 flex items-center gap-2"><Search size={16} className="text-gray-400" /><input type="text" placeholder="案件名で検索..." className="w-full bg-transparent outline-none text-sm" /></div>
                            <div className="flex border-b text-xs font-bold text-gray-500 bg-gray-50">
                                {[{ id: 'all', label: 'すべて', icon: null, color: 'emerald' }, { id: 'AM', label: 'AM', icon: Sun, color: 'orange' }, { id: 'PM', label: 'PM', icon: Moon, color: 'indigo' }, { id: 'Free', label: '指定なし', icon: Clock, color: 'gray' }].map(tab => (
                                    <button key={tab.id} onClick={() => setPendingFilter(tab.id)} className={`flex-1 py-2 hover:bg-white border-b-2 flex items-center justify-center gap-1 ${pendingFilter === tab.id ? `border-${tab.color}-500 text-${tab.color}-700 bg-white` : 'border-transparent'}`}>
                                        {tab.icon && <tab.icon size={12} />} {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="overflow-y-auto flex-1 bg-white">
                                {filteredPendingJobs.length === 0 && <div className="p-8 text-center text-gray-400 text-xs">該当する案件はありません</div>}
                                {filteredPendingJobs.map(job => (
                                    <div key={job.id} onClick={() => handleAddJob(job)} className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border min-w-[30px] text-center ${job.bucket === 'AM' ? 'bg-orange-100 text-orange-700 border-orange-200' : job.bucket === 'PM' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{job.bucket || 'Free'}</span>
                                                <span className={`w-3 h-3 rounded-full ${getPendingJobColor(job).bg} border ${getPendingJobColor(job).border}`}></span>
                                                <span className="font-bold text-gray-800 group-hover:text-blue-700 truncate">{job.title}</span>
                                            </div>
                                            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap ml-2">{job.duration}分</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500 flex gap-2 pl-1 items-center">
                                            {job.area && <span>📍{job.area}</span>}
                                            {job.requiredVehicle && <span className="text-red-600 bg-red-50 px-1 rounded flex items-center gap-0.5 border border-red-100"><AlertTriangle size={10} /> 必須: {job.requiredVehicle}</span>}
                                            {job.note && <span className="text-red-500">⚠ {job.note}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Edit Modal (Header / Split) */}
                {editModal && (
                    <>
                        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setEditModal(null)}></div>
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2"><Edit3 size={18} />{editModal.type === 'header' ? '担当者・車両の変更' : '区切り線(交代)の編集'}</h3>
                                <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                            </div>
                            <div className="space-y-3">
                                {editModal.type === 'split' && <div className="text-xs text-gray-500 mb-2">時間: <span className="font-bold text-gray-800">{editModal.time}</span> 以降</div>}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ドライバー名</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    >
                                        <option value="">選択してください</option>
                                        {MASTER_DRIVERS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">車両名</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        value={editForm.vehicle}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, vehicle: e.target.value }))}
                                    >
                                        <option value="">選択してください</option>
                                        {MASTER_VEHICLES_LIST.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    {editModal.type === 'split' && <button onClick={handleDeleteSplit} className="px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 flex items-center justify-center" title="削除"><Trash2 size={16} /></button>}
                                    <button onClick={() => setEditModal(null)} className="flex-1 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">キャンセル</button>
                                    <button onClick={() => handleSaveEdit(editForm.name, editForm.vehicle)} className="flex-1 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 shadow-sm">保存する</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
