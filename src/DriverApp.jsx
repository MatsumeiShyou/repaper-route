// src/DriverApp.jsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, CheckSquare, Send, Plus, Package, X } from 'lucide-react';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 【設定エリア】ここにGASのURLを貼り付けてください
const WEB_APP_URL = "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CUSTOMER_LIST = ["A商店", "B工場", "Cマート", "D建設", "坪野谷本社"];

export default function DriverApp() {
    const [viewMode, setViewMode] = useState('inspection');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);

    const [manualData, setManualData] = useState({
        customer: CUSTOMER_LIST[0],
        items: [{ name: '古紙', weight: '' }]
    });

    const [inspection, setInspection] = useState({
        tire: false, oil: false, brake: false, lamp: false
    });

    const startWork = () => {
        if (!Object.values(inspection).every(v => v)) {
            alert("全ての点検項目を確認してください。");
            return;
        }
        setViewMode('work');
        fetchJobs();
    };

    const fetchJobs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', 'pending');

        if (data) setJobs(data);
        setLoading(false);
    };

    const addItem = () => {
        setManualData({ ...manualData, items: [...manualData.items, { name: '', weight: '' }] });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...manualData.items];
        newItems[index][field] = value;
        setManualData({ ...manualData, items: newItems });
    };

    const sendReport = async (isManual = false, jobData = null) => {
        const payload = isManual ? {
            job_type: 'manual',
            customer: manualData.customer,
            items: manualData.items,
            timestamp: new Date().toISOString()
        } : {
            job_type: 'scheduled',
            ...jobData,
            timestamp: new Date().toISOString()
        };

        if (!confirm("送信しますか？")) return;

        try {
            setLoading(true);
            await fetch(WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            alert("送信完了しました！");
            if (isManual) {
                setShowManualForm(false);
                setManualData({ customer: CUSTOMER_LIST[0], items: [{ name: '古紙', weight: '' }] });
            } else {
                fetchJobs();
            }
        } catch (e) {
            alert("送信エラー: 通信環境を確認してください");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (viewMode === 'inspection') {
        return (
            <div className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
                <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Truck className="w-6 h-6" /> 始業前点検
                </h1>
                <div className="space-y-4 bg-white p-4 rounded-lg shadow">
                    {Object.keys(inspection).map(key => (
                        <label key={key} className="flex items-center p-3 border rounded active:bg-blue-50">
                            <input type="checkbox" className="w-6 h-6 mr-3"
                                checked={inspection[key]}
                                onChange={() => setInspection({ ...inspection, [key]: !inspection[key] })}
                            />
                            <span className="text-lg">
                                {key === 'tire' ? 'タイヤの空気圧' : key === 'oil' ? 'エンジンオイル' : key === 'brake' ? 'ブレーキ' : 'ライト'}
                            </span>
                        </label>
                    ))}
                </div>
                <button onClick={startWork} className="w-full mt-8 bg-blue-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg">
                    業務開始
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-700">回収業務リスト</h2>
                <button onClick={() => setViewMode('inspection')} className="text-sm text-gray-500 underline">
                    点検へ戻る
                </button>
            </div>

            {loading && <p className="text-center py-4">通信中...</p>}

            {showManualForm ? (
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-500 animate-slide-up">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-lg">手動報告作成</h3>
                        <button onClick={() => setShowManualForm(false)}><X /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">顧客選択</label>
                            <select className="w-full p-3 border rounded-lg bg-gray-50 text-lg" value={manualData.customer} onChange={(e) => setManualData({ ...manualData, customer: e.target.value })}>
                                {CUSTOMER_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-500">回収品目</label>
                            {manualData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input type="text" placeholder="品名" className="flex-1 p-2 border rounded" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                                    <input type="number" placeholder="kg" className="w-24 p-2 border rounded text-right" value={item.weight} onChange={(e) => updateItem(idx, 'weight', e.target.value)} />
                                </div>
                            ))}
                            <button onClick={addItem} className="text-blue-500 text-sm flex items-center gap-1 mt-1"><Plus size={16} /> 品目を追加</button>
                        </div>
                        <button onClick={() => sendReport(true)} className="w-full bg-green-600 text-white py-4 rounded-xl text-xl font-bold shadow mt-4 flex justify-center items-center gap-2">
                            <Send /> 送信して完了
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Package className="w-16 h-16 mx-auto mb-2 opacity-20" />
                            <p>予定された案件はありません</p>
                        </div>
                    ) : (
                        jobs.map(job => (<div key={job.id} className="bg-white p-4 rounded-lg shadow"><h3 className="font-bold">{job.customer_name}</h3></div>))
                    )}
                    <button onClick={() => setShowManualForm(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 mt-6">
                        <Plus /> 手動で報告を作成
                    </button>
                </div>
            )}
        </div>
    );
}
