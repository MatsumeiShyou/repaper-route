import React from 'react';
import { Plus, X, Copy, AlertCircle } from 'lucide-react';
import { LogicResult } from '../../logic/types';


interface CellHUDProps {
    x: number;
    y: number;
    onAdd: () => void;
    onClose: () => void;
    onCopy?: () => void;
    violation?: LogicResult | null;
}


export const CellHUD: React.FC<CellHUDProps> = ({
    x,
    y,
    onAdd,
    onClose,
    onCopy,
    violation
}) => {
    return (
        <div
            className="absolute z-50 pointer-events-auto flex items-center gap-1 p-1 rounded-full backdrop-blur-xl bg-white/40 ring-1 ring-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
                left: `${x}px`,
                top: `${y + 36}px`, // Position below the 32px cell
                transform: 'translateX(-50%)' // Center horizontally relative to click
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={onAdd}
                className={`p-2 rounded-full transition-all ${violation && !violation.isFeasible ? 'bg-amber-500 text-white animate-pulse' : 'hover:bg-blue-500 hover:text-white text-slate-600'}`}
                title={violation?.violations[0]?.message || "案件を追加"}
            >
                {violation && !violation.isFeasible ? <AlertCircle size={16} /> : <Plus size={16} />}
            </button>

            <button
                onClick={onCopy}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-all"
                title="コピー"
            >
                <Copy size={16} />
            </button>

            <div className="w-[1px] h-4 bg-black/5 mx-1" />

            <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                title="解除"
            >
                <X size={16} />
            </button>

            {violation && !violation.isFeasible && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-amber-600 text-[10px] text-white font-bold rounded shadow-lg whitespace-nowrap">
                    {violation.violations[0]?.message}
                </div>
            )}

        </div>
    );
};
