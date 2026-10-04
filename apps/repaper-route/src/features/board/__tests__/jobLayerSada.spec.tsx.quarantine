import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { JobLayer } from '../components/JobLayer';
import { BoardJob } from '../../../types';

describe('JobLayer SADA Preview Calculation', () => {
    it('ドロップターゲットの影（プレビュー）のtop属性が正確に計算されること', () => {
        const mockJob: BoardJob = {
            id: 'manual-123',
            title: 'Test Delivery',
            driverId: 'driver-A',
            timeConstraint: '10:00',
            duration: 30,
            bucket: 'スポット',
            isSpot: true
        } as any;

        const { container } = render(
            <JobLayer
                drivers={[{ id: 'driver-A', name: 'Test Driver', currentVehicle: 'Test Car' } as any]}
                jobs={[mockJob]}
                splits={[]}
                draggingJobId="manual-123"
                draggingSplitId={null}
                selectedJobId={null}
                dropPreview={{
                    driverId: 'driver-A',
                    startTime: '10:00', // start time 10:00 = 600 minutes
                    duration: 30,
                    isOverlapError: false,
                    isWarning: false
                }}
                dropSplitPreview={null}
                resizingState={null}
                onJobMouseDown={vi.fn()}
                onSplitMouseDown={vi.fn()}
                onJobClick={vi.fn()}
                onResizeStart={vi.fn()}
            />
        );

        // プレビューコンテナのDOMを探索
        // プレビュー（ドロップ先の影）は "border-dashed" のクラスを持つ
        const previewElement = container.querySelector('.border-dashed');

        expect(previewElement).toBeTruthy();

        if (previewElement) {
            const styleAttr = previewElement.getAttribute('style') || '';
            const topMatch = styleAttr.match(/top:\s*([^;]+)/);
            const topValue = topMatch ? topMatch[1].trim() : '';
            console.log(`[SADA Diagnostic] Preview style top attribute: ${topValue}`);
            // (10:00 - 06:00) = 4 hours = 240 minutes. 240 / 15 * 32 = 512px
            expect(topValue).toBe('512px');
        }
    });
});
