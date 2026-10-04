import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['master_vehicles']['Row'];

/**
 * Section 4. 初期匁E
 * Google Sheets (休みシフト/特殊案件予宁E からリソース惁E��を取込、E * 現在の日付�E出勤状況�E車両稼働状況をスキャン、E */
export class ResourceScanner {
    /**
     * 持E��された日付�E利用可能なリソース�E�ドライバ�E・車両�E�をスキャンする、E     * (現在は簡易的な実体化。実環墁E��はDB/APIから取征E
     */
    static async scan(_date: string, drivers: Driver[], vehicles: Vehicle[]): Promise<{
        availableDrivers: Driver[];
        availableVehicles: Vehicle[];
    }> {
        // 1. 休みシフトのフィルタリング (is_active フラグ等を活用)
        const availableDrivers = drivers.filter(d => d.is_active);

        // 2. 車両のフィルタリング (整備中、車検�Eれ等�EスチE�Eタスを想宁E
        // (マスターに is_active がある想宁E
        const availableVehicles = vehicles.filter(v => v.is_active);

        return {
            availableDrivers,
            availableVehicles
        };
    }
}
