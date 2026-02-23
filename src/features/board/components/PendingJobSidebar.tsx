import React from 'react';
import { BoardJob } from '../../../types';
import { Database, Clock, AlertTriangle, X } from 'lucide-react';
import { getPendingJobColor } from '../../core/config/theme';

interface PendingJobSidebarProps {
    pendingJobs: BoardJob[];
    pendingFilter: string;
    setPendingFilter: (filter: string) => void;
    selectedCell: { driverId: string, time: string } | null;
    selectedJobId: string | null;
    onAddJob: (job: BoardJob) => void;
    onClose: () => void;
}

export const PendingJobSidebar: React.FC<PendingJobSidebarProps> = ({
    pendingJobs,
    pendingFilter,
    setPendingFilter,
    selectedCell,
    selectedJobId,
    onAddJob,
    onClose
}) => {

    const filteredPendingJobs = pendingJobs.filter(job => {
        if (pendingFilter === '全て') return true;
        if (pendingFilter === 'スポット') return job.isSpot === true;
        if (pendingFilter === '時間指定') return job.timeConstraint != null;
        if (pendingFilter === '特殊案件') return job.taskType === 'special';
        return false;
    });

    return (
        <div className="w-80 bg-gray-50 border-l border-gray-200 shadow-xl flex flex-col z-50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Database size={18} />
                        未割当案件 ({filteredPendingJobs.length})
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

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

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredPendingJobs.map(job => {
                    const colorTheme = getPendingJobColor(job.bucket);
                    const isSelected = selectedCell && !selectedJobId;

                    return (
                        <div
                            key={job.id}
                            className={`group relative bg-white border ${colorTheme.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98]
                                ${isSelected ? 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1' : ''}
                            `}
                            onClick={() => isSelected && onAddJob(job)}
                        >
                            {/* Left Color Strip */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-lg ${colorTheme.bg?.replace('bg-', 'bg-').replace('100', '400') || 'bg-gray-400'}`} />
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
                                        配置する
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

            {/* 配車割り当てモード情報 (日本人向け最適化) */}
            {selectedCell && (
                <div className="p-3 bg-blue-600 text-white border-t border-blue-700">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-80">配車実行モード</p>
                    <p className="text-xs font-bold leading-relaxed">{selectedCell.time} への配車案件を選択してください</p>
                </div>
            )}
        </div>
    );
};
