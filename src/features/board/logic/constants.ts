export const QUARTER_HEIGHT_REM = 2;
export const PIXELS_PER_REM = 16;
export const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;

export const TIME_SLOTS: string[] = [];
for (let h = 6; h < 18; h++) {
    ['00', '15', '30', '45'].forEach(m => {
        TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
    });
}

// JobLayer.tsx 等から参照される定数オブジェクト
export const BOARD_CONSTANTS = {
    SLOT_HEIGHT_PX: CELL_HEIGHT_PX, // 1スロット（15分）あたりの高さ: 32px
    Z_INDEX: {
        DEFAULT: 10,
        SELECTED: 20,
        LOCK: 5,
    },
} as const;
