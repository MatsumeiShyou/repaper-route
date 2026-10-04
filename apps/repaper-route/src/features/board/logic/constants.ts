export const QUARTER_HEIGHT_REM = 2;
export const PIXELS_PER_REM = 16;
export const CELL_HEIGHT_PX = QUARTER_HEIGHT_REM * PIXELS_PER_REM;

export const TIME_SLOTS: string[] = [];
for (let h = 6; h < 18; h++) {
    ['00', '15', '30', '45'].forEach(m => {
        TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
    });
}

/**
 * 変更理由の分類 (SDR統治用)
 */
export const REASON_TAXONOMY = [
    { code: 'EMERGENCY', label: '緊急の事象 (事故・故障等)', requiresText: true },
    { code: 'CUSTOMER_REQ', label: '顧客からの直接依頼', requiresText: true },
    { code: 'INPUT_ERROR', label: '入力誤りの訂正', requiresText: false },
    { code: 'OPT_ADJUST', label: '運行効率化のための調整', requiresText: false },
    { code: 'DRIVER_MSG', label: '現場ドライバーからの報告', requiresText: true },
    { code: 'OTHER', label: 'その他', requiresText: true }
];
