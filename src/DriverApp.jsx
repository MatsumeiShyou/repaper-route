// src/DriverApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckSquare, LogOut, Camera, X, AlertTriangle, Sun, Moon, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventRepository } from './lib/eventRepository';
import { PhotoRepository } from './lib/photoRepository';
import { JobCard } from './components/JobCard';
import { Modal } from './components/Modal';
import { Toast, ToastContainer } from './components/Toast';
import { JobCardSkeleton } from './components/Skeleton';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Safety Guard (Honesty Principle) ---
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase Configuration Missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_DRIVER_ID = 'driver_001';

// Internal Error Screen Component
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
        <div className="bg-gray-800 p-4 rounded-lg text-left text-xs font-mono text-red-300 w-full max-w-sm overflow-x-auto">
            ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.
        </div>
    </div>
);

export default function DriverApp({ initialDriverName = '佐藤 ドライバー', initialVehicle = '車両: 1122AB' }) {
    // Early Return for Safety Check
    if (!supabaseUrl || !supabaseKey) return <FatalErrorScreen />;

    const DRIVER_NAME = initialDriverName;
    const VEHICLE_INFO = initialVehicle.includes('車両') ? initialVehicle : `車両: ${initialVehicle}`;
    const DRIVER_ID = DEFAULT_DRIVER_ID;

    // --- State ---
    const [viewMode, setViewMode] = useState('inspection'); // 'inspection' | 'work' | 'end_of_day'
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Premium UI State
    const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
    const [toasts, setToasts] = useState([]);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [undoStack, setUndoStack] = useState(null); // { jobId, prevStatus, prevResult, prevActiveId }

    // Inspection State
    const [inspection, setInspection] = useState([
        { id: 'brake', text: 'ブレーキの効き', checked: false },
        { id: 'tire', text: 'タイヤの空気圧・損傷', checked: false },
        { id: 'oil', text: 'エンジンオイルの量', checked: false },
        { id: 'lamp', text: 'ライト・ウインカーの点灯', checked: false }
    ]);

    // End of Day State
    const [eodWeight, setEodWeight] = useState('');

    // State Machine & Logic
    const [activeJobId, setActiveJobId] = useState(null);
    const [manualData, setManualData] = useState({
        items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }],
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    // --- Effects ---

    // Theme Effect
    useEffect(() => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
    }, [theme]);

    // Data Fetch Effect
    useEffect(() => {
        if (viewMode === 'work') {
            fetchJobs();
            EventRepository.syncAll();
        }
    }, [viewMode]);

    // --- UI Helpers ---

    const addToast = (message, type = 'info', action = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, action }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const openModal = (title, message, onConfirm) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // --- Logic Handlers ---

    const handleInspectionCheck = (id) => {
        setInspection(inspection.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const startWork = async () => {
        if (!inspection.every(i => i.checked)) {
            addToast("全ての点検項目を確認してください。", "error");
            return;
        }
        await EventRepository.log(DRIVER_ID, 'INSPECTION_COMPLETE', { inspection });
        setViewMode('work');
        addToast("業務を開始します。安全運転で！", "success");
    };

    const fetchJobs = async () => {
        setLoading(true);
        // Simulate network delay for Skeleton demo (Premium UX)
        await new Promise(r => setTimeout(r, 800));

        if (jobs.length === 0) {
            setJobs([
                { id: 'job_1', customer_name: 'アール', address: '神奈川県座間市', status: 'PENDING', items: [{ name: '段ボール' }, { name: '雑誌' }] },
                { id: 'job_2', customer_name: '旭運送', address: '神奈川県綾瀬市', status: 'PENDING', special_notes: '要フレコンバッグ', items: [{ name: 'ミックス' }] },
                { id: 'job_3', customer_name: 'XYZ倉庫', address: '神奈川県海老名市', status: 'PENDING', special_notes: '12時必着', items: [{ name: '機密書類' }] },
            ]);
        }
        setLoading(false);
    };

    // UNDO Logic
    const handleUndo = () => {
        if (!undoStack) return;
        const { jobId, prevStatus, prevResult, prevActiveId } = undoStack;

        // Revert Job
        setJobs(prevJobs => prevJobs.map(j => {
            if (j.id === jobId) {
                return { ...j, status: prevStatus, result_items: prevResult };
            }
            return j;
        }));

        // Revert Active State
        setActiveJobId(prevActiveId);

        // Clear Undo Stack
        setUndoStack(null);
        addToast("操作を元に戻しました。", "info");
    };

    const handleJobUpdate = async (jobId, newStatus) => {
        // Find current job state for Undo logging
        const job = jobs.find(j => j.id === jobId);
        if (newStatus === 'COMPLETED' && job) {
            // Push to Undo Stack (Single level undo for simplicity)
            setUndoStack({
                jobId,
                prevStatus: job.status,
                prevResult: job.result_items, // undefined if not set yet
                prevActiveId: activeJobId
            });
        }

        // Update Job Status
        setJobs(prevJobs => prevJobs.map(j => {
            if (j.id === jobId) {
                if (newStatus === 'COMPLETED') {
                    return { ...j, status: newStatus, result_items: manualData.items };
                }
                return { ...j, status: newStatus };
            }
            return j;
        }));

        // Manage Active Job Logic
        if (newStatus === 'MOVING' || newStatus === 'ARRIVED' || newStatus === 'WORKING') {
            setActiveJobId(jobId);
        } else if (newStatus === 'COMPLETED') {
            setActiveJobId(null);

            // Phase 3: Photo Upload
            if (manualData.photo) {
                try {
                    const result = await PhotoRepository.uploadPhoto(manualData.photo, jobId);
                    await EventRepository.log(DRIVER_ID, 'PHOTO_UPLOADED', { job_id: jobId, photo_url: result.url });
                } catch (e) {
                    addToast("写真のアップロードに失敗しましたが、完了処理を続行します。", "error");
                }
            }

            // Check if ALL jobs are completed for Confetti
            // Note: We check the count of UNfinished jobs. Since state update is async, we check current jobs
            // filtering out the ONE we just completed.
            const unfinished = jobs.filter(j => j.status !== 'COMPLETED' && j.id !== jobId);

            if (unfinished.length === 0) {
                // ALL DONE!
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b']
                });
                addToast("全案件完了！お疲れ様でした！", "success");
            } else {
                // Standard completion toast with UNDO action
                addToast(
                    "案件完了！",
                    "success",
                    <button onClick={handleUndo} className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <RotateCcw size={12} /> 元に戻す
                    </button>
                );
            }

            // Reset Data Form
            setManualData({ items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }], photo: null });
            setPhotoPreview(null);
        } else {
            setActiveJobId(null);
        }
    };

    const startEndOfDay = () => {
        openModal(
            "業務終了確認",
            "全ての業務を終了し、帰社報告を行いますか？",
            () => setViewMode('end_of_day')
        );
    };

    // Validation & Submit
    const submitEndOfDay = async () => {
        // Validation (B-4)
        if (!eodWeight) {
            addToast("総重量を入力してください", "error");
            return;
        }
        const weightNum = parseFloat(eodWeight);
        if (isNaN(weightNum)) {
            addToast("数値を入力してください", "error");
            return;
        }
        if (weightNum <= 0) {
            addToast("重量は正の値を入力してください", "error");
            return;
        }
        if (weightNum > 100000) {
            addToast("重量が大きすぎます。確認してください。", "error");
            return;
        }

        // Calculation (Fat Client)
        let totalEstimate = 0;
        const jobResults = jobs.filter(j => j.status === 'COMPLETED').map(j => {
            const jobTotal = j.result_items?.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0) || 0;
            totalEstimate += jobTotal;
            return { ...j, estimated_total: jobTotal };
        });

        const ratio = totalEstimate > 0 ? weightNum / totalEstimate : 1;

        const finalBreakdown = jobResults.map(j => ({
            job_id: j.id,
            customer: j.customer_name,
            items: j.result_items?.map(item => ({
                name: item.name,
                estimated: parseFloat(item.weight) || 0,
                final: Math.round((parseFloat(item.weight) || 0) * ratio)
            }))
        }));

        const payload = {
            total_weight: weightNum,
            total_estimate: totalEstimate,
            split_ratio: ratio,
            breakdown: finalBreakdown,
            driver_id: DRIVER_ID,
            vehicle: VEHICLE_INFO,
            timestamp: new Date().toISOString()
        };

        await EventRepository.log(DRIVER_ID, 'DAILY_REPORT', payload);
        await EventRepository.syncAll();

        openModal(
            "報告完了",
            `業務終了報告が完了しました。\n総重量: ${weightNum}kg\n(按分比率: ${(ratio * 100).toFixed(1)}%)`,
            () => {
                setEodWeight('');
                setViewMode('inspection');
            }
        );
    };

    // --- Render Helpers ---

    // Progress Bar (C-6)
    const renderProgressBar = () => {
        if (viewMode !== 'work') return null;
        const total = jobs.length;
        const completed = jobs.filter(j => j.status === 'COMPLETED').length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        return (
            <div className="bg-gray-800 pb-1">
                <div className="h-1 w-full bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="text-[10px] text-gray-400 text-right px-2">
                    完了: {completed} / {total}
                </div>
            </div>
        );
    };

    // --- Screens ---

    if (viewMode === 'inspection') {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col transition-colors duration-300">
                <ToastContainer toasts={toasts} removeToast={removeToast} />
                <header className="bg-gray-800 text-white p-4 text-center shadow-md flex justify-between items-center">
                    <div className="w-8"></div> {/* Spacer for center alignment */}
                    <div>
                        <h1 className="text-xl font-bold">{new Date().toLocaleDateString('ja-JP')} 始業前点検</h1>
                        <p className="text-sm text-gray-400">{VEHICLE_INFO}</p>
                    </div>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto space-y-3">
                    {inspection.map(item => (
                        <label key={item.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer active:scale-[0.98] transition-transform">
                            <input type="checkbox" className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={item.checked}
                                onChange={() => handleInspectionCheck(item.id)}
                            />
                            <span className="ml-4 text-gray-800 dark:text-gray-200 text-lg">{item.text}</span>
                        </label>
                    ))}
                </main>
                <footer className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
                    <button onClick={startWork} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <CheckSquare /> 点検完了・業務開始
                    </button>
                </footer>
            </div>
        );
    }

    if (viewMode === 'end_of_day') {
        return (
            <div className="bg-gray-100 dark:bg-[#111827] min-h-screen flex flex-col items-center justify-center p-4 transition-colors">
                <ToastContainer toasts={toasts} removeToast={removeToast} />
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">業務終了報告</h2>
                    <p className="text-gray-500 dark:text-gray-400">本日の総重量（台貫値）を入力してください</p>

                    <div className="relative">
                        <input type="number"
                            className="w-full p-4 text-3xl font-bold text-center border-2 border-blue-500 rounded-lg focus:ring-4 focus:ring-blue-200 outline-none dark:bg-gray-700 dark:text-white dark:border-blue-600"
                            placeholder="0"
                            value={eodWeight}
                            onChange={(e) => setEodWeight(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                    </div>

                    <button onClick={submitEndOfDay} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-transform">
                        送信して終了
                    </button>

                    <button onClick={() => setViewMode('work')} className="text-gray-400 underline text-sm hover:text-gray-600">
                        戻る
                    </button>
                </div>
                <Modal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    title={modalConfig.title}
                    footer={
                        <button onClick={modalConfig.onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">OK</button>
                    }
                >
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-left">{modalConfig.message}</p>
                </Modal>
            </div>
        );
    }

    return (
        <div className="bg-[#111827] dark:bg-gray-950 min-h-screen flex flex-col transition-colors">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <header className="bg-[#111827] dark:bg-gray-900 text-white p-4 sticky top-0 z-20 border-b border-gray-800">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">本日のミッション</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-semibold">{DRIVER_NAME}</p>
                            <p className="text-xs text-gray-400">{VEHICLE_INFO}</p>
                        </div>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {renderProgressBar()}

            <main className="flex-grow p-4 overflow-y-auto bg-[#111827] dark:bg-gray-950 transition-colors">
                <div className="max-w-md mx-auto relative pb-20">

                    {/* Skeleton Loading (A-2) */}
                    {loading ? (
                        <>
                            <JobCardSkeleton />
                            <JobCardSkeleton />
                            <JobCardSkeleton />
                        </>
                    ) : (
                        <>
                            {/* Sort jobs: Pending/Active first, then Completed */}
                            {/* Wait, user usually wants to see active stuff. But log suggests chronological? 
                                Actually, existing logic was not sorting. 
                                Let's put Completed at bottom to keep focus on active. 
                            */}
                            {jobs.slice().sort((a, b) => {
                                const isCompletedA = a.status === 'COMPLETED';
                                const isCompletedB = b.status === 'COMPLETED';
                                if (isCompletedA && !isCompletedB) return 1; // A (Done) goes after B (Not Done)
                                if (!isCompletedA && isCompletedB) return -1;
                                return 0;
                            }).map((job, index) => (
                                <div key={job.id}>
                                    <JobCard
                                        job={job}
                                        isActive={activeJobId === job.id}
                                        isOtherActive={activeJobId && activeJobId !== job.id}
                                        onJobUpdate={handleJobUpdate}
                                        driverId={DRIVER_ID}
                                        manualData={manualData}
                                        onManualDataChange={(idx, val) => {
                                            const newItems = [...manualData.items];
                                            newItems[idx].weight = val;
                                            setManualData({ ...manualData, items: newItems });
                                        }}
                                        isLast={index === jobs.length - 1}
                                        addToast={addToast}
                                        openConfirmModal={openModal}
                                    />
                                    {/* Photo Input Overlay */}
                                    {activeJobId === job.id && job.status === 'WORKING' && (
                                        <div className="mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg -mt-2 mx-2 border-t border-gray-100 dark:border-gray-700 shadow-inner animate-in slide-in-from-top-2">
                                            <h4 className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2"><Camera size={16} /> 現場写真</h4>

                                            {!photoPreview ? (
                                                <button onClick={() => fileInputRef.current?.click()}
                                                    className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <Camera size={24} />
                                                    <span className="text-xs mt-1">タップして撮影/選択</span>
                                                </button>
                                            ) : (
                                                <div className="relative">
                                                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                                    <button onClick={() => { setManualData(prev => ({ ...prev, photo: null })); setPhotoPreview(null); }}
                                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setManualData(prev => ({ ...prev, photo: file }));
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setPhotoPreview(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* End of Day Button */}
                            <div className="mt-8 mb-8">
                                <button
                                    onClick={startEndOfDay}
                                    disabled={jobs.some(j => j.status !== 'COMPLETED')}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-4 rounded-xl font-bold text-lg border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                    <LogOut /> 業務終了・帰社報告
                                </button>
                                {jobs.some(j => j.status !== 'COMPLETED') && (
                                    <p className="text-center text-xs text-gray-500 mt-2">※全ての案件完了後に報告できます</p>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </main>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                footer={
                    <>
                        <button onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold">キャンセル</button>
                        <button onClick={modalConfig.onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">OK</button>
                    </>
                }
            >
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{modalConfig.message}</p>
            </Modal>
        </div>
    );
}
