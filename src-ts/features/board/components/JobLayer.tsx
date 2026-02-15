import React, { useMemo } from 'react';
import { Clock, AlertTriangle, GripVertical } from 'lucide-react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes, minutesToTime } from '../logic/timeUtils';
import { generateJobColorMap } from '../../core/config/theme';

const SLOT_HEIGHT_PX = 32; // 15分 = 32px

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
    selectedJobId_old?: string | null; // Migration compatibility
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

    return (
        <div className="absolute inset-0 flex pointer-events-none">
            {/* Spacer for time axis - must match TimeGrid's width */}
            <div style={{ width: '64px', minWidth: '64px', flexShrink: 0 }} className="flex-shrink-0" />

            <div className="flex">
                {drivers.map(driver => (
                    <div
                        key={driver.id}
                        style={{ width: '180px', minWidth: '180px', flexShrink: 0 }}
                        className="relative h-full"
                    >
                        {jobs.filter(job => job.driverId === driver.id).map(job => {
                            if (draggingJobId === job.id) return null;

                            const jobTime = job.startTime || job.timeConstraint || '06:00';
                            const startMin = timeToMinutes(jobTime);
                            const topPx = ((startMin - 360) / 15) * SLOT_HEIGHT_PX;
                            const heightPx = (job.duration / 15) * SLOT_HEIGHT_PX;
                            const isSelected = selectedJobId === job.id;
                            const colorTheme = jobColorMap[job.id] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };

                            return (
                                <div
                                    key={job.id}
                                    className={`absolute w-[94%] left-[3%] rounded-md border text-[10px] shadow-sm overflow-hidden select-none z-10 pointer-events-auto
                                        ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}
                                        ${isSelected ? 'ring-2 ring-blue-500 z-30' : 'hover:brightness-95'}
                                    `}
                                    style={{
                                        top: `${topPx}px`,
                                        height: `${heightPx}px`,
                                    }}
                                    onMouseDown={(e) => onJobMouseDown(e, job)}
                                    onClick={(e) => onJobClick(job.id, e)}
                                >
                                    {/* Resize Handles */}
                                    <div className="absolute top-0 w-full h-1 cursor-ns-resize hover:bg-black/5" onMouseDown={(e) => onResizeStart(e, job, 'top')} />

                                    <div className="p-1 h-full flex flex-col">
                                        <div className="flex justify-between font-bold truncate">
                                            {job.title}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-70">
                                            <Clock size={8} />
                                            <span>{job.timeConstraint}</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 w-full h-2 cursor-ns-resize flex justify-center items-end" onMouseDown={(e) => onResizeStart(e, job, 'bottom')}>
                                        <div className="w-4 h-0.5 bg-black/10 rounded-full" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Drag Preview */}
            {dropPreview && (
                <div
                    className="fixed pointer-events-none z-[100] border-2 rounded-md shadow-xl bg-blue-500/20 border-blue-500 flex items-center justify-center"
                    style={{
                        left: dragMousePos.x + 10,
                        top: dragMousePos.y + 10,
                        width: '160px',
                        height: `${(dropPreview.duration / 15) * SLOT_HEIGHT_PX}px`
                    }}
                >
                    <span className="bg-white text-blue-600 text-[10px] font-bold px-1 rounded">{dropPreview.startTime}</span>
                </div>
            )}
        </div>
    );
};
