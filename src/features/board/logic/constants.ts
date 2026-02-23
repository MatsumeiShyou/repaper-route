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
    /**
     * Z-Index Hierarchy（物理法則）
     * ─────────────────────────────────
     * 情報の重要度・操作状態に応じた厳密なスタッキング順序。
     * イベント伝播制御（stopPropagation）と組み合わせて
     * 誤操作を防ぐ「UI力学」を確立する。
     */
    Z_INDEX: {
        /** Z-100: ドラッグ移動中のプレビュー。pointer-events: none */
        DRAG_PREVIEW: 100,
        /** Z-60: リサイズハンドル。確実に掴めるよう最前面寄り */
        RESIZE_HANDLE: 60,
        /** Z-50: 操作中カード / コンテキストメニュー / モーダル */
        INTERACTIVE: 50,
        /** Z-40: 現在時刻線 / 選択中カード（青枠） */
        SELECTED: 40,
        /** Z-30: ドラッグ配置プレビュー枠 / 時間軸カラム */
        PREVIEW: 30,
        /** Z-20: 通常カード / カード内白線 / ドライバーヘッダー */
        DEFAULT: 20,
        /** Z-15: ロック領域（🔒）。stopPropagationで背後セルを遮断 */
        LOCK: 15,
        /** Z-10: 区切り線（スプリッタ） */
        SPLITTER: 10,
        /** Z-0: 背景グリッド線 / Grid Cell */
        GRID: 0,
    },
} as const;

/**
 * SDR Model - Reason Taxonomy (保存理由カタログ)
 * 自由記述を排除し、監査とAI学習のための構造化データとして利用する。
 */
export const REASON_TAXONOMY = [
    { code: 'SYSTEM_RECOVERY', label: 'システム復旧/エラー修正', requiresText: true },
    { code: 'SCHEDULE_CHANGE', label: '計画変更/やり直し', requiresText: false },
    { code: 'VEHICLE_TROUBLE', label: '車両トラブル/代車手配', requiresText: true },
    { code: 'RESOURCE_SHORTAGE', label: '人員不足/アサイン変更', requiresText: false },
    { code: 'CUSTOMER_REQUEST', label: '顧客要望/時間指定変更', requiresText: true },
    { code: 'TRAFFIC_DELAY', label: '交通渋滞/遅延対応', requiresText: false },
    { code: 'ACTUAL_CORRECTION', label: '実績・重量の事後修正', requiresText: true },
    { code: 'FORCE_OVERRIDE', label: '管理者強制操作（制約無視）', requiresText: true },
    { code: 'SOFT_CHANGE', label: '現場での順序変更', requiresText: false },
    { code: 'OTHER', label: 'その他（詳細入力必須）', requiresText: true },
] as const;
