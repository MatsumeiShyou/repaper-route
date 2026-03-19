import React, { useState } from 'react';
import { 
    X, Clock, User, Trash2, AlertTriangle, 
    CheckCircle2, History, ArrowRightLeft, ShieldAlert,
    Save, Maximize2, Minimize2, MapPin, Tag, Info, Box, Truck
} from 'lucide-react';
import { BoardJob, BoardDriver, AppUser } from '../../../types';

interface JobDetailPanelProps {
    job: BoardJob;
    drivers: BoardDriver[];
    currentUser: AppUser | null;
    canEdit: boolean;
    onClose: () => void;
    onUpdate: (jobId: string, updates: Partial<BoardJob>) => void;
    onUnassign: (jobId: string) => void;
    onExceptionRequest: (jobId: string, type: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL') => void;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({
    job,
    drivers,
    currentUser,
    canEdit,
    onClose,
    onUpdate,
    onUnassign,
    onExceptionRequest
}) => {
    const isConfirmed = job.status === 'confirmed';
    const isAdmin = currentUser?.role === 'admin';
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Local state for editing (planned only)
    const [editTime, setEditTime] = useState(job.startTime || job.timeConstraint || '');
    const [editNote, setEditNote] = useState(job.note || '');
    const [editDriverId, setEditDriverId] = useState(job.driverId || '');
    const [isConfirmingUnassign, setIsConfirmingUnassign] = useState(false);

    const handleSaveLocal = () => {
        onUpdate(job.id, {
            startTime: editTime,
            note: editNote,
            driverId: editDriverId
        });
    };

    return (
        <div className={`flex flex-col h-full bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-[750px]' : 'w-80'}`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isConfirmed ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-black/5 rounded-md transition-colors text-slate-500 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter"
                        title={isExpanded ? "縮小" : "全権表示"}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        {!isExpanded && <span>FULL</span>}
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-200">
                            <ShieldAlert size={12} />
                            ADMIN
                        </div>
                    )}
                    {isConfirmed ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200">
                            <CheckCircle2 size={12} />
                            確定済み
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-200">
                            <Clock size={12} />
                            配車計画中
                        </div>
                    )}
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto p-5 transition-colors duration-300 ${isExpanded ? 'bg-slate-50/50' : 'bg-white'}`}>
                <div className={`${isExpanded ? 'grid grid-cols-2 gap-8 items-start' : 'space-y-6'}`}>
                    {/* Left Column / Information Column */}
                    <div className="space-y-6">
                        {/* Title & Core Overview */}
                        <section className="space-y-4">
                            <div>
                                <div className="flex items-start justify-between">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight flex-1">{job.title}</h2>
                                    <div className="flex flex-col items-end gap-1.5 ml-4">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Reference ID</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono text-[10px] border border-slate-200">{job.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${job.bucket === 'AM' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bucket</p>
                                        <p className="text-xs font-black text-slate-700">{job.bucket}便</p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${job.isSpot ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        <Tag size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
                                        <p className="text-xs font-black text-slate-700">{job.isSpot ? 'スポット' : '定期便'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* Site & Access Details */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">現場・アクセス詳細</h3>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">作業現場住所</p>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{job.address || '住所未登録'}</p>
                                </div>
                                {job.address && (
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                                    >
                                        <MapPin size={12} />
                                        Google Maps で位置を確認
                                    </a>
                                )}
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* Operation & Vehicle Requirements */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Truck size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">運行・車両要件</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">想定作業時間</p>
                                    <p className="text-sm font-black text-slate-700">{job.duration || 0} min</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">指定車両</p>
                                    {job.requiredVehicle ? (
                                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                                            {job.requiredVehicle}
                                        </span>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-400 italic">指定なし</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* Items & Work Details */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Box size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">品目・作業詳細</h3>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">主要回収品目</p>
                                <div className="flex flex-wrap gap-2">
                                    {job.item_category ? (
                                        <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                                            {job.item_category}
                                        </span>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-400 italic">登録なし</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* History & Timeline */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <History size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">操作履歴・タイムライン</h3>
                            </div>
                            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                                <div className="relative">
                                    <div className="absolute -left-[1.625rem] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">配車計画への追加</p>
                                    <p className="text-xs font-bold text-slate-700">システムにより自動生成</p>
                                </div>
                                {job.driverId && (
                                    <div className="relative">
                                        <div className="absolute -left-[1.625rem] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ドライバー割当</p>
                                        <p className="text-xs font-bold text-slate-700">{drivers.find(d => d.id === job.driverId)?.driverName || '担当者不明'}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column / Input & Action Column */}
                    <div className="space-y-6">
                        {isExpanded && <div className="h-px bg-slate-100 mb-6 sm:hidden" />}
                        
                        {/* Edit Section (Planned) or Info Section (Confirmed) */}
                        {!isConfirmed ? (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Save size={14} className="text-slate-400" />
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">配車計画の編集</h3>
                                </div>
                                
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                    {/* Time Edit */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                                            <Clock size={12} /> 訪問予定時刻
                                        </label>
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Driver Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                                            <User size={12} /> 担当ドライバー
                                        </label>
                                        <select
                                            value={editDriverId}
                                            onChange={(e) => setEditDriverId(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="">未選択</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} ({d.driverName})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Note Edit */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                                            <Info size={12} /> 連絡・備考等
                                        </label>
                                        <textarea
                                            value={editNote}
                                            onChange={(e) => setEditNote(e.target.value)}
                                            placeholder="案件に関する特記事項を入力..."
                                            rows={3}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSaveLocal}
                                            disabled={!canEdit}
                                            className="flex-1 bg-slate-900 text-white p-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-black/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save size={14} /> 表示内容を保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <Info size={14} className="text-slate-400" />
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">配車確定ステータス</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                    {/* Info Read-only */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">訪問予定</p>
                                            <p className="text-sm font-black text-slate-700">{job.startTime}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">担当</p>
                                            <p className="text-sm font-black text-slate-700">{drivers.find(d => d.id === job.driverId)?.driverName || '未選択'}</p>
                                        </div>
                                    </div>
                                    
                                    {job.note && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">備考</p>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{job.note}</p>
                                        </div>
                                    )}

                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                                        <ShieldAlert className="text-amber-500 shrink-0" size={18} />
                                        <p className="text-[11px] text-amber-800 font-medium leading-normal">
                                            確定済みの案件です。内容の変更や削除には管理者権限による「例外操作」が必要です。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <hr className="border-slate-100" />

                        {/* Actions Row */}
                        <div className="space-y-3">
                            {!isConfirmed && (
                                    <button
                                        onClick={() => onExceptionRequest(job.id, 'MOVE')}
                                        disabled={!canEdit}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:border-slate-400 transition-all group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors text-slate-500">
                                                <ArrowRightLeft size={14} />
                                            </div>
                                            <span className="uppercase tracking-widest leading-none">案件の場所を移動</span>
                                        </div>
                                    </button>
                            )}

                            <div className="relative">
                                {isConfirmingUnassign ? (
                                    <div className="animate-in fade-in zoom-in duration-200 p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-3 shadow-md">
                                        <div className="flex items-center gap-2 text-rose-800">
                                            <AlertTriangle size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">返却しますか？</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onUnassign(job.id)}
                                                className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-rose-700"
                                            >
                                                はい、未配車に戻す
                                            </button>
                                            <button
                                                onClick={() => setIsConfirmingUnassign(false)}
                                                className="flex-1 bg-white text-slate-600 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50"
                                            >
                                                キャンセル
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsConfirmingUnassign(true)}
                                        className={`w-full flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all group shadow-sm ${(isConfirmed || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isConfirmed || !canEdit}
                                        title={isConfirmed ? "確定済み案件は戻せません" : (!canEdit ? "編集権限がありません" : "")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors text-rose-400">
                                                <Trash2 size={14} />
                                            </div>
                                            <span className="uppercase tracking-widest leading-none">未配車リストへ戻す</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
