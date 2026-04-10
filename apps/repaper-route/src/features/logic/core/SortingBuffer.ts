import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];

/**
 * Section 4. 自動展開（リソース確保ロジック）:
 * 全出勤者の中から、まず「現場支援（選別）要員2名」を優先的に確保（バッファ固定）し、
 * 残りのメンバーをドライバー/助手に割り当てる。
 */
export class SortingBuffer {
    private static readonly BUFFER_SIZE = 2;

    /**
     * 出勤ドライバーリストから、優先的に選別要員を抽出する。
     * @param availableDrivers 当日の出勤ドライバーリスト
     * @returns { reserved: 選別要員2名, remaining: 残りのドライバーリスト }
     */
    static reserveSortingStaff(availableDrivers: Driver[]): {
        reserved: Driver[];
        remaining: Driver[];
    } {
        // 優先順位（display_order または特定の属性）がある場合はここでソート
        const sorted = [...availableDrivers].sort((a, b) =>
            (a.display_order ?? 999) - (b.display_order ?? 999)
        );

        if (sorted.length <= this.BUFFER_SIZE) {
            // 出勤者が2名以下の場合は、全員を選別要員とする（配車不可の状態）
            return {
                reserved: sorted,
                remaining: []
            };
        }

        return {
            reserved: sorted.slice(0, this.BUFFER_SIZE),
            remaining: sorted.slice(this.BUFFER_SIZE)
        };
    }
}
