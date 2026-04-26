import React from 'react';
import { History, RotateCcw, Play, Pause } from 'lucide-react';
import { BoardAction } from '../../../types';

interface BoardTimelineProps {
    actions: BoardAction[];
    previewIndex: number | null;
    onSeek: (index: number) => void;
    onReset: () => void;
}

export const BoardTimeline: React.FC<BoardTimelineProps> = ({
    actions,
    previewIndex,
    onSeek,
    onReset
}) => {
    const isPreviewing = previewIndex !== null;
    const currentIndex = previewIndex !== null ? previewIndex : actions.length;

    if (actions.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 py-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto flex items-center gap-6">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 min-w-[140px]">
                    <div className={`p-2 rounded-full ${isPreviewing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                        <History size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {isPreviewing ? 'Preview Mode' : 'Live Timeline'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                            {currentIndex} / {actions.length} Actions
                        </p>
                    </div>
                </div>

                {/* Timeline Slider */}
                <div className="flex-1 group relative">
                    <input
                        type="range"
                        min="0"
                        max={actions.length}
                        value={currentIndex}
                        onChange={(e) => onSeek(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:h-3 focus:outline-none"
                    />
                    
                    {/* Action Labels (Subtle markers) */}
                    <div className="absolute -top-6 left-0 right-0 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-[10px] text-gray-400 font-mono">START</span>
                        <span className="text-[10px] text-gray-400 font-mono">NOW</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {isPreviewing && (
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            <RotateCcw size={16} />
                            <span>Return to Live</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Current Action Tooltip (Simplified) */}
            {isPreviewing && currentIndex > 0 && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs shadow-xl animate-in fade-in zoom-in duration-200">
                    <span className="text-amber-400 font-bold mr-2">{actions[currentIndex-1].action_type}</span>
                    <span className="text-gray-300">by {actions[currentIndex-1].user_id?.slice(0, 8)}</span>
                </div>
            )}
        </div>
    );
};
