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
    it('骨格テンプレートをドライバーにグリーディ割り当てする', () => {
        const skeletons = [makeSkeleton({ id: 'j1', required_vehicle: 'AT' })];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'MT' }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(1);
        expect(result.assigned[0].driver_id).toBe('d1');
        expect(result.unassigned).toHaveLength(0);
        expect(result.sortingStaff).toHaveLength(2);
    });

    // ── 人員不足シナリオ ──
    it('ドライバー不足時は未割当に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1' })];
        // 2名しかいない → 全員選別要員 → ドライバーゼロ
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].note).toContain('リソース不足');
    });

    // ── 免許不一致シナリオ ──
    it('免許不一致の場合は未割当に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', required_vehicle: 'MT' })];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'AT' }), // AT免許 → MT車両は運転不可
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
    });

    // ── マスタ不整合ガード ──
    it('マスタ削除済みの location_id は安全に退避する', () => {
        const skeletons = [makeSkeleton({ id: 'j1', customer_id: 'deleted-loc' })];
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
            makeSkeleton({ id: 'j-afternoon', visit_slot: 'PM', required_vehicle: 'AT' }),
            makeSkeleton({ id: 'j-morning', visit_slot: 'AM', required_vehicle: 'AT' }),
        ];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'AT' }),
            // d1のみ → 1件だけ割り当て可能
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        // AM が優先されるため、j-morning が割当、j-afternoon が退避
        expect(result.assigned).toHaveLength(1);
        expect(result.assigned[0].id).toBe('j-morning');
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].id).toBe('j-afternoon');
    });

    // ── 複数ドライバー割り当て ──
    it('複数の骨格を複数ドライバーに割り当てる（1対1）', () => {
        const skeletons = [
            makeSkeleton({ id: 'j1', required_vehicle: 'AT' }),
            makeSkeleton({ id: 'j2', required_vehicle: 'AT' }),
        ];
        const drivers = [
            makeDriver('s1', { display_order: 1 }),
            makeDriver('s2', { display_order: 2 }),
            makeDriver('d1', { vehicle_number: 'MT', display_order: 3 }),
            makeDriver('d2', { vehicle_number: 'AT', display_order: 4 }),
        ];

        const result = TemplateExpander.expand(skeletons, drivers);
        expect(result.assigned).toHaveLength(2);
        // 各ドライバーが1件ずつ割り当てられている
        const assignedDriverIds = result.assigned.map(j => j.driver_id);
        expect(new Set(assignedDriverIds).size).toBe(2);
    });
});
