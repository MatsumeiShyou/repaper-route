import { useMemo } from 'react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes } from '../logic/timeUtils';

export interface SlotViolation {
    jobId: string;
    message: string;
}

/**
 * 配車盤全体のバリデーション結果
 */
export interface BoardValidationResult {
    /** 全体として有効か */
    isValid: boolean;
    /** 時間重複の違反リスト */
    overlapViolations: OverlapViolation[];
    /** 時間枠の違反リスト */
    slotViolations: SlotViolation[];
    /** 確定済み案件の変更が検出されたか */
    hasConfirmedChanges: boolean;
    /** 制約違反のサマリー */
    summary: string;
}

const SLOT_LIMITS: Record<string, { min: number; max: number; label: string }> = {
    'AM': { min: 0, max: 720, label: '午前' },
    'PM': { min: 720, max: 1440, label: '午後' },
};

export interface OverlapViolation {
    jobId: string;
    jobTitle: string;
    conflictJobId: string;
    conflictJobTitle: string;
    driverId: string;
    message: string;
}

/**
 * useBoardValidation
 * 
 * 配車盤上の全ジョブの整合性を決定論的にチェックするフック。
 * ドラッグ時のリアルタイムチェック（useBoardDragDrop）とは異なり、
 * 全ジョブ間の時間重複を一括で検出する。
 * 
 * 由来: AGENTS.md B-4 (AI排除) に基づき、決定論的算術のみで構成。
 */
export const useBoardValidation = (
    jobs: BoardJob[],
    drivers: BoardDriver[],
    _splits: BoardSplit[]
): BoardValidationResult => {

    const result = useMemo(() => {
        const overlapViolations: OverlapViolation[] = [];
        const slotViolations: SlotViolation[] = [];

        // ─────────────────────────────────────────────────
        // 1. 各ジョブの時間枠（AM/PM等）制約のチェック
        // ─────────────────────────────────────────────────
        for (const job of jobs) {
            if (!job.visitSlot || !SLOT_LIMITS[job.visitSlot]) continue;

            const limits = SLOT_LIMITS[job.visitSlot];
            const startMin = timeToMinutes(job.startTime || job.timeConstraint || '06:00');

            if (startMin < limits.min || startMin >= limits.max) {
                slotViolations.push({
                    jobId: job.id,
                    message: `時間枠外の配置: 「${job.title}」は${limits.label}指定です`
                });
            }
        }

        // ─────────────────────────────────────────────────
        // 2. ドライバー列ごとに時間重複を検出
        //    O(N²) だが、1列あたりのジョブ数は最大でも20程度のため問題なし
        // ─────────────────────────────────────────────────
        const driverIds = [...new Set(drivers.map(d => d.id))];

        for (const driverId of driverIds) {
            const driverJobs = jobs
                .filter(j => j.driverId === driverId)
                .sort((a, b) => {
                    const aMin = timeToMinutes(a.startTime || a.timeConstraint || '06:00');
                    const bMin = timeToMinutes(b.startTime || b.timeConstraint || '06:00');
                    return aMin - bMin;
                });

            for (let i = 0; i < driverJobs.length; i++) {
                for (let k = i + 1; k < driverJobs.length; k++) {
                    const jobA = driverJobs[i];
                    const jobB = driverJobs[k];

                    const aStart = timeToMinutes(jobA.startTime || jobA.timeConstraint || '06:00');
                    const aEnd = aStart + jobA.duration;
                    const bStart = timeToMinutes(jobB.startTime || jobB.timeConstraint || '06:00');

                    if (aEnd > bStart) {
                        overlapViolations.push({
                            jobId: jobA.id,
                            jobTitle: jobA.title,
                            conflictJobId: jobB.id,
                            conflictJobTitle: jobB.title,
                            driverId,
                            message: `時間重複: 「${jobA.title}」と「${jobB.title}」が重なっています`
                        });
                    }
                }
            }
        }

        const hasConfirmedChanges = jobs.some(j => j.status === 'confirmed');
        // 実際には「初期確定状態(originalStatus)」と比較すべきだが、
        // 現フェーズでは「confirmed 案件が含まれる保存」を「上書き」と定義。
        // ※ 本来は DB の最新値と比較する logic が望ましい

        const isValid = overlapViolations.length === 0 && slotViolations.length === 0;
        let summary = isValid
            ? `全${jobs.length}件の案件が正常です`
            : '';

        if (!isValid) {
            const parts = [];
            if (overlapViolations.length > 0) parts.push(`${overlapViolations.length}件の時間重複`);
            if (slotViolations.length > 0) parts.push(`${slotViolations.length}件の時間枠違反`);
            summary = `${parts.join('、')}を検出しました`;
        }

        return { isValid, overlapViolations, slotViolations, summary, hasConfirmedChanges };
    }, [jobs, drivers]);

    return result;
};
