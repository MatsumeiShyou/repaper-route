import React, { useMemo } from 'react';
import { Clock, AlertTriangle, GripVertical, Edit3, Trash2 } from 'lucide-react';
import { QUARTER_HEIGHT_REM, PIXELS_PER_REM } from '../logic/constants';
import { timeToMinutes, minutesToTime } from '../logic/timeUtils';
import { generateJobColorMap, getPendingJobColor } from '../../core/config/theme';

export const JobLayer = ({
    jobs,
    splits,
    drivers,
    draggingJobId,
    draggingSplitId,
    selectedJobId,
    resizingState,
    dropPreview,
    dropSplitPreview,
    dragMousePos,
    onJobMouseDown,
    onSplitMouseDown,
    onResizeStart,
    onJobContextMenu,
    onJobDoubleClick,
    onJobClick,
    onSplitEdit
}) => {

    // Memoize Color Map
    const jobColorMap = useMemo(() => {
        const driverOrder = drivers.map(d => d.id);
        return generateJobColorMap(jobs, driverOrder, timeToMinutes);
    }, [jobs, drivers]);

    const renderJobHourLines = (job) => {
        const startMin = timeToMinutes(job.startTime);
        const endMin = startMin + job.duration;
        const lines = [];
        let nextHourMin = Math.ceil((startMin + 1) / 60) * 60;
        while (nextHourMin < endMin) {
            const offsetMin = nextHourMin - startMin;
            const topRem = (offsetMin / 15) * QUARTER_HEIGHT_REM;
            lines.push(
                <div key={nextHourMin} className="absolute border-t border-white z-20 pointer-events-none shadow-sm" style={{ top: `calc(${topRem}rem - 0.125rem - 1px)`, left: `calc(-0.25rem - 1px)`, width: `calc(100% + 0.5rem + 2px)` }} />
            );
            nextHourMin += 60;
        }
        return lines;
    };

    return (
        <div className="flex pointer-events-none">
            {/* Spacer for Sticky Time Axis to maintain alignment */}
            <div className="w-16 flex-shrink-0 sticky left-0 z-30" />

            {/* Driver Columns */}
            <div className="flex">
                {drivers.map(driver => (
                    <div key={driver.id} className="w-[180px] relative h-full">

                        {/* 1. Jobs Rendering */}
                        {jobs.filter(job => job.driverId === driver.id).map(job => {
                            const startMin = timeToMinutes(job.startTime);
                            const topRem = ((startMin - 360) / 15) * QUARTER_HEIGHT_REM; // 6:00 = 360min
                            const heightRem = (job.duration / 15) * QUARTER_HEIGHT_REM;

                            const isSelected = selectedJobId === job.id;
                            const isDragging = draggingJobId === job.id;

                            const colorTheme = jobColorMap[job.id] || { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };

                            if (isDragging) return null; // Hide original while dragging

                            return (
                                <div
                                    key={job.id}
                                    className={`absolute w-[94%] left-[3%] rounded-md border text-xs shadow-sm overflow-hidden select-none transition-all duration-200 z-10 pointer-events-auto
                                        ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}
                                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-30 shadow-md' : 'hover:shadow-md hover:brightness-95'}
                                        ${job.isVehicleError ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                                    `}
                                    style={{
                                        top: `calc(${topRem}rem + 1px)`,
                                        height: `calc(${heightRem}rem - 3px)`,
                                    }}
                                    onMouseDown={(e) => onJobMouseDown(e, job)}
                                    onContextMenu={(e) => onJobContextMenu(e, job)}
                                    onDoubleClick={(e) => onJobDoubleClick(e, job.id)}
                                    onClick={(e) => onJobClick(e, job.id)}
                                >
                                    {/* Top Resize Handle */}
                                    <div
                                        className="absolute top-0 left-0 w-full h-2 cursor-ns-resize z-20 hover:bg-black/10 transition-colors"
                                        onMouseDown={(e) => onResizeStart(e, job, 'top')}
                                    />

                                    <div className="px-2 py-1 h-full flex flex-col relative">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold truncate text-[11px] leading-tight">{job.title}</span>
                                            {job.bucket && <span className="text-[9px] px-1 bg-white/50 rounded ml-1 flex-shrink-0">{job.bucket}</span>}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 opacity-80 text-[10px]">
                                            <Clock size={10} />
                                            <span>{job.startTime} - {minutesToTime(timeToMinutes(job.startTime) + job.duration)}</span>
                                        </div>
                                        {job.isVehicleError && (
                                            <div className="absolute bottom-1 right-1 text-red-600 bg-white/80 rounded-full p-0.5" title="車両不一致">
                                                <AlertTriangle size={12} />
                                            </div>
                                        )}
                                        {renderJobHourLines(job)}
                                    </div>

                                    {/* Bottom Resize Handle */}
                                    <div
                                        className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20 flex justify-center items-end pb-0.5 hover:bg-black/10 transition-colors group/handle"
                                        onMouseDown={(e) => onResizeStart(e, job, 'bottom')}
                                    >
                                        <div className="w-8 h-1 bg-black/10 rounded-full group-hover/handle:bg-black/20" />
                                    </div>
                                </div>
                            );
                        })}

                        {/* 2. Splits Drop Preview */}
                        {dropSplitPreview && dropSplitPreview.driverId === driver.id && (
                            <div
                                className="absolute w-full border-t-4 border-dashed z-40 pointer-events-none transition-all duration-75"
                                style={{
                                    top: `calc(${((timeToMinutes(dropSplitPreview.time) - 360) / 15) * QUARTER_HEIGHT_REM}rem - 2px)`,
                                    borderColor: dropSplitPreview.isOverlapError ? 'red' : 'blue'
                                }}
                            >
                                <div className="absolute -top-7 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                                    {dropSplitPreview.time} 切替
                                </div>
                            </div>
                        )}

                        {/* 3. Splits Rendering */}
                        {splits.filter(s => s.driverId === driver.id && s.id !== draggingSplitId).map(split => {
                            const topRem = ((timeToMinutes(split.time) - 360) / 15) * QUARTER_HEIGHT_REM;
                            return (
                                <div
                                    key={split.id}
                                    className="absolute w-full z-20 hover:z-50 group pointer-events-auto"
                                    style={{ top: `calc(${topRem}rem - 1px)` }}
                                >
                                    {/* Line */}
                                    <div className="border-t-2 border-red-500 border-dashed w-full shadow-sm group-hover:border-red-600 relative">
                                        {/* Handle Left */}
                                        <div
                                            className="absolute -top-3 -left-2 p-1.5 cursor-grab active:cursor-grabbing bg-white/0 hover:bg-white/50 rounded-full transition-colors"
                                            onMouseDown={(e) => onSplitMouseDown(e, split)}
                                        >
                                            <GripVertical size={16} className="text-red-500 drop-shadow-sm" />
                                        </div>

                                        {/* Info Label Right */}
                                        <div
                                            className="absolute -top-3 right-0 bg-red-100 border border-red-300 text-red-900 text-[10px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer hover:bg-red-200 transition-colors"
                                            onClick={(e) => onSplitEdit(e, driver.id, split.time)}
                                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onSplitEdit(e, driver.id, split.time); }}
                                        >
                                            <span className="font-bold">{split.time}</span>
                                            <span>{split.driverName} / {split.vehicle}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* 4. Global Drop Preview (Fixed Overlay) */}
            {/* Moved to BoardCanvas or keep here if fixed? 
                If fixed, it can be here, but "fixed" is relative to viewport.
                Let's include it here for completeness.
            */}
            {dropPreview && (
                <div
                    className={`fixed pointer-events-none z-[100] border-2 rounded-md shadow-2xl opacity-90 transition-colors
                        ${dropPreview.isOverlapError ? 'bg-red-500/50 border-red-600' : (dropPreview.isVehicleError ? 'bg-orange-400/50 border-orange-500' : 'bg-blue-500/50 border-blue-600')}
                    `}
                    style={{
                        left: dragMousePos.x + 15,
                        top: dragMousePos.y + 15,
                        width: '160px',
                        height: `${(dropPreview.duration / 15) * QUARTER_HEIGHT_REM * PIXELS_PER_REM}px`
                    }}
                >
                    <div className="bg-white/90 text-[10px] font-bold px-2 py-1 rounded-sm inline-block m-1 shadow-sm">
                        {dropPreview.startTime} ({dropPreview.duration}分)
                        {dropPreview.isOverlapError && <span className="block text-red-600">⚠ 重複あり</span>}
                        {dropPreview.isVehicleError && <span className="block text-orange-600">⚠ 車両不適合</span>}
                    </div>
                </div>
            )}
        </div>
    );
};
