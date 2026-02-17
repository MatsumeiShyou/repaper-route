/**
 * Feature Flags Configuration
 * 
 * このファイルは、新機能の段階的ロールアウトとロールバックを可能にします。
 * フラグをfalseに設定することで、即座に旧実装に戻すことができます。
 * 
 * @see .agent/decisions/best_practice_decision_20260204.md
 */

export const FEATURE_FLAGS = {
    /**
     * Phase 2: リファクタリング済みBoardCanvasを使用
     * - true: BoardCanvas_v2.jsx を使用（新実装）
     * - false: BoardCanvas.jsx を使用（既存実装・安全網）
     */
    USE_REFACTORED_BOARD: false,

    /**
     * Phase 1: Repository層経由でデータ取得
     * - true: itemRepository, customerRepository 経由
     * - false: 直接 Supabase クライアント使用
     */
    USE_REPOSITORY_LAYER: false,

    /**
     * Phase 2: Zustand による状態管理
     * - true: boardStore を使用
     * - false: 既存の useState を使用
     */
    USE_ZUSTAND_STATE: false,

    /**
     * Phase 3: 音声入力機能（実験的）
     * - true: Web Speech API を有効化
     * - false: 従来のタッチ入力のみ
     */
    USE_VOICE_INPUT: false,

    /**
     * Phase 3: ゲーミフィケーション機能
     * - true: バッジ、ランキング表示
     * - false: シンプルなダッシュボード
     */
    USE_GAMIFICATION: false,
};

/**
 * 開発モードかどうか
 * 開発時のみ表示するデバッグ情報等に使用
 */
export const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Feature Flag のステータスを取得
 * @param {string} flagName - FEATURE_FLAGS のキー名
 * @returns {boolean}
 */
export const getFeatureFlag = (flagName) => {
    if (!(flagName in FEATURE_FLAGS)) {
        console.warn(`Unknown feature flag: ${flagName}`);
        return false;
    }
    return FEATURE_FLAGS[flagName];
};

/**
 * すべての有効なFeature Flagを取得（デバッグ用）
 * @returns {string[]}
 */
export const getEnabledFeatures = () => {
    return Object.entries(FEATURE_FLAGS)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);
};
