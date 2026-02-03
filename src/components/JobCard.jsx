import React, { useEffect } from 'react';
import { Truck, MapPin, Play, Send, CheckCircle, Clock } from 'lucide-react';
import { useJobStateMachine } from '../hooks/useJobStateMachine';

/**
 * JobCard Component
 * Owns its own State Machine instance to prevent state leakage between jobs.
 */
export const JobCard = ({ job, isActive, isOtherActive, onJobUpdate, driverId, manualData, onManualDataChange, isLast, addToast, openConfirmModal }) => {
    // 1. Internal State Machine (Scoped to this Job ID)
    // Initialize with current prop status to survive remounts (sorting)
    const machine = useJobStateMachine(job.status || 'PENDING', job.id, driverId);

    // Sync machine state if DB/Parent updates (e.g. from initial load)
    // But be careful not to loop. We mostly trust the machine for local actions.

    const STATUS_CONFIG = {
        'PENDING': { iconColor: 'bg-gray-400', badgeClasses: 'bg-gray-100 text-gray-800', badgeText: '未着手', icon: Clock },
        'MOVING': { iconColor: 'bg-blue-500', badgeClasses: 'bg-blue-100 text-blue-800', badgeText: '移動中', icon: Truck },
        'ARRIVED': { iconColor: 'bg-green-500', badgeClasses: 'bg-green-100 text-green-800', badgeText: '到着済', icon: MapPin },
        'WORKING': { iconColor: 'bg-orange-500', badgeClasses: 'bg-orange-100 text-orange-800', badgeText: '作業中', icon: Play },
        'COMPLETED': { iconColor: 'bg-gray-500', badgeClasses: 'bg-gray-100 text-gray-800', badgeText: '完了', icon: CheckCircle },
    };

    const currentStatus = machine.state; // Use local machine state as source of truth for UI
    const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['PENDING'];
    const Icon = config.icon;

    // --- Action Wrappers ---
    const handleStartMoving = async () => {
        if (isOtherActive) {
            // alert("他の案件が進行中です。");
            if (addToast) addToast("他の案件が進行中です。先に現在の案件を完了させてください。", "error");
            return;
        }
        const success = await machine.actions.startMoving();
        if (success) onJobUpdate(job.id, 'MOVING');
    };

    const handleArrive = async () => {
        const success = await machine.actions.arrive();
        if (success) onJobUpdate(job.id, 'ARRIVED');
    };

    const handleStartWork = async () => {
        const success = await machine.actions.startWork();
        if (success) onJobUpdate(job.id, 'WORKING');
    };

    const handleCompleteWork = async () => {
        const executeComplete = async () => {
            // Payload constructed by parent? Or passed here?
            // Current design: Parent manages 'manualData' state. 
            const success = await machine.actions.completeWork({ manualData });

            if (success) {
                // console.log('[Debug] Machine transition success, notifying parent');
                onJobUpdate(job.id, 'COMPLETED');
            }
        };

        if (openConfirmModal) {
            openConfirmModal(
                "完了報告",
                "この案件の完了報告を送信しますか？",
                executeComplete
            );
        } else {
            // Fallback if no modal provided (should not happen in updated app)
            if (confirm("完了報告を送信しますか？")) executeComplete();
        }
    };

    // A. Inactive / Locked State
    if (isOtherActive) {
        return (
            <div
                onClick={() => {
                    if (addToast) addToast("現在、他の案件が進行中です。完了してから開始してください。", "error");
                }}
                className="relative flex items-start gap-4 mb-4 opacity-50 grayscale transition-opacity hover:opacity-75 cursor-not-allowed"
            >
                {!isLast && <div className="absolute left-[20px] top-[40px] bottom-[-20px] w-0.5 bg-gray-200 z-0"></div>}
                <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center shadow-lg`}>
                    <Icon size={18} />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex-grow shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-500">{job.customer_name}</h2>
                            <p className="text-xs font-mono text-gray-500 mb-1">
                                {job.startTime} 〜 ({job.duration}分)
                            </p>
                            <p className="text-sm text-gray-400">{job.address}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">待機中</span>
                    </div>
                </div>
            </div>
        );
    }

    // B. Active or Pending State
    return (
        <div className="relative flex items-start gap-4 mb-4 animate-fade-in-up">
            {!isLast && <div className="absolute left-[20px] top-[40px] bottom-[-20px] w-0.5 bg-gray-200 z-0"></div>}

            <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.iconColor} text-white flex items-center justify-center text-xl shadow-lg transition-colors duration-300`}>
                <Icon size={20} />
            </div>

            <div className={`bg-white rounded-lg p-4 flex-grow shadow-md transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02]' : 'hover:shadow-lg'}`}>

                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{job.customer_name}</h2>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badgeClasses} flex-shrink-0`}>
                                {config.badgeText}
                            </span>
                        </div>
                        <p className="text-sm font-mono text-gray-600 mb-2">
                            {job.startTime} 〜 ({job.duration}分)
                        </p>

                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors w-max border border-blue-100">
                            <MapPin size={16} />
                            {job.address}
                            <span className="text-xs opacity-70 ml-1">→ ナビ起動</span>
                        </a>
                    </div>
                </div>

                {job.special_notes && (
                    <div className="mt-2 bg-yellow-50 text-yellow-800 text-sm font-semibold px-3 py-2 rounded-md flex items-center gap-2 border border-yellow-200">
                        <span className="text-yellow-600">⚠</span>
                        <span>特記事項: {job.special_notes}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-4">
                    {!isActive && currentStatus === 'PENDING' && (
                        <button onClick={handleStartMoving}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                            <Truck /> 向かう
                        </button>
                    )}

                    {isActive && machine.can.arrive && (
                        <button onClick={handleArrive}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2 animate-pulse">
                            <MapPin /> 到着しました
                        </button>
                    )}

                    {isActive && machine.can.work && !machine.can.input && (
                        <button onClick={handleStartWork}
                            className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-orange-600 active:scale-95 transition-transform flex items-center justify-center gap-2">
                            <Play /> 作業開始
                        </button>
                    )}

                    {isActive && machine.can.input && (
                        <div className="mt-2 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 border-b pb-1 mb-2">回収実績入力 (現場概算)</h3>
                            {manualData.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                    <span className="font-bold text-lg text-gray-800">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <input type="number"
                                            className="w-24 p-2 border border-gray-300 rounded text-right text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0"
                                            value={item.weight}
                                            onChange={(e) => onManualDataChange(idx, e.target.value)}
                                        />
                                        <span className="text-gray-500 font-bold">kg</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleCompleteWork}
                                className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <Send /> 入力完了・出発
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
