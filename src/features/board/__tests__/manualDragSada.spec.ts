import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardDragDrop } from '../hooks/useBoardDragDrop';
import { BoardJob } from '../../../types';

describe('useBoardDragDrop Manual Job Offset Calculation (SADA)', () => {
    it('手動追加直後の案件をドラッグした際、dragMousePosがコンテナの相対座標に初期化されること', () => {
        // Mock Container Ref (TimeGrid)
        const mockContainerRect = {
            top: 100, // Container is 100px from the top of the viewport
            left: 200,
            width: 1000,
            height: 800,
            bottom: 900,
            right: 1200,
            x: 200,
            y: 100,
            toJSON: () => { }
        };
        const mockContainer = document.createElement('div');
        mockContainer.getBoundingClientRect = vi.fn().mockReturnValue(mockContainerRect);

        const gridContainerRef = { current: mockContainer };
        const driverColRefs = { current: {} };
        const setJobs = vi.fn();
        const setSplits = vi.fn();
        const recordHistory = vi.fn();

        const mockJob: BoardJob = {
            id: 'manual-123',
            title: 'Test Job',
            driverId: 'driver-1',
            timeConstraint: '10:00',
            duration: 30,
            bucket: 'スポット'
        } as any;

        const { result } = renderHook(() => useBoardDragDrop(
            [mockJob],
            [{ id: 'driver-1', name: 'Test Driver', currentVehicle: 'Test Car' } as any],
            [],
            driverColRefs as any,
            gridContainerRef as any,
            setJobs,
            setSplits,
            recordHistory
        ));

        // シミュレーション: ユーザーが画面上で Y=250 の位置にあるカードを掴む
        // コンテナの top が 100 なので、相対座標は 250 - 100 = 150 になるべき

        // カード自身の位置モック
        const mockCardRect = {
            top: 250, // Absolute viewport Y
            left: 300,
            width: 150,
            height: 60,
            bottom: 310,
            right: 450,
            x: 300,
            y: 250,
            toJSON: () => { }
        };
        const mockCardElement = document.createElement('div');
        mockCardElement.setAttribute('data-job-id', 'manual-123');
        mockCardElement.getBoundingClientRect = vi.fn().mockReturnValue(mockCardRect);

        const mockEvent = {
            button: 0,
            clientX: 320, // 掴んだX座標
            clientY: 260, // 掴んだY座標 (絶対座標)
            currentTarget: mockCardElement,
            stopPropagation: vi.fn()
        } as unknown as React.MouseEvent;

        act(() => {
            result.current.handleJobMouseDown(mockEvent, mockJob);
        });

        // 1. dragOffsetの確認（カード内での掴んだ位置: 260 - 250 = 10）
        expect(result.current.dragOffset.y).toBe(10);

        // 2. dragMousePosの初期値の確認（相対座標へ変換されているか）
        // e.clientY(260) - container.top(100) = 160
        expect(result.current.dragMousePos.y).toBe(160);

        // 3. この状態でのプレビューのTop描画座標を計算する
        // JobLayer の式: top = dragMousePos.y - dragOffset.y - 7
        const previewTop = result.current.dragMousePos.y - result.current.dragOffset.y - 7;

        // 期待値: 160 - 10 - 7 = 143 (相対座標として描画されるべき位置)
        // もし直っていなければ、ここは 260 - 10 - 7 = 243 となり、大きく乖離する

        console.log(`[SADA Diagnostic] Drag Offset Y: ${result.current.dragOffset.y}`);
        console.log(`[SADA Diagnostic] Drag Mouse Pos Y (Relative): ${result.current.dragMousePos.y}`);
        console.log(`[SADA Diagnostic] Calculated Preview Top: ${previewTop}`);

        expect(previewTop).toBe(143);
    });
});
