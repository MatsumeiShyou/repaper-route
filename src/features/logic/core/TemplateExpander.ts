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
    // 【100点品質】保存時に封印されたマスタ属性 (亡霊A対策)
    time_constraint_type?: string | null;
    special_type?: string | null;
    start_time?: string | null;
    driver_id?: string;
    course?: string;
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

        // 2. 【100点品質】3段決定論的ソート (亡霊C対策)
        // 優先度: visit_slot 昇順 → customer_name 昇順 → id 昇順
        const sortedJobs = [...skeletonJobs].sort((a, b) => {
            // 1段目: 訪問枠 (AM/PM)
            const slotA = a.visit_slot ?? 'zzz';
            const slotB = b.visit_slot ?? 'zzz';
            if (slotA !== slotB) return slotA.localeCompare(slotB);

            // 2段目: 顧客名 (漢字・カナ混在に関わらず、文字コード順で安定させる)
            const nameA = a.customer_name ?? '';
            const nameB = b.customer_name ?? '';
            if (nameA !== nameB) return nameA.localeCompare(nameB);

            // 3段目: ID (最終的な一意性)
            const idA = a.id || '';
            const idB = b.id || '';
            return idA.localeCompare(idB);
        });

        const assigned: Job[] = [];
        const unassigned: Job[] = [];

        // 3. グリーディ割り当て
        for (const skeleton of sortedJobs) {
            // 3a-0. 旧データ互換性ガード (時間は必須属性)
            if (!(skeleton as any).start_time) {
                unassigned.push(TemplateExpander.toUnassignedJob(skeleton, '旧形式のデータ（時間未定）のため未配車リストに退避しました'));
                continue;
            }

            // 3a. マスタ不整合ガード
            if (validLocationIds && skeleton.customer_id && !validLocationIds.has(skeleton.customer_id)) {
                unassigned.push(TemplateExpander.toUnassignedJob(skeleton, 'マスタ削除済みのため退避'));
                continue;
            }

            // 3b. 【最重要】確定的割り当て (ID一致 -> コース名一致)
            // 先のグリーディ方式を廃止し、保存時のコンテクストを優先復元する
            const matchedDriver = availableDrivers.find(d => 
                (skeleton.driver_id && d.id === skeleton.driver_id) || 
                (skeleton.course && (d as any).course === skeleton.course)
            );

            // 3c. マッチしたドライバーが「稼働中（選別要員以外）」かつ「免許要件を満たす」かチェック
            const isActive = matchedDriver && activeDrivers.some(d => d.id === matchedDriver.id);
            const canDrive = matchedDriver && LicenseMatcher.canDrive(
                (matchedDriver as any).vehicle_number || 'AT', 
                skeleton.required_vehicle || 'AT'
            );

            if (!matchedDriver || !isActive || !canDrive) {
                const reason = !matchedDriver ? '担当ドライバー不在' : (!isActive ? '選別要員のため退避' : '免許不適合のため退避');
                unassigned.push(TemplateExpander.toUnassignedJob(skeleton, reason));
                continue;
            }

            // 3d. 配置成功
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
        const job = {
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
            start_time: (skeleton as any).start_time ?? null,
            created_at: new Date().toISOString(),
            actual_time: null,
            bucket_type: skeleton.visit_slot ?? null,
            // ...
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
        } as any;
        
        // 【100点品質】封印された属性の最終復元 (型制約を回避して確実に注入)
        job.time_constraint_type = skeleton.time_constraint_type;
        job.special_type = skeleton.special_type;
        
        return job as Job;
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
