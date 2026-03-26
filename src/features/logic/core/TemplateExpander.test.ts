import { describe, it, expect } from 'vitest';
import { TemplateExpander, SkeletonJob } from './TemplateExpander';

/** ヘルパー: 最低限の SkeletonJob を生成 */
const makeSkeleton = (overrides: Partial<SkeletonJob> = {}): SkeletonJob => ({
    id: 'job-1',
    job_title: 'テスト回収先',
    duration_minutes: 30,
    area: null,
    required_vehicle: null,
    visit_slot: null,
    task_type: null,
    customer_id: 'loc-1',
    customer_name: 'テスト顧客',
    start_time: '09:00',
    ...overrides,
});

/** ヘルパー: 最低限の Driver を生成 */
const makeDriver = (id: string, overrides: Record<string, unknown> = {}): any => ({
    id,
    driver_name: `Driver ${id}`,
    display_order: 10,
    vehicle_number: 'AT',
    ...overrides,
});

describe('TemplateExpander v2 (Skeleton Edition)', () => {
    // ── 基本シナリオ ──
    it('テンプレートの構成を確定的に復元する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', required_vehicle: 'AT', start_time: '09:00', driver_id: 'd1' } as any)];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'AT' }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(1);
        expect(result.assigned[0].driver_id).toBe('d1');
        expect(result.unassigned).toHaveLength(0);
        expect(result.sortingStaff).toHaveLength(2);
    });

    it('IDが不一致でもコース名が一致すれば割り当てる', () => {
        const skeletons = [makeSkeleton({ id: 'j1', course: 'A', start_time: '09:00' } as any)];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('new-d1', { course: 'A', vehicle_number: 'AT' }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(1);
        expect(result.assigned[0].driver_id).toBe('new-d1');
    });

    // ── 人員不足シナリオ ──
    it('ドライバー不足時は未割当に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', driver_id: 'd1', start_time: '09:00' } as any)];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
        ]; // d1 がいない

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].note).toContain('担当ドライバー不在');
    });

    // ── 免許不一致シナリオ ──
    it('免許不一致の場合は未割当に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', required_vehicle: 'MT', driver_id: 'd1', start_time: '09:00' } as any)];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'AT' }), // AT限定
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].note).toContain('免許不適合');
    });

    // ── マスタ不整合ガード ──
    it('マスタ削除済みの location_id は安全に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', customer_id: 'deleted-loc', driver_id: 'd1', start_time: '09:00' } as any)];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1'),
        ];
        const validLocations = new Set(['loc-1', 'loc-2']); // deleted-loc は含まれない

        const result = TemplateExpander.expand(skeletons, drivers, validLocations);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].note).toContain('マスタ削除済み');
    });

    // ── 決定論的優先度 ──
    it('visit_slot 昇順で優先的に割り当てる', () => {
        const skeletons = [
            makeSkeleton({ id: 'j-afternoon', visit_slot: 'PM', required_vehicle: 'AT', start_time: '13:00', driver_id: 'd1' } as any),
            makeSkeleton({ id: 'j-morning', visit_slot: 'AM', required_vehicle: 'AT', start_time: '09:00', driver_id: 'd1' } as any),
        ];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'AT' }),
            // d1のみ → 1件だけ割り当て可能
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        // d1に2件とも割り当て可能 (AM, PMの順)
        expect(result.assigned).toHaveLength(2);
        expect(result.assigned[0].id).toBe('j-morning');
        expect(result.assigned[1].id).toBe('j-afternoon');
        expect(result.unassigned).toHaveLength(0);
    });

    // ── 100点品質: 旧データ退避ガード ──
    it('start_time が欠落している旧データは安全に未配車に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'old-job', start_time: undefined, driver_id: 'd1' } as any)];
        const drivers = [makeDriver('d1')];
        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].note).toContain('旧形式');
    });

    // ── 100点品質: 属性復元 (亡霊A対策) ──
    it('展開時にマスタ属性 (time_constraint_type 等) を保持・復元する', () => {
        const skeletons = [
            makeSkeleton({ 
                id: 'j1', 
                time_constraint_type: 'FIXED',
                special_type: 'VIP',
                start_time: '10:00',
                driver_id: 'd1'
            } as any)
        ];
        const drivers = [
            makeDriver('s1', { display_order: 1 }), // Sorting staff 1
            makeDriver('s2', { display_order: 2 }), // Sorting staff 2
            makeDriver('d1', { vehicle_number: 'AT', display_order: 10 }), // Active driver
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(1);
        const job = result.assigned[0] as any;
        expect(job.time_constraint_type).toBe('FIXED');
        expect(job.special_type).toBe('VIP');
    });

    // ── 100点品質: 3段決定論的ソート (亡霊C対策) ──
    it('visit_slot -> customer_name -> id の順で決定論的にソート・割り当てを行う', () => {
        const skeletons = [
            makeSkeleton({ id: 'c', customer_name: 'サトウ', visit_slot: 'AM', start_time: '09:00', driver_id: 'd1' } as any),
            makeSkeleton({ id: 'a', customer_name: 'アオキ', visit_slot: 'AM', start_time: '09:00', driver_id: 'd1' } as any), // 1番目
            makeSkeleton({ id: 'b', customer_name: 'アオキ', visit_slot: 'PM', start_time: '13:00', driver_id: 'd1' } as any), // 3番目
            makeSkeleton({ id: 'd', customer_name: 'アオキ', visit_slot: 'AM', start_time: '09:00', driver_id: 'd1' } as any), // 2番目 (ID順)
        ];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { display_order: 10 }),
            // The following drivers are not needed for this test as all jobs are assigned to d1
            // makeDriver('d2', { display_order: 11 }),
            // makeDriver('d3', { display_order: 12 }),
            // makeDriver('d4', { display_order: 13 }),
            // makeDriver('d5', { display_order: 14 }),
            // makeDriver('d6', { display_order: 15 }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(4);
        
        // ソート順序の検証
        expect(result.assigned[0].id).toBe('a'); // AM, アオキ, ID:a
        expect(result.assigned[1].id).toBe('d'); // AM, アオキ, ID:d
        expect(result.assigned[2].id).toBe('c'); // AM, サトウ
        expect(result.assigned[3].id).toBe('b'); // PM, アオキ
    });
});
