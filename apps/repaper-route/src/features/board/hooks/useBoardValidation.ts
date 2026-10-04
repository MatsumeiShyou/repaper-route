import { useMemo } from 'react';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { timeToMinutes } from '../logic/timeUtils';

export interface SlotViolation {
    jobId: string;
    message: string;
}

/**
 * 配車盤全体�EバリチE�Eション結果
 */
export interface BoardValidationResult {
    /** 全体として有効ぁE*/
    isValid: boolean;
    /** 時間重褁E�E違反リスチE*/
    overlapViolations: OverlapViolation[];
    /** 時間枠の違反リスチE*/
    slotViolations: SlotViolation[];
    /** 確定済み案件の変更が検�Eされたか */
    hasConfirmedChanges: boolean;
    /** 制紁E��反�Eサマリー */
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
 * 配車盤上�E全ジョブ�E整合性を決定論的にチェチE��するフック、E * ドラチE��時�EリアルタイムチェチE���E�EseBoardDragDrop�E�とは異なり、E * 全ジョブ間の時間重褁E��一括で検�Eする、E * 
 * 由来: AGENTS.md B-4 (AI排除) に基づき、決定論的算術�Eみで構�E、E */
export const useBoardValidation = (
    jobs: BoardJob[],
    drivers: BoardDriver[],
    _splits: BoardSplit[]
): BoardValidationResult => {

    const result = useMemo(() => {
        const overlapViolations: OverlapViolation[] = [];
        const slotViolations: SlotViolation[] = [];

        // ─────────────────────────────────────────────────
        // 1. 吁E��ョブ�E時間枠�E�EM/PM等）制紁E�EチェチE��
        // ─────────────────────────────────────────────────
        for (const job of jobs) {
            if (!job.visitSlot || !SLOT_LIMITS[job.visitSlot]) continue;

            const limits = SLOT_LIMITS[job.visitSlot];
            const startMin = timeToMinutes(job.startTime || job.timeConstraint || '06:00');

            if (startMin < limits.min || startMin >= limits.max) {
                slotViolations.push({
                    jobId: job.id,
                    message: `時間枠外�E配置: 、E{job.title}」�E${limits.label}持E��です`
                });
            }
        }

        // ─────────────────────────────────────────────────
        // 2. ドライバ�E列ごとに時間重褁E��検�E
        //    O(N²) だが、E列あたりのジョブ数は最大でめE0程度のため問題なぁE        // ─────────────────────────────────────────────────
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
                            message: `時間重複: 「${jobA.title}」と「${jobB.title}」が重なってぁE��す`
                        });
                    }
                }
            }
        }

        const hasConfirmedChanges = jobs.some(j => j.status === 'confirmed');
        // 実際には「�E期確定状慁EoriginalStatus)」と比輁E��べきだが、E        // 現フェーズでは「confirmed 案件が含まれる保存」を「上書き」と定義、E        // ※ 本来は DB の最新値と比輁E��めElogic が望ましい

        const isValid = overlapViolations.length === 0 && slotViolations.length === 0;
        let summary = isValid
            ? `全${jobs.length}件の案件が正常です`
            : '';

        if (!isValid) {
            const parts = [];
            if (overlapViolations.length > 0) parts.push(`${overlapViolations.length}件の時間重複`);
            if (slotViolations.length > 0) parts.push(`${slotViolations.length}件の時間枠違反`);
            summary = `${parts.join('、E')}を検�Eしました`;
        }

        return { isValid, overlapViolations, slotViolations, summary, hasConfirmedChanges };
    }, [jobs, drivers]);

    return result;
};
