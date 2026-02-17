export const QUARTER_HEIGHT_REM = 2;
export const PIXELS_PER_REM = 16;
export const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;

export const TIME_SLOTS: string[] = [];
for (let h = 6; h < 18; h++) {
    ['00', '15', '30', '45'].forEach(m => {
        TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
    });
}
