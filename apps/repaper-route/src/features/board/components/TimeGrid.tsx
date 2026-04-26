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
    onCellClick: (driverId: string, time: string, e: React.MouseEvent) => void;
    onCellDoubleClick: (driverId: string, time: string) => void;

    driverColRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    isCellOccupied: (driverId: string, time: string) => boolean;
}

const MemoizedColumn = React.memo(({ driver, selectedTime, onCellClick, onCellDoubleClick, colRef }: any) => {
    return (
        <div
            ref={colRef}
            style={{ width: '180px', minWidth: '180px', flexShrink: 0, borderRight: '1px solid #e2e8f0', position: 'relative', backgroundColor: 'white' }}
        >
            {TIME_SLOTS.map(time => {
                const isSelected = selectedTime === time;
                return (
                    <div
                        key={time}
                        onClick={(e) => onCellClick(driver.id, time, e)}
                        onDoubleClick={() => onCellDoubleClick(driver.id, time)}
                        style={{
                            height: `${BOARD_CONSTANTS.SLOT_HEIGHT_PX}px`,
                            borderBottom: time.endsWith(':45') ? '1.5px solid #f59e0b' : '1.5px solid #f1f5f9',
                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease-out'
                        }}
                        className={isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
                    />
                );
            })}
        </div>
    );
});

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
                {TIME_SLOTS.map(time => {
                    const isFullHour = time.endsWith(':00');
                    const [h, m] = time.split(':');
                    const displayHour = isFullHour ? parseInt(h, 10).toString() : '';
                    const displayMinute = `:${m}`;

                    return (
                        <div
                            key={time}
                            style={{
                                height: '32px',
                                width: '64px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: isFullHour ? '#334155' : '#64748b',
                                fontWeight: isFullHour ? 'bold' : 'normal',
                                borderBottom: time.endsWith(':45') ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ width: '20px', textAlign: 'right' }}>
                                {displayHour}
                            </span>
                            <span style={{ width: '26px', textAlign: 'left' }}>
                                {displayMinute}
                            </span>
                        </div>
                    );
                })}
            </div>


            {/* Indexed Columns (Memoized) */}
            {drivers.map(driver => (
                <MemoizedColumn
                    key={driver.id}
                    driver={driver}
                    selectedTime={selectedCell?.driverId === driver.id ? selectedCell.time : null}
                    onCellClick={onCellClick}
                    onCellDoubleClick={onCellDoubleClick}
                    colRef={(el: HTMLElement | null) => { if (driverColRefs.current) driverColRefs.current[driver.id] = el; }}
                />
            ))}
        </div>
    );
};
