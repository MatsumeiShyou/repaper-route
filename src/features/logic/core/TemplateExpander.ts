import { Database } from '../../../types/database.types';
import { SortingBuffer } from './SortingBuffer';
import { LicenseMatcher } from './LicenseMatcher';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['master_vehicles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

export interface ExpansionResult {
    assigned: Job[];
    unassigned: Job[]; // 排避（Evacuation）された案件
    sortingStaff: Driver[];
}

/**
 * Section 3. テンプレート機能: 静的設計の動的展開
 * 1. 選別要員2名を確保。
 * 2. L1制約（車検や休み）に抵触した案件を「未割当リスト」へ退避。
 * 3. 残りのリソースをスキルマッチングに基づき自動配置。
 */
export class TemplateExpander {
    static expand(
        templateJobs: Job[],
        availableDrivers: Driver[],
        availableVehicles: Vehicle[]
    ): ExpansionResult {
        // 1. 選別要員2名を確保
        const { reserved, remaining: activeDrivers } = SortingBuffer.reserveSortingStaff(availableDrivers);

        const assigned: Job[] = [];
        const unassigned: Job[] = [];

        // 2. テンプレート案件の走査と検証
        for (const job of templateJobs) {
            // 車両・ドライバーの可用性チェック (L1)
            const targetVehicle = availableVehicles.find(v => v.number === job.vehicle_name);
            const targetDriver = activeDrivers.find(d => d.id === job.driver_id);

            if (!targetVehicle || !targetDriver) {
                // リソース不足または制約違反（欠勤・整備）
                unassigned.push({ ...job, status: 'unassigned' });
                continue;
            }

            // 免許マッチング (L1)
            const canDrive = LicenseMatcher.canDrive(
                targetDriver.vehicle_number || 'AT', // ドライバーの保持免許（簡易的に vehicle_number を参照）
                job.required_vehicle || 'AT'          // 案件の要求免許
            );

            if (!canDrive) {
                unassigned.push({ ...job, status: 'unassigned', note: '免許不一致のため退避' });
                continue;
            }

            // 配置成功
            assigned.push({
                ...job,
                status: 'planned' // 二段階確定モデルの「計画（予定）」状態
            });
        }

        return {
            assigned,
            unassigned,
            sortingStaff: reserved
        };
    }
}
