import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

/**
 * テンプレートから保存される骨格データ。
 * 【最大ルール】人（driver_id）や車両（vehicle_id）の情報を含まない。
 */
export interface SkeletonJob {
    id: string;
    job_title: string;
    customer_id: string | null;
    customer_name: string | null;
    duration_minutes: number;
    area: string | null;
    required_vehicle: string | null;
    visit_slot: string | null;
    task_type: string | null;
    // 【100点品質】マスタ属性（制約）は保持する
    time_constraint_type?: string | null;
    special_type?: string | null;
    start_time?: string | null; // 目安時間
}

export interface ExpansionResult {
    assigned: Job[];
    unassigned: Job[];
    sortingStaff: Driver[];
}

/**
 * Section 3. テンプレート機能: 骨格データの動的展開（v3 - Pure Skeleton Edition）
 * 
 * 変更点:
 * - アサイン（誰がどこに行くか）の解決責務を完全に廃止。
 * - テンプレートは「ルートの型（並び順・時間帯・制約）」のみを復元する。
 */
export class TemplateExpander {
    /**
     * スケルトン（型）群を元に、当日の未配車ジョブリストを生成する。
     * 属性（人・車）の解決はここでは行わず、純粋なデータ展開のみを行う。
     */
    static expand(skeletons: SkeletonJob[]): ExpansionResult {
        // 1. 決定論的ソート (visit_slot -> start_time -> customer_name -> id)
        const sortedJobs = [...skeletons].sort((a, b) => {
            const slotA = a.visit_slot ?? 'zzz';
            const slotB = b.visit_slot ?? 'zzz';
            if (slotA !== slotB) return slotA.localeCompare(slotB);

            if (a.start_time && b.start_time) {
                if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time);
            }

            const nameA = a.customer_name ?? '';
            const nameB = b.customer_name ?? '';
            if (nameA !== nameB) return nameA.localeCompare(nameB);

            return a.id.localeCompare(b.id);
        });

        // 2. 全案件を「未配車スケルトン」として生成
        const unassigned = sortedJobs.map(skeleton => 
            TemplateExpander.toUnassignedJob(skeleton)
        );

        return {
            assigned: [],   // 常に空（アサインはここでは行わない）
            unassigned,
            sortingStaff: [] // リソース解決は上位層（自動配車等）の責務
        };
    }

    /** 骨格データ → 未割当 Job への純粋な変換 (driver_id等は常にnull) */
    private static toUnassignedJob(skeleton: SkeletonJob): Job {
        const job: any = {
            ...skeleton,
            driver_id: null,
            driver_name: null,
            start_time: skeleton.start_time ?? null,
            created_at: new Date().toISOString(),
            status: 'pending',
            actual_time: null,
            bucket_type: skeleton.visit_slot ?? null,
            // 互換性のための初期値
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

        return job as Job;
    }
}
