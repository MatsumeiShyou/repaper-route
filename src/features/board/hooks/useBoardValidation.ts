import { useMemo } from 'react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes } from '../logic/timeUtils';

/**
 * 配車盤全体のバリデーション結果
 */
export interface BoardValidationResult {
    /** 全体として有効か */
    isValid: boolean;
    /** 時間重複の違反リスト */
    overlapViolations: OverlapViolation[];
    /** 制約違反のサマリー */
    summary: string;
}

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

        // ─────────────────────────────────────────────────
        // 1. ドライバー列ごとに時間重複を検出
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

        const isValid = overlapViolations.length === 0;
        const summary = isValid
            ? `全${jobs.length}件の案件が正常です`
            : `${overlapViolations.length}件の時間重複を検出しました`;

        return { isValid, overlapViolations, summary };
    }, [jobs, drivers]);

    return result;
};
