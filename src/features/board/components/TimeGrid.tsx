import React from 'react';
import { BoardDriver, BoardJob, BoardSplit } from '../../../types';
import { TIME_SLOTS, BOARD_CONSTANTS } from '../logic/constants';

const { Z_INDEX } = BOARD_CONSTANTS;

interface TimeGridProps {
    drivers: BoardDriver[];
    jobs: BoardJob[];
    splits: BoardSplit[];
    selectedCell: { driverId: string, time: string } | null;
    dropPreview: any | null;
    draggingJobId: string | null;
    draggingSplitId: string | null;
    onCellClick: (driverId: string, time: string) => void;
    onCellDoubleClick: (driverId: string, time: string) => void;
    driverColRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    isCellOccupied: (driverId: string, time: string) => boolean;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
    drivers,
    selectedCell,
    onCellClick,
    onCellDoubleClick,
    driverColRefs,
    // Unused props padded for future use
    jobs: _jobs,
    splits: _splits,
    dropPreview: _dropPreview,
    draggingJobId: _draggingJobId,
    draggingSplitId: _draggingSplitId,
    isCellOccupied: _isCellOccupied
}) => {
    return (
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
            {/* Time Indicators */}
            <div style={{
                width: '64px',
                minWidth: '64px',
                flexShrink: 0,
                backgroundColor: '#f8fafc',
                borderRight: '1px solid #e2e8f0',
                position: 'sticky',
                left: 0,
                zIndex: Z_INDEX.PREVIEW
            }}>
                {TIME_SLOTS.map(time => (
                    <div key={time} style={{ height: '32px', width: '64px', minWidth: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                        {time.endsWith(':00') ? time : ''}
                    </div>
                ))}
            </div>

            {/* Columns */}
            {drivers.map(driver => (
                <div
                    key={driver.id}
                    ref={el => { if (driverColRefs.current) driverColRefs.current[driver.id] = el; }}
                    style={{ width: '180px', minWidth: '180px', flexShrink: 0, borderRight: '1px solid #e2e8f0', position: 'relative', backgroundColor: 'white' }}
                >
                    {TIME_SLOTS.map(time => {
                        const isSelected = selectedCell?.driverId === driver.id && selectedCell?.time === time;
                        return (
                            <div
                                key={time}
                                onClick={() => onCellClick(driver.id, time)}
                                onDoubleClick={() => onCellDoubleClick(driver.id, time)}
                                style={{
                                    height: '32px',
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                    cursor: 'pointer'
                                }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
