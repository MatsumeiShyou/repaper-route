import React, { useMemo } from 'react';
import { Clock, AlertTriangle, Lock, Ban } from 'lucide-react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes } from '../logic/timeUtils';
import { generateJobColorMap } from '../../core/config/theme';
import { BOARD_CONSTANTS } from '../logic/constants';

const { SLOT_HEIGHT_PX, Z_INDEX } = BOARD_CONSTANTS;

interface JobLayerProps {
    jobs: BoardJob[];
    splits: BoardSplit[];
    drivers: BoardDriver[];
    draggingJobId: string | null;
    draggingSplitId: string | null;
    selectedJobId: string | null;
    resizingState: any | null;
    dropPreview: any | null;
    dropSplitPreview: any | null;
    dragMousePos: { x: number, y: number };
    onJobMouseDown: (e: React.MouseEvent, job: BoardJob) => void;
    onSplitMouseDown: (e: React.MouseEvent, split: BoardSplit) => void;
    onResizeStart: (e: React.MouseEvent, job: BoardJob, direction: 'top' | 'bottom') => void;
    onJobClick: (id: string, e: React.MouseEvent) => void;
}

export const JobLayer: React.FC<JobLayerProps> = ({
    jobs,
    drivers,
    draggingJobId,
    selectedJobId,
    dropPreview,
    dragMousePos,
    onJobMouseDown,
    onResizeStart,
    onJobClick
}) => {
    const jobColorMap = useMemo(() => {
        const driverOrder = drivers.map(d => d.id);
        return generateJobColorMap(jobs, driverOrder, timeToMinutes);
    }, [jobs, drivers]);

    // 内部白線（Hour Lines）の描画用
    const renderHourLines = (duration: number) => {
        if (duration <= 60) return null;
        const lines = [];
        const hourBlocks = Math.floor(duration / 60);
        for (let i = 1; i <= hourBlocks; i++) {
            lines.push(
                <div
                    key={i}
                    className="absolute w-full border-t border-white/40 z-0"
                    style={{ top: `${(i * 60 / 15) * SLOT_HEIGHT_PX}px` }}
                />
            );
        }
        return lines;
    };

    return (
        <div className="absolute inset-0 flex pointer-events-none">
            <div style={{ width: '64px', minWidth: '64px', flexShrink: 0 }} className="flex-shrink-0" />

            <div className="flex">
                {drivers.map(driver => (
                    <div
                        key={driver.id}
                        style={{ width: '180px', minWidth: '180px', flexShrink: 0 }}
                        className="relative h-full"
                    >
                        {jobs.filter(job => job.driverId === driver.id).map(job => {
                            const isDragging = draggingJobId === job.id;
                            const jobTime = job.startTime || job.timeConstraint || '06:00';
                            const startMin = timeToMinutes(jobTime);
                            const topPx = ((startMin - 360) / 15) * SLOT_HEIGHT_PX;
                            const heightPx = (job.duration / 15) * SLOT_HEIGHT_PX;
                            const isSelected = selectedJobId === job.id;
                            const colorTheme = jobColorMap[job.id] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };

                            // ガードレール状態の判別
                            const isLocked = (job as any).isLocked || (job as any).status === 'confirmed';
                            const hasWarning = (job as any).hasWarning;
                            const hasError = (job as any).hasError;

                            let borderClass = colorTheme.border;
                            // Z-Index: 状態に応じた階層を決定（style属性で適用）
                            let zIndex: number = isLocked ? Z_INDEX.LOCK : Z_INDEX.DEFAULT;
                            if (isSelected) {
                                borderClass = 'border-blue-500 ring-2 ring-blue-500';
                                zIndex = Z_INDEX.SELECTED;
                            }
                            if (hasWarning) borderClass = 'border-yellow-400 border-2';
                            if (hasError) borderClass = 'border-red-500 border-2';
                            if (isLocked) borderClass = 'border-gray-400 bg-gray-200';

                            return (
                                <div
                                    key={job.id}
                                    className={`absolute w-[94%] left-[3%] rounded-md border text-[10px] shadow-sm overflow-hidden select-none pointer-events-auto transition-brightness
                                        ${isLocked ? 'bg-gray-200 text-gray-500 italic' :
                                            hasError ? 'bg-red-50 text-red-700' : colorTheme.bg} 
                                        ${borderClass} ${hasError ? 'text-red-700' : colorTheme.text}
                                        ${isDragging ? 'opacity-40 grayscale-[0.5]' : 'hover:brightness-95'}
                                    `}
                                    style={{
                                        top: `${topPx}px`,
                                        height: `${heightPx}px`,
                                        zIndex: zIndex,
                                    }}
                                    onMouseDown={(e) => {
                                        // ロック領域: stopPropagationで背後セル(Z-0)への伝播を遮断
                                        if (isLocked) { e.stopPropagation(); return; }
                                        onJobMouseDown(e, job);
                                    }}
                                    onClick={(e) => {
                                        // ロック領域: クリックイベントも遮断（透明な壁）
                                        if (isLocked) { e.stopPropagation(); return; }
                                        onJobClick(job.id, e);
                                    }}
                                >
                                    {/* 内部白線 */}
                                    {renderHourLines(job.duration)}

                                    {/* Resize Handles — Z-60: 確実に掴めるよう最前面寄り + stopPropagation */}
                                    {!isLocked && (
                                        <div
                                            className="absolute top-0 w-full h-1.5 cursor-ns-resize hover:bg-black/5"
                                            style={{ zIndex: Z_INDEX.RESIZE_HANDLE }}
                                            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, job, 'top'); }}
                                        />
                                    )}

                                    <div className="p-1 h-full flex flex-col relative" style={{ zIndex: Z_INDEX.DEFAULT }}>
                                        <div className="flex justify-between font-bold truncate gap-1">
                                            <span className="truncate">{job.title}</span>
                                            <div className="flex shrink-0 gap-0.5">
                                                {isLocked && <Lock size={10} className="text-gray-400" />}
                                                {hasWarning && <AlertTriangle size={10} className="text-yellow-600" />}
                                                {hasError && <Ban size={10} className="text-red-600" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-70">
                                            <Clock size={8} />
                                            <span>{job.startTime || job.timeConstraint}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Resize Handle — Z-60 */}
                                    {!isLocked && (
                                        <div
                                            className="absolute bottom-0 w-full h-2 cursor-ns-resize flex justify-center items-end"
                                            style={{ zIndex: Z_INDEX.RESIZE_HANDLE }}
                                            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, job, 'bottom'); }}
                                        >
                                            <div className="w-4 h-0.5 bg-black/10 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Drag Preview — Z-100: 最前面 + pointer-events: none */}
            {dropPreview && (
                <div
                    className={`fixed pointer-events-none border-2 rounded-md shadow-xl flex items-center justify-center
                        ${dropPreview.isOverlapError ? 'bg-red-500/20 border-red-500' :
                            dropPreview.isWarning ? 'bg-yellow-500/20 border-yellow-500' : 'bg-emerald-500/20 border-emerald-500'}
                    `}
                    style={{
                        zIndex: Z_INDEX.DRAG_PREVIEW,
                        left: dragMousePos.x + 10,
                        top: dragMousePos.y + 10,
                        width: '160px',
                        height: `${(dropPreview.duration / 15) * SLOT_HEIGHT_PX}px`
                    }}
                >
                    <div className="flex flex-col items-center gap-1 p-2">
                        <span className={`text-[10px] font-bold px-1.5 rounded shadow-sm
                            ${dropPreview.isOverlapError ? 'bg-red-500 text-white' :
                                dropPreview.isWarning ? 'bg-yellow-500 text-white' : 'bg-emerald-500 text-white'}
                        `}>
                            {dropPreview.startTime}
                        </span>
                        {dropPreview.isOverlapError && (
                            <div className="flex flex-col items-center gap-1">
                                <Ban size={12} className="text-red-500" />
                                <div className="text-[8px] text-red-600 bg-red-50 px-1 py-0.5 rounded font-bold text-center leading-tight">
                                    {dropPreview.logicResult?.reason?.filter((r: string) => r.includes('不可')).map((r: string) => r.replace('【不可】', '')).join('\n') || '配置不可'}
                                </div>
                            </div>
                        )}
                        {dropPreview.isWarning && <AlertTriangle size={12} className="text-yellow-500" />}
                    </div>
                </div>
            )}
        </div>
    );
};
