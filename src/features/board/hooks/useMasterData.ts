import { useMasterDataContext } from '../../../contexts/MasterDataContext';

/**
 * useMasterData (Adapter Hook for F-SSOT)
 * 個別の useState + useEffect を廃止し、MasterDataProvider からの
 * 派生値を直接返すようにリファクタリング。
 */
export const useMasterData = () => {
    return useMasterDataContext();
};

export function invalidateMasterCache() {
    // Context化により、リフレッシュは Context の refresh メソッド等で行う。
    // 必要に応じて here で refresh を呼び出すように誘導する。
}
