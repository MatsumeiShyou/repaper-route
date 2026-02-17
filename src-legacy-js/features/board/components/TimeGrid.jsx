import React, { useRef } from 'react';
import { TIME_SLOTS } from '../logic/constants';
import { timeToMinutes } from '../logic/timeUtils';

export const TimeGrid = ({
    drivers,
    jobs,
    splits,
    selectedCell,
    dropPreview,
    draggingJobId,
    draggingSplitId,
    onCellClick,
    driverColRefs,
    isCellOccupied,
    onCellDoubleClick // New prop
}) => {

    const isCellOccupiedInternal = (driverId, time) => {
        const timeMin = timeToMinutes(time);
        return jobs.some(job => {
            if (job.id === draggingJobId || job.driverId !== driverId) return false;
            const startMin = timeToMinutes(job.startTime);
            const endMin = startMin + job.duration;
            return timeMin > startMin && timeMin < endMin;
        });
    };

    return (
        <div className="flex">
            {/* Time Axis */}
            <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-300 sticky left-0 z-30">
                {TIME_SLOTS.map((time) => {
                    const isHour = time.endsWith('00');
                    const borderClass = isHour ? 'border-t border-t-orange-300 border-b border-b-gray-100 font-bold bg-gray-100' : 'border-b border-b-gray-200';
                    return (
                        <div key={time} className={`h-8 flex items-center justify-end pr-2 text-xs text-gray-500 ${borderClass}`}>
                            {isHour ? time : `:${time.split(':')[1]}`}
                        </div>
                    );
                })}
            </div>

            {/* Grid Cells */}
            <div className="flex">
                {drivers.map((driver) => (
                    <div key={driver.id} className="w-[180px] border-r border-gray-300 relative" ref={el => {
                        if (driverColRefs && driverColRefs.current) {
                            driverColRefs.current[driver.id] = el;
                        }
                    }}>
                        {TIME_SLOTS.map((time) => {
                            const isHour = time.endsWith('00');
                            const borderClass = isHour ? 'border-t border-t-red-200/50' : 'border-b border-b-gray-100/50';

                            const isSelected = selectedCell?.driverId === driver.id && selectedCell?.time === time;
                            const isTarget = dropPreview?.driverId === driver.id && dropPreview?.startTime === time;
                            const isTargetOverlap = dropPreview?.isOverlapError;
                            const isTargetVehicleError = dropPreview?.isVehicleError;

                            const isDragSource = draggingJobId && time === minutesToTime(timeToMinutes(jobs.find(j => j.id === draggingJobId)?.startTime || '00:00')); // Safe access

                            let bgClass = "bg-white";
                            if (isTarget) {
                                bgClass = isTargetOverlap ? "bg-red-200/80" : (isTargetVehicleError ? "bg-orange-100" : "bg-blue-100");
                            } else if (isSelected) {
                                bgClass = "bg-blue-50";
                            } else if (isHour) {
                                bgClass = "bg-gray-50/30";
                            }

                            const occupied = isCellOccupiedInternal(driver.id, time);

                            return (
                                <div
                                    key={time}
                                    className={`h-8 box-border ${borderClass} ${bgClass} cursor-cell relative group transition-colors duration-75`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!draggingJobId && !draggingSplitId) onCellClick(driver.id, time);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (!draggingJobId && !draggingSplitId && onCellDoubleClick) onCellDoubleClick(driver.id, time);
                                    }}
                                >
                                    {/* Cell Content (Hover Add Button etc) */}
                                    {!occupied && isSelected && !draggingJobId && !draggingSplitId && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                                            <div className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none">
                                                選択中
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
