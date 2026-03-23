import { Database } from '../../../types/database.types';
import { SortingBuffer } from './SortingBuffer';
import { LicenseMatcher } from './LicenseMatcher';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

/**
 * テンプレートから保存される骨格データ。
 * driver_id, startTime, status を含まない。
 */
export interface SkeletonJob {
    id: string;
    job_title: string;
    customer_id: string | null; // location_id 相当
    customer_name: string | null;
    duration_minutes: number;
    area: string | null;
    required_vehicle: string | null;
    visit_slot: string | null;
    task_type: string | null;
    location_id?: string;
}

export interface ExpansionResult {
    assigned: Job[];
    unassigned: Job[]; // 排避（Evacuation）された案件
    sortingStaff: Driver[];
}

/**
 * Section 3. テンプレート機能: 骨格データの動的展開（v2 - Skeleton Edition）
 *
 * 旧版との差異:
 * - driver_id による直接マッチを廃止。
 * - required_vehicle + visit_slot に基づくグリーディ割り当てを採用。
 * - マスタ不整合ガード: location_id が存在しない場合は安全に退避。
 * - 人員不足時の決定論的優先度: visit_slot 昇順 → customer_id 昇順。
 */
export class TemplateExpander {
    /**
     * 骨格テンプレートを展開し、利用可能なドライバーにグリーディに割り当てる。
     * @param skeletonJobs テンプレートの骨格データ
     * @param availableDrivers 当日出勤のドライバーリスト
     * @param availableVehicles 当日利用可能な車両リスト
     * @param validLocationIds マスタに存在する location_id のセット（不整合ガード用）
     */
    static expand(
        skeletonJobs: SkeletonJob[],
        availableDrivers: Driver[],
        validLocationIds?: Set<string>
    ): ExpansionResult {
        // 1. 選別要員2名を確保
        const { reserved, remaining: activeDrivers } = SortingBuffer.reserveSortingStaff(availableDrivers);

        // 2. 決定論的優先度でソート: visit_slot 昇順 → customer_id 昇順
        const sortedJobs = [...skeletonJobs].sort((a, b) => {
            const slotA = a.visit_slot ?? 'zzz';
            const slotB = b.visit_slot ?? 'zzz';
            if (slotA !== slotB) return slotA.localeCompare(slotB);
            const idA = a.customer_id ?? '';
            const idB = b.customer_id ?? '';
            return idA.localeCompare(idB);
        });

        const assigned: Job[] = [];
        const unassigned: Job[] = [];
        // ドライバーの使用済みフラグ（各ドライバーは1回だけ割り当て可能）
        const usedDriverIds = new Set<string>();

        // 3. グリーディ割り当て
        for (const skeleton of sortedJobs) {
            // 3a. マスタ不整合ガード
            if (validLocationIds && skeleton.customer_id && !validLocationIds.has(skeleton.customer_id)) {
                unassigned.push(TemplateExpander.toUnassignedJob(skeleton, 'マスタ削除済みのため退避'));
                continue;
            }

            // 3b. 車両要件を満たすドライバーを探す（グリーディ）
            const matchedDriver = activeDrivers.find(driver => {
                if (usedDriverIds.has(driver.id)) return false;

                const vehicleReq = skeleton.required_vehicle || 'AT';
                const driverLicense = driver.vehicle_number || 'AT';

                return LicenseMatcher.canDrive(driverLicense, vehicleReq);
            });

            if (!matchedDriver) {
                // 人員不足: 利用可能なドライバーがいない
                unassigned.push(TemplateExpander.toUnassignedJob(skeleton, 'リソース不足のため退避'));
                continue;
            }

            // 3c. 配置成功
            usedDriverIds.add(matchedDriver.id);
            assigned.push(TemplateExpander.toAssignedJob(skeleton, matchedDriver));
        }

        return {
            assigned,
            unassigned,
            sortingStaff: reserved,
        };
    }

    /** 骨格データ → 未割当 Job に変換 */
    private static toUnassignedJob(skeleton: SkeletonJob, reason: string): Job {
        return {
            id: skeleton.id,
            job_title: skeleton.job_title,
            customer_id: skeleton.customer_id,
            customer_name: skeleton.customer_name,
            duration_minutes: skeleton.duration_minutes,
            area: skeleton.area,
            required_vehicle: skeleton.required_vehicle,
            task_type: skeleton.task_type,
            status: 'unassigned',
            note: reason,
            // 骨格に含まれないフィールドはデフォルト値
            driver_id: null,
            driver_name: null,
            start_time: null,
            created_at: new Date().toISOString(),
            actual_time: null,
            bucket_type: null,
            is_admin_forced: null,
            is_skipped: null,
            is_spot: null,
            is_synced_to_sheet: null,
            item_category: null,
            preferred_time: null,
            special_notes: null,
            task_details: null,
            time_constraint: null,
            vehicle_lock: null,
            vehicle_name: null,
            weight_kg: null,
            work_type: null,
        };
    }

    /** 骨格データ → 割当済み Job に変換 */
    private static toAssignedJob(skeleton: SkeletonJob, driver: Driver): Job {
        return {
            ...TemplateExpander.toUnassignedJob(skeleton, ''),
            driver_id: driver.id,
            driver_name: driver.driver_name,
            vehicle_name: driver.vehicle_number,
            status: 'planned',
            note: null,
        };
    }
}
