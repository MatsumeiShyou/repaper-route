import { BoardJob } from '../../../types';

/**
 * JobAdapter
 * 
 * マスタデータ (MasterPoint) や保存済み JSONB データ (routes.pending_jobs 等) の
 * 様々なフォーマットの案件データを、盤面表示用の単一の `BoardJob` 型に正規化するアダプタークラス。
 */
export class JobAdapter {
    
    /**
     * 様々な形式の生データを BoardJob に変換します。
     */
    public static mapToBoardJob(
        j: any,
        options?: { 
            idPrefix?: string;
            defaultStatus?: 'planned' | 'confirmed';
        }
    ): BoardJob {
        const id = options?.idPrefix 
            ? `${options.idPrefix}_${j.location_id}` 
            : (j.id || `temp_${Date.now()}`);

        const title = j.title || j.job_title || j.name || '';
        const note = j.note || j.special_notes || undefined;
        const bucket = j.bucket || j.bucket_type || (j.visit_slot === 'AM' ? 'AM' : (j.visit_slot === 'PM' ? 'PM' : ''));

        // Requirement check for vehicles (both boolean flags and string IDs)
        const requiredVehicle = j.requiredVehicle || j.required_vehicle || (j.restricted_vehicle_id ? '要車両' : undefined);

        return {
            id,
            title,
            bucket,
            duration: j.duration ?? (j as any).duration_minutes ?? 60,
            area: j.area || j.display_name || j.customer_name || '',
            requiredVehicle,
            note,
            isSpot: this.evaluateSpotStatus(j, title, note),
            timeConstraint: this.evaluateTimeConstraint(j),
            visitSlot: j.visitSlot || j.visit_slot || undefined,
            taskType: this.evaluateTaskType(j),
            status: j.status || options?.defaultStatus || 'planned',
            location_id: j.location_id || undefined,
            is_admin_forced: !!(j.is_admin_forced),
            is_skipped: !!(j.is_skipped)
        };
    }

    /**
     * 柔軟な isSpot 判定（Self-Healing Fallback）。
     * まず明示的なフラグを確認し、false/undefined の場合は名称や備考欄から
     * スポット案件としての意図を汲み取ります。
     */
    private static evaluateSpotStatus(j: any, titleStr: string, noteStr?: string): boolean {
        // 1. Strict Flags First
        if (j.isSpot === true || j.is_spot === true || j.is_spot_only === true) {
            return true;
        }

        // 2. Enum/Type Check
        if (j.bucket_type === 'スポット' || j.bucket === 'スポット') {
            return true;
        }

        // 3. Text Fallback Heuristics (Self-Healing)
        // Check for partial matches in title or note
        const heuristicRegex = /スポット|ｽﾎﾟｯﾄ/i;
        if (heuristicRegex.test(titleStr)) {
            return true;
        }
        if (noteStr && heuristicRegex.test(noteStr)) {
            return true;
        }

        return false;
    }

    /**
     * timeConstraint の判定
     */
    private static evaluateTimeConstraint(j: any): string | undefined {
        const exactTime = j.timeConstraint || j.start_time || j.time_constraint;
        if (exactTime) return exactTime;

        // Master enum logic
        if (j.time_constraint_type && j.time_constraint_type !== 'NONE') {
            return '要確認'; // Enum implies a constraint exists
        }

        return undefined;
    }

    /**
     * taskType の判定
     */
    private static evaluateTaskType(j: any): 'special' | 'collection' {
        if (j.taskType === 'special' || j.task_type === 'special') return 'special';
        
        // Master enum logic
        if (j.special_type && j.special_type !== 'NONE') return 'special';
        
        if (j.bucket_type === '特殊' || j.bucket === '特殊') return 'special';
        
        return 'collection';
    }
}
