// src/DriverApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckSquare, LogOut, Camera, X } from 'lucide-react';
import { useJobStateMachine } from './hooks/useJobStateMachine';
import { EventRepository } from './lib/eventRepository';
import { JobCard } from './components/JobCard';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 【設定エリア】
const WEB_APP_URL = "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const DRIVER_ID = 'driver_001';
const DRIVER_NAME = '佐藤 ドライバー';
const VEHICLE_INFO = '車両: 1122AB';

export default function DriverApp() {
    const [viewMode, setViewMode] = useState('inspection'); // 'inspection' | 'work' | 'end_of_day'
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    // State for Inspection
    const [inspection, setInspection] = useState([
        { id: 'brake', text: 'ブレーキの効き', checked: false },
        { id: 'tire', text: 'タイヤの空気圧・損傷', checked: false },
        { id: 'oil', text: 'エンジンオイルの量', checked: false },
        { id: 'lamp', text: 'ライト・ウインカーの点灯', checked: false }
    ]);

    // End of Day State
    const [eodWeight, setEodWeight] = useState('');

    // L1 State Machine
    const [activeJobId, setActiveJobId] = useState(null);
    const jobMachine = useJobStateMachine('PENDING', activeJobId, DRIVER_ID);

    // Manual Data (Linked to Active Job)
    const [manualData, setManualData] = useState({
        items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }],
        photo: null // Blob
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (viewMode === 'work') {
            fetchJobs();
            EventRepository.syncAll();
        }
    }, [viewMode]);

    const handleInspectionCheck = (id) => {
        setInspection(inspection.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const startWork = async () => {
        if (!inspection.every(i => i.checked)) {
            alert("全ての点検項目を確認してください。");
            return;
        }
        await EventRepository.log(DRIVER_ID, 'INSPECTION_COMPLETE', { inspection });
        setViewMode('work');
    };

    const fetchJobs = async () => {
        setLoading(true);
        if (jobs.length === 0) {
            setJobs([
                { id: 'job_1', customer_name: 'アール', address: '神奈川県座間市', status: 'PENDING', items: [{ name: '段ボール' }, { name: '雑誌' }] },
                { id: 'job_2', customer_name: '旭運送', address: '神奈川県綾瀬市', status: 'PENDING', special_notes: '要フレコンバッグ', items: [{ name: 'ミックス' }] },
                { id: 'job_3', customer_name: 'XYZ倉庫', address: '神奈川県海老名市', status: 'PENDING', special_notes: '12時必着', items: [{ name: '機密書類' }] },
            ]);
        }
        setLoading(false);
    };

    // --- Action Handlers ---

    const handleCardAction = async (action, jobId) => {
        if (action === 'startMoving') {
            if (activeJobId && activeJobId !== jobId) {
                alert("他の案件が進行中です。");
                return;
            }
            setActiveJobId(jobId);
            await jobMachine.actions.startMoving();
        } else if (action === 'arrive') {
            await jobMachine.actions.arrive();
        } else if (action === 'startWork') {
            await jobMachine.actions.startWork();
        } else if (action === 'completeWork') {
            if (!confirm("完了報告を送信しますか？")) return;

            // Include photo if exists
            const payload = { manualData };
            // Note: logic handled in EventRepository

            const success = await jobMachine.actions.completeWork(payload);
            if (success) {
                // If photo exists, log it specifically as well or part of payload
                if (manualData.photo) {
                    await EventRepository.log(DRIVER_ID, 'PHOTO_ACCEPTED', { photo: manualData.photo, job_id: jobId });
                }

                setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'COMPLETED' } : j));
                setActiveJobId(null);
                setManualData({ items: [{ name: '段ボール', weight: '' }, { name: '雑誌', weight: '' }], photo: null });
                setPhotoPreview(null);
            }
        }
    };

    const handleManualDataChange = (index, value) => {
        const newItems = [...manualData.items];
        newItems[index].weight = value;
        setManualData({ ...manualData, items: newItems });
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setManualData({ ...manualData, photo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startEndOfDay = () => {
        if (!confirm("全ての業務を終了し、帰社報告を行いますか？")) return;
        setViewMode('end_of_day');
    };

    const submitEndOfDay = async () => {
        if (!eodWeight) {
            alert("総重量を入力してください");
            return;
        }
        await EventRepository.log(DRIVER_ID, 'BATCH_COMPLETE', { total_weight: eodWeight });
        alert("お疲れ様でした！業務終了です。");
        // Reset or redirect? For MVP just show success
        setEodWeight('');
        setViewMode('inspection'); // Loop back for demo
    };

    // --- Screens ---

    if (viewMode === 'inspection') {
        return (
            <div className="bg-white min-h-screen flex flex-col">
                <header className="bg-gray-800 text-white p-4 text-center shadow-md">
                    <h1 className="text-xl font-bold">{new Date().toLocaleDateString('ja-JP')} 始業前点検</h1>
                    <p className="text-sm text-gray-400">{VEHICLE_INFO}</p>
                </header>
                <main className="flex-grow p-4 overflow-y-auto space-y-3">
                    {inspection.map(item => (
                        <label key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer active:scale-[0.98] transition-transform">
                            <input type="checkbox" className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={item.checked}
                                onChange={() => handleInspectionCheck(item.id)}
                            />
                            <span className="ml-4 text-gray-800 text-lg">{item.text}</span>
                        </label>
                    ))}
                </main>
                <footer className="p-4 border-t bg-white">
                    <button onClick={startWork} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <CheckSquare /> 点検完了・業務開始
                    </button>
                </footer>
            </div>
        );
    }

    if (viewMode === 'end_of_day') {
        return (
            <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">業務終了報告</h2>
                    <p className="text-gray-500">本日の総重量（台貫値）を入力してください</p>

                    <div className="relative">
                        <input type="number"
                            className="w-full p-4 text-3xl font-bold text-center border-2 border-blue-500 rounded-lg focus:ring-4 focus:ring-blue-200 outline-none"
                            placeholder="0"
                            value={eodWeight}
                            onChange={(e) => setEodWeight(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                    </div>

                    <button onClick={submitEndOfDay} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-transform">
                        送信して終了
                    </button>

                    <button onClick={() => setViewMode('work')} className="text-gray-400 underline text-sm">
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111827] min-h-screen flex flex-col">
            <header className="bg-[#111827] text-white p-4 sticky top-0 z-20 border-b border-gray-800">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">本日のミッション</h1>
                    <div className="text-right">
                        <p className="font-semibold">{DRIVER_NAME}</p>
                        <p className="text-xs text-gray-400">{VEHICLE_INFO}</p>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto bg-[#111827]">
                <div className="max-w-md mx-auto relative pb-20">

                    {jobs.map((job, index) => (
                        <div key={job.id}>
                            <JobCard
                                job={job}
                                isActive={activeJobId === job.id}
                                isOtherActive={activeJobId && activeJobId !== job.id}
                                machine={jobMachine}
                                onAction={(action) => handleCardAction(action, job.id)}
                                manualData={manualData}
                                onManualDataChange={handleManualDataChange}
                                isLast={index === jobs.length - 1}
                            />
                            {/* Photo Input Overlay (Only when Active and Working) */}
                            {activeJobId === job.id && jobMachine.state === 'WORKING' && (
                                <div className="mb-4 bg-white p-3 rounded-lg -mt-2 mx-2 border-t border-gray-100 shadow-inner">
                                    <h4 className="font-bold text-sm text-gray-500 mb-2 flex items-center gap-2"><Camera size={16} /> 現場写真</h4>

                                    {!photoPreview ? (
                                        <button onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                            <Camera size={24} />
                                            <span className="text-xs mt-1">タップして撮影/選択</span>
                                        </button>
                                    ) : (
                                        <div className="relative">
                                            <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                            <button onClick={() => { setManualData({ ...manualData, photo: null }); setPhotoPreview(null); }}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
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
                                        onChange={handlePhotoSelect}
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
                            className="w-full bg-gray-700 text-gray-300 p-4 rounded-xl font-bold text-lg border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <LogOut /> 業務終了・帰社報告
                        </button>
                        {jobs.some(j => j.status !== 'COMPLETED') && (
                            <p className="text-center text-xs text-gray-500 mt-2">※全ての案件完了後に報告できます</p>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
