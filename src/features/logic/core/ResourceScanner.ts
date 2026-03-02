import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['master_vehicles']['Row'];

/**
 * Section 4. 初期化:
 * Google Sheets (休みシフト/特殊案件予定) からリソース情報を取込。
 * 現在の日付・出勤状況・車両稼働状況をスキャン。
 */
export class ResourceScanner {
    /**
     * 指定された日付の利用可能なリソース（ドライバー・車両）をスキャンする。
     * (現在は簡易的な実体化。実環境ではDB/APIから取得)
     */
    static async scan(_date: string, drivers: Driver[], vehicles: Vehicle[]): Promise<{
        availableDrivers: Driver[];
        availableVehicles: Vehicle[];
    }> {
        // 1. 休みシフトのフィルタリング (is_active フラグ等を活用)
        const availableDrivers = drivers.filter(d => d.is_active);

        // 2. 車両のフィルタリング (整備中、車検切れ等のステータスを想定)
        // (マスターに is_active がある想定)
        const availableVehicles = vehicles.filter(v => v.is_active);

        return {
            availableDrivers,
            availableVehicles
        };
    }
}
