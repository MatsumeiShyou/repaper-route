/**
 * Time Logic Utilities
 * Pure functions for time-coordinate conversion
 */

const QUARTER_HEIGHT_REM = 2;
const PIXELS_PER_REM = 16;
const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM; // 32px

/**
 * MM:HH string to total minutes from 00:00
 * @param {string} timeStr - "HH:MM"
 * @returns {number} minutes
 */
export const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Total minutes to "HH:MM" string
 * @param {number} totalMinutes 
 * @returns {string}
 */
export const minutesToTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Calculate time from Y coordinate
 * @param {number} y - Y offset in pixels
 * @return {number} minutes 
 */
export const calculateTimeFromY = (y) => {
    const moveYBlocks = Math.round(y / CELL_HEIGHT_PX);
    const moveYMinutes = moveYBlocks * 15;
    return moveYMinutes;
};
