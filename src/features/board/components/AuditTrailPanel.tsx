import React from 'react';
import { History, User, Clock, AlertCircle } from 'lucide-react';
import { BoardJob } from '../../../types';

interface AuditTrailPanelProps {
    job: BoardJob;
    history: Array<{
        version: number;
        decision: string;
        reason: string;
        userName: string;
        updatedAt: string;
    }>;
    onClose: () => void;
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ job, history, onClose }) => {
    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-[1000] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2 font-bold text-gray-800">
                    <History size={18} className="text-blue-600" />
                    <span>判断履歴 (Audit Trail)</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 bg-blue-50/50">
                <div className="text-xs text-blue-600 font-bold mb-1">SELECTED JOB</div>
                <div className="font-black text-gray-900">{job.title}</div>
                <div className="text-[10px] text-gray-500 mt-1">ID: {job.id}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {history.map((entry, idx) => (
                    <div key={idx} className="relative pl-6">
                        {/* Timeline Line */}
                        {idx !== history.length - 1 && (
                            <div className="absolute left-[7px] top-4 bottom-[-24px] w-[2px] bg-gray-100" />
                        )}

                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white
                            ${idx === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}
                        `} />

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-black ${idx === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                    Ver. {entry.version} {idx === 0 && '(最新)'}
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Clock size={10} /> {entry.updatedAt}
                                </span>
                            </div>

                            <div className="text-sm font-bold text-gray-800 bg-white border border-gray-100 p-2 rounded shadow-sm">
                                {entry.decision}
                            </div>

                            <div className="flex items-start gap-1 p-2 bg-gray-50 rounded text-[11px] text-gray-600 italic">
                                <AlertCircle size={10} className="mt-0.5 shrink-0 text-gray-400" />
                                <span>{entry.reason || '（理由なし）'}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-gray-400 pl-1">
                                <User size={10} />
                                <span>{entry.userName}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 text-[10px] text-gray-400 bg-gray-50">
                ※ Append-Only モデルにより、物理削除された履歴は存在しません。
            </div>
        </div>
    );
};
