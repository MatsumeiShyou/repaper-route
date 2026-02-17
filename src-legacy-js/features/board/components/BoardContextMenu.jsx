import React from 'react';
import { Trash2 } from 'lucide-react';

export const BoardContextMenu = ({ contextMenu, onClose, onDeleteJob }) => {
    if (!contextMenu) return null;

    const { x, y, jobId } = contextMenu;

    return (
        <>
            <div
                className="fixed inset-0 z-50"
                onClick={onClose}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
            <div
                className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] animate-in fade-in zoom-in duration-200"
                style={{ top: y, left: x }}
            >
                <button
                    onClick={() => { onDeleteJob(jobId); onClose(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                >
                    <Trash2 size={16} /> 案件削除
                </button>
            </div>
        </>
    );
};
