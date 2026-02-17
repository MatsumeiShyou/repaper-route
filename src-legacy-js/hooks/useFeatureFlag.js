import { getFeatureFlag } from '../config/featureFlags';

/**
 * Feature Flag Hook
 * 
 * コンポーネント内で Feature Flag の状態を取得するための React Hook
 * 
 * @example
 * const isNewBoard = useFeatureFlag('USE_REFACTORED_BOARD');
 * return isNewBoard ? <BoardCanvas_v2 /> : <BoardCanvas />;
 */
export const useFeatureFlag = (flagName) => {
    return getFeatureFlag(flagName);
};

/**
 * 複数の Feature Flag を一度に取得
 * 
 * @param {string[]} flagNames
 * @returns {Object<string, boolean>}
 * 
 * @example
 * const { USE_REFACTORED_BOARD, USE_VOICE_INPUT } = useFeatureFlags([
 *   'USE_REFACTORED_BOARD',
 *   'USE_VOICE_INPUT'
 * ]);
 */
export const useFeatureFlags = (flagNames) => {
    return flagNames.reduce((acc, name) => {
        acc[name] = getFeatureFlag(name);
        return acc;
    }, {});
};
