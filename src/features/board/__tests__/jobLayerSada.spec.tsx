import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { JobLayer } from '../components/JobLayer';
import { BoardJob } from '../../../types';

describe('JobLayer SADA Preview Calculation', () => {
    it('手動追加案件をドラッグした際のプレビューのtop属性が正確に計算されること', () => {
        const mockJob: BoardJob = {
            id: 'manual-123',
            title: 'Test Delivery',
            driverId: 'driver-A',
            timeConstraint: '10:00',
            duration: 30,
            bucket: 'スポット',
            isSpot: true
        } as any;

        // 手動追加時のドラッグ状態をモック
        // - コンテナはY=100から始まる
        // - カードは絶対Y=250で掴まれる（コンテナ相対150）
        // - マウスの絶対Y=260、相対Y=160
        // - オフセット計算: dragOffset.y = 10 (カード内から下へ10pxの位置を掴んだ)
        // 期待値: top = dragMousePos.y(160) - dragOffset.y(10) - 7 = 143px

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
                    startTime: '10:00',
                    duration: 30,
                    isOverlapError: false,
                    isWarning: false
                }}
                dropSplitPreview={null}
                dragMousePos={{ x: 200, y: 160 }} // relative coordinate already calculated
                dragOffset={{ x: 0, y: 10 }}
                resizingState={null}
                onJobMouseDown={vi.fn()}
                onSplitMouseDown={vi.fn()}
                onJobClick={vi.fn()}
                onResizeStart={vi.fn()}
            />
        );

        // プレビューコンテナのDOMを探索
        // プレビューは "absolute pointer-events-none border-2..." のクラスを持つ
        const previewElement = container.querySelector('.pointer-events-none.absolute');

        expect(previewElement).toBeTruthy();

        if (previewElement) {
            const styleAttr = previewElement.getAttribute('style') || '';
            const topMatch = styleAttr.match(/top:\s*([^;]+)/);
            const topValue = topMatch ? topMatch[1].trim() : '';
            console.log(`[SADA Diagnostic] Preview style top attribute: ${topValue}`);
            expect(topValue).toBe('143px');
        }
    });
});
