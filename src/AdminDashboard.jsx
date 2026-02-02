import React, { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, AlertTriangle,
    MessageSquare, ClipboardList, RefreshCw,
    ArrowRight, Save, Filter
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './lib/utils';

// --- Configuration ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbztzbQGp7FTQ2t0qlBgY0qz3uOuRed6ec8QseGtbE69pHmjHZy_x6Y2ATNu-DKomCFygA/exec";

export default function AdminDashboard() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('完了'); // '完了' = Pending Review
    const [actionQueue, setActionQueue] = useState({}); // { [id]: { adjustedWeight, reason, status } }

    useEffect(() => {
        fetchJobs();
    }, [filterStatus]);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            // Fetch Status (State)
            // Admin reviews '完了' (Completed by Driver) items
            // Also view '承認済' (Approved) for history
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', filterStatus)
                .order('created_at', { ascending: false })
                .limit(50); // Pagination in v2

            if (data) setJobs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setActionQueue(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const submitDecision = async (job) => {
        const queueItem = actionQueue[job.id] || {};
        const decisionStatus = queueItem.status || '承認済'; // Default Approve
        const adjustedWeight = queueItem.adjustedWeight !== undefined ? queueItem.adjustedWeight : job.weight_kg;
        const reason = queueItem.reason || '';

        // Validation: If correction, reason is mandatory
        if (Number(adjustedWeight) !== Number(job.weight_kg) && !reason) {
            alert("重量を修正する場合は、理由(Reason)を必ず入力してください。");
            return;
        }

        if (confirm(`以下の内容で確定しますか？\n\n判定: ${decisionStatus}\n重量: ${adjustedWeight}kg\n理由: ${reason || '(なし)'}`)) {
            setIsLoading(true);
            try {
                // SDR: Submit Decision Event to GAS (The Truth Handler)
                // We do NOT update Supabase directly. We send a 'decision' event.
                const payload = {
                    work_type: 'decision', // Special Event Type
                    driver_name: job.driver_name, // Carry over context
                    vehicle_name: job.vehicle_name,
                    customer_name: job.customer_name,
                    item_category: job.item_category, // Target Item
                    weight_kg: Number(adjustedWeight), // Decision Value
                    special_notes: `[Decision] ${reason}`, // Human Readable Log
                    // Payload for Logic
                    task_details: {
                        original_job_id: job.id,
                        decision: decisionStatus,
                        original_weight: job.weight_kg,
                        reason: reason, // The "Reason" in SDR
                        admin_user: 'AdminUser' // TODO: Auth
                    },
                    items: [] // No new items
                };

                // Send to GAS
                // NOTE: Current GAS Logic (v1.8) appends this as a new row in Sheet/DB.
                // This is correct for "Append-Only History".
                // Ideally, GAS should ALSO update the status of the *original* row to prevent double-review.
                // For now (Phase 3 MVP), we assume Append-Only is sufficient for audit.
                // We will optimistically remove it from UI list.

                await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                // Optimistic UI Update
                setJobs(prev => prev.filter(j => j.id !== job.id));
                alert("承認完了");

            } catch (e) {
                alert("エラー: " + e.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <ClipboardList className="text-blue-600" />
                        管理画面 (Admin Dashboard)
                    </h1>
                    <p className="text-gray-500 mt-2">SDR Decision Maker v1.0</p>
                </div>
                <button
                    onClick={fetchJobs}
                    className="p-3 bg-white rounded-full shadow hover:bg-gray-50 active:scale-95 transition"
                >
                    <RefreshCw className={isLoading ? "animate-spin text-blue-500" : "text-gray-600"} />
                </button>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6">
                {['完了', '承認済', '却下'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={cn(
                            "px-6 py-2 rounded-full font-bold transition",
                            filterStatus === status
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-4 font-bold">日時 / ID</th>
                            <th className="p-4 font-bold">担当 / 顧客</th>
                            <th className="p-4 font-bold">品目 / 報告重量</th>
                            <th className="p-4 font-bold bg-blue-900 border-l border-blue-700 w-1/4">決裁 (Decision)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    対象データはありません
                                </td>
                            </tr>
                        ) : jobs.map(job => {
                            const q = actionQueue[job.id] || {};
                            const currentWeight = q.adjustedWeight !== undefined ? q.adjustedWeight : job.weight_kg;
                            const isChanged = Number(currentWeight) !== Number(job.weight_kg);

                            return (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 align-top">
                                        <div className="font-mono text-sm text-gray-500">
                                            {new Date(job.created_at).toLocaleString('ja-JP')}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">ID: {job.id}</div>
                                        <div className="mt-2">
                                            <span className={cn("px-2 py-1 text-xs font-bold rounded",
                                                job.is_synced_to_sheet ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {job.is_synced_to_sheet ? "Synced" : "Unsynced"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4 align-top">
                                        <div className="font-bold text-lg text-gray-800">{job.customer_name}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{job.driver_name}</span>
                                            <span className="text-xs">{job.vehicle_name}</span>
                                        </div>
                                        {job.special_notes && (
                                            <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded flex gap-1">
                                                <MessageSquare size={12} className="mt-0.5" />
                                                {job.special_notes}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4 align-top">
                                        <div className="font-bold text-xl text-blue-900">{job.item_category}</div>
                                        <div className="text-3xl font-bold text-gray-800 mt-1">
                                            {job.weight_kg} <span className="text-base font-normal text-gray-500">kg</span>
                                        </div>
                                        {job.task_details && (
                                            <div className="mt-2 text-xs text-gray-500 font-mono">
                                                {JSON.stringify(job.task_details).slice(0, 50)}...
                                            </div>
                                        )}
                                    </td>

                                    {/* Action Column */}
                                    <td className="p-4 align-top bg-blue-50/30 border-l border-gray-100">
                                        <div className="space-y-3">
                                            {/* Weight Adjust */}
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">修正重量 (kg)</label>
                                                <input
                                                    type="number"
                                                    className={cn(
                                                        "w-full p-2 border rounded font-bold text-right outline-none transition",
                                                        isChanged ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-300"
                                                    )}
                                                    value={currentWeight}
                                                    onChange={(e) => handleInputChange(job.id, 'adjustedWeight', e.target.value)}
                                                />
                                            </div>

                                            {/* Reason */}
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">理由 (Reason) / 承認コメント</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    placeholder={isChanged ? "修正理由を入力..." : "承認コメント(任意)"}
                                                    value={q.reason || ''}
                                                    onChange={(e) => handleInputChange(job.id, 'reason', e.target.value)}
                                                />
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        handleInputChange(job.id, 'status', '却下');
                                                        submitDecision(job); // Trigger immediately or confirm? Logic supports immediate w/ confirm
                                                    }}
                                                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-bold"
                                                >
                                                    却下
                                                </button>
                                                <button
                                                    onClick={() => submitDecision(job)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2 font-bold"
                                                >
                                                    <CheckCircle size={18} />
                                                    {isChanged ? '修正して承認' : '承認'}
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
