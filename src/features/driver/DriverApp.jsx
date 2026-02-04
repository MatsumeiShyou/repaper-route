// src/features/driver/DriverApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Logic & Repositories
import { EventRepository } from '../../lib/eventRepository';
import { PhotoRepository } from '../../lib/photoRepository';
import { JobRepository } from '../../lib/repositories/JobRepository';
import { MISSION_STATES, transitionMissionState } from './logic/missionStateMachine';
import { calculateEodStats } from './logic/reportLogic';


// Components
import { InspectionGate } from './components/InspectionGate';
import { DriverWorkView } from './components/DriverWorkView';
import { DailyReport } from './components/DailyReport';

// Shared UI (Helpers managed here for now, or use context later)
// Note: DriverApp manages generic UI state (toasts, modal) and passes them down.

// --- Safety Guard (Honesty Principle) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Internal Error Screen (Keep simple local component for fatal error)
const FatalErrorScreen = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">システム設定エラー</h1>
        <p className="text-gray-400 mb-8">
            データベースへの接続情報が見つかりません。<br />
            管理者へ連絡してください。
        </p>
    </div>
);

const DEFAULT_DRIVER_ID = 'driver_001';

export default function DriverApp({ initialDriverName = '佐藤 ドライバー', initialVehicle = '車両: 1122AB' }) {
    // Early Return for Safety Check
    if (!supabaseUrl || !supabaseKey) return <FatalErrorScreen />;

    const DRIVER_NAME = initialDriverName;
    const VEHICLE_INFO = initialVehicle.includes('車両') ? initialVehicle : `車両: ${initialVehicle}`;
    const DRIVER_ID = DEFAULT_DRIVER_ID;

    // --- State ---
    const [missionState, setMissionState] = useState(MISSION_STATES.INSPECTION);

    // Domain Data
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inspection, setInspection] = useState([
        { id: 'brake', text: 'ブレーキの効き', checked: false },
        { id: 'tire', text: 'タイヤの空気圧・損傷', checked: false },
        { id: 'oil', text: 'エンジンオイルの量', checked: false },
        { id: 'lamp', text: 'ライト・ウインカーの点灯', checked: false }
    ]);

    // Work Logic State
    const [activeJobId, setActiveJobId] = useState(null);
    const [manualData, setManualData] = useState({
        items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }],
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);
    const [undoStack, setUndoStack] = useState(null);

    // UI State
    const [theme, setTheme] = useState('dark');
    const [toasts, setToasts] = useState([]);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // --- Effects ---
    useEffect(() => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        if (missionState === MISSION_STATES.WORKING) {
            fetchJobs();
            EventRepository.syncAll();
        }
    }, [missionState]);

    // --- Helpers ---
    const addToast = (message, type = 'info', action = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, action }]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const openModal = (title, message, onConfirm) => {
        setModalConfig({
            isOpen: true, title, message,
            onConfirm: onConfirm ? () => { onConfirm(); setModalConfig(prev => ({ ...prev, isOpen: false })); } : null
        });
    };

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // --- Actions ---

    // 1. Inspection
    const handleInspectionCheck = (id) => {
        setInspection(inspection.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const startWork = async () => {
        if (!inspection.every(i => i.checked)) {
            addToast("全ての点検項目を確認してください。", "error");
            return;
        }
        await EventRepository.log(DRIVER_ID, 'INSPECTION_COMPLETE', { inspection });
        setMissionState(transitionMissionState(missionState, 'COMPLETE_INSPECTION'));
        addToast("業務を開始します。安全運転で！", "success");
    };

    // 2. Work (Jobs)
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await JobRepository.fetchJobs(DRIVER_ID);
            if (jobs.length === 0) {
                setJobs(data);
            }
        } catch (e) {
            console.error("Failed to fetch jobs", e);
        }
        setLoading(false);
    };

    const handleJobUpdate = async (jobId, newStatus) => {
        const job = jobs.find(j => j.id === jobId);
        if (newStatus === 'COMPLETED' && job) {
            setUndoStack({ jobId, prevStatus: job.status, prevResult: job.result_items, prevActiveId: activeJobId });
        }

        // Optimistic UI Update
        const timestamp = new Date().toISOString();
        const updatedJobs = jobs.map(j => {
            if (j.id === jobId) {
                if (newStatus === 'COMPLETED') {
                    return { ...j, status: newStatus, result_items: manualData.items, completed_at: timestamp };
                }
                return { ...j, status: newStatus };
            }
            return j;
        });
        setJobs(updatedJobs);

        // Persistence (Fire & Forget)
        const additionalData = newStatus === 'COMPLETED' ? { result_items: manualData.items, completed_at: timestamp } : {};
        JobRepository.updateJobStatus(jobId, newStatus, additionalData).catch(err =>
            addToast("ステータスの保存に失敗しました(リロードで戻る可能性があります)", "error")
        );

        if (newStatus === 'MOVING' || newStatus === 'ARRIVED' || newStatus === 'WORKING') {
            setActiveJobId(jobId);
        } else if (newStatus === 'COMPLETED') {
            setActiveJobId(null);
            completeJobLogic(jobId, updatedJobs);
        } else {
            setActiveJobId(null);
        }
    };

    const completeJobLogic = async (jobId, currentJobs) => {
        if (manualData.photo) {
            try {
                const result = await PhotoRepository.uploadPhoto(manualData.photo, jobId);
                await EventRepository.log(DRIVER_ID, 'PHOTO_UPLOADED', { job_id: jobId, photo_url: result.url });
            } catch (e) {
                addToast("写真のアップロードに失敗しましたが、完了処理を続行します。", "error");
            }
        }

        const unfinished = currentJobs.filter(j => j.status !== 'COMPLETED');
        if (unfinished.length === 0) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
            addToast("全案件完了！お疲れ様でした！", "success");
        } else {
            addToast("案件完了！", "success",
                <button onClick={handleUndo} className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <RotateCcw size={12} /> 元に戻す
                </button>
            );
        }

        setManualData({ items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }], photo: null });
        setPhotoPreview(null);
    };

    const handleUndo = () => {
        if (!undoStack) return;
        setJobs(prev => prev.map(j => j.id === undoStack.jobId ? { ...j, status: undoStack.prevStatus, result_items: undoStack.prevResult } : j));
        setActiveJobId(undoStack.prevActiveId);
        setUndoStack(null);
        addToast("操作を元に戻しました。", "info");
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setManualData(prev => ({ ...prev, photo: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const startEndOfDay = () => {
        openModal("業務終了確認", "全ての業務を終了し、帰社報告を行いますか？",
            () => setMissionState(transitionMissionState(missionState, 'START_EOD'))
        );
    };

    // 3. Report
    const submitEndOfDay = async (weightInput, onSuccess) => {
        try {
            // Logic Extraction: EOD Stats
            const report = calculateEodStats(jobs, weightInput);

            const payload = {
                ...report,
                driver_id: DRIVER_ID,
                vehicle: VEHICLE_INFO,
                timestamp: new Date().toISOString()
            };

            await EventRepository.log(DRIVER_ID, 'DAILY_REPORT', payload);
            await EventRepository.syncAll();

            openModal("報告完了", `業務終了報告が完了しました。\n総重量: ${report.totalWeight}kg\n(按分比率: ${(report.ratio * 100).toFixed(1)}%)`, () => {
                onSuccess(); // Reset local form
                setMissionState(transitionMissionState(missionState, 'SUBMIT_REPORT'));
            });

        } catch (e) {
            addToast(e.message, "error");
        }
    };

    // --- Render ---
    if (missionState === MISSION_STATES.INSPECTION) {
        return <InspectionGate
            vehicleInfo={VEHICLE_INFO}
            inspectionItems={inspection}
            onCheck={handleInspectionCheck}
            onStartWork={startWork}
            theme={theme}
            onToggleTheme={toggleTheme}
            toasts={toasts}
            removeToast={removeToast}
        />;
    }

    if (missionState === MISSION_STATES.REPORTING) {
        return <DailyReport
            toasts={toasts}
            removeToast={removeToast}
            modalConfig={modalConfig}
            setModalConfig={setModalConfig}
            onSubmit={submitEndOfDay}
            onCancel={() => setMissionState(transitionMissionState(missionState, 'CANCEL_REPORT'))}
        />;
    }

    // Default: WORKING (or READY/COMPLETED handled by WorkView)
    return <DriverWorkView
        driverName={DRIVER_NAME}
        vehicleInfo={VEHICLE_INFO}
        theme={theme}
        onToggleTheme={toggleTheme}
        toasts={toasts}
        removeToast={removeToast}
        jobs={jobs}
        loading={loading}
        activeJobId={activeJobId}
        photoPreview={photoPreview}
        manualData={manualData}
        onManualDataChange={(idx, val) => {
            const newItems = [...manualData.items];
            newItems[idx].weight = val;
            setManualData({ ...manualData, items: newItems });
        }}
        onPhotoClick={() => fileInputRef.current?.click()}
        onPhotoReset={() => { setManualData(prev => ({ ...prev, photo: null })); setPhotoPreview(null); }}
        onPhotoSelect={handlePhotoSelect}
        fileInputRef={fileInputRef}
        onJobUpdate={handleJobUpdate}
        addToast={addToast}
        openModal={openModal}
        onStartEOD={startEndOfDay}
        modalConfig={modalConfig}
        setModalConfig={setModalConfig}
    />;
}
