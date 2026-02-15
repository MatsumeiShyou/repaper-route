/**
 * Time utility functions for Board
 */

export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export const minutesToTime = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const calculateTimeFromY = (y: number): number => {
    const CELL_HEIGHT_PX = 32; // 2rem = 32px
    const quarters = Math.round(y / CELL_HEIGHT_PX);
    return quarters * 15;
};
