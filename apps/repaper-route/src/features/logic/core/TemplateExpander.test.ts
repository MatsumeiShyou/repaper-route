import { describe, it, expect } from 'vitest';
import { TemplateExpander, SkeletonJob } from './TemplateExpander';

/** ヘルパー: 最低限の SkeletonJob を生成 */
const makeSkeleton = (overrides: Partial<SkeletonJob> = {}): SkeletonJob => ({
    id: 'j-1',
    job_title: 'テスト案件',
    duration_minutes: 60,
    area: '千代田区',
    required_vehicle: 'AT',
    visit_slot: 'AM',
    task_type: 'collection',
    customer_id: 'loc-1',
    customer_name: 'テスト顧客',
    start_time: '09:00',
    ...overrides,
});

describe('TemplateExpander v3 (Pure Skeleton)', () => {
    it('全案件を「未配車リスト」として順序通りに展開する', () => {
        const skeletons = [
            makeSkeleton({ id: 'j-pm', visit_slot: 'PM', start_time: '13:00' }),
            makeSkeleton({ id: 'j-am2', visit_slot: 'AM', start_time: '10:00' }),
            makeSkeleton({ id: 'j-am1', visit_slot: 'AM', start_time: '09:00' }),
        ];

        // 新仕様では引数は skeletons のみ
        const result = TemplateExpander.expand(skeletons);
        
        // 1. すべて unassigned に入る（アサインはここでは行わない）
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(3);

        // 2. 決定論的にソートされている (AM 09:00 -> AM 10:00 -> PM 13:00)
        expect(result.unassigned[0].job_title).toBe('テスト案件');
        expect(result.unassigned[0].start_time).toBe('09:00');
        expect(result.unassigned[1].start_time).toBe('10:00');
        expect(result.unassigned[2].start_time).toBe('13:00');
        
        // ID は UUID に変換されているはずなので、存在確認のみ
        expect(result.unassigned[0].id).toBeDefined();
        expect(result.unassigned[0].id).not.toBe('j-am1');
    });

    it('展開時にマスタ属性 (time_constraint_type 等) を保持・復元する', () => {
        const skeletons = [
            makeSkeleton({ 
                id: 'j1', 
                time_constraint_type: 'FIXED',
                special_type: 'VIP'
            })
        ];

        const result = TemplateExpander.expand(skeletons);
        const job = result.unassigned[0] as any;
        expect(job.time_constraint_type).toBe('FIXED');
        expect(job.special_type).toBe('VIP');
    });

    it('決定論的ソートが詳細（顧客名・ID）まで機能すること', () => {
        const skeletons = [
            makeSkeleton({ id: 'c', customer_name: 'サトウ', visit_slot: 'AM', start_time: '09:00' }),
            makeSkeleton({ id: 'a', customer_name: 'アオキ', visit_slot: 'AM', start_time: '09:00' }),
            makeSkeleton({ id: 'd', customer_name: 'アオキ', visit_slot: 'AM', start_time: '09:00' }),
        ];

        const result = TemplateExpander.expand(skeletons);
        
        // ID:a (アオキ) -> ID:d (アオキ) -> ID:c (サトウ) の順
        // ID 自体は UUID に変わっているため、customer_name でソートを確認
        expect(result.unassigned[0].customer_name).toBe('アオキ');
        expect(result.unassigned[1].customer_name).toBe('アオキ');
        expect(result.unassigned[2].customer_name).toBe('サトウ');
    });
});
