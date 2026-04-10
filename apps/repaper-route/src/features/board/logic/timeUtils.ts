import { CELL_HEIGHT_PX } from './constants';

/**
 * Time utility functions for Board
 */

export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 360; // 06:00 Default
    
    // 「要確認」などの非数値が含まれる場合のガード
    if (!timeStr.includes(':')) {
        console.warn(`[timeUtils] Invalid time format: "${timeStr}". Falling back to 06:00.`);
        return 360;
    }

    const [h, m] = timeStr.split(':').map(Number);
    
    // 数値変換失敗時のガード (NaN 対策)
    if (isNaN(h) || isNaN(m)) {
        return 360;
    }

    return h * 60 + m;
};

export const minutesToTime = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const calculateTimeFromY = (y: number): number => {
    // 定数 CELL_HEIGHT_PX を使用 (SSOT)
    const quarters = Math.round(y / CELL_HEIGHT_PX);
    return quarters * 15;
};
