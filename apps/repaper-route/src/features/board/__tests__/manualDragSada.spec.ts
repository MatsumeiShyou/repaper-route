/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardDragDrop } from '../hooks/useBoardDragDrop';
import { BoardJob } from '../../../types';

vi.mock('../../../contexts/AuthProvider', () => ({
    useAuth: () => ({
        staff: { id: 'admin-1', name: 'Admin User' }
    })
}));

describe('useBoardDragDrop Manual Job Offset Calculation (SADA)', () => {
    it('案件をドラッグした際、dropPreviewが相対座標を基に正確に計算・更新されること', () => {
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
        const mockContainer = {
            getBoundingClientRect: vi.fn().mockReturnValue(mockContainerRect)
        } as unknown as HTMLDivElement;

        const gridContainerRef = { current: mockContainer };
        // モックカラム（X:200でマッチ）
        const mockDriverColRect = {
            top: 100, left: 200, right: 380, bottom: 900, width: 180, height: 800, x: 200, y: 100, toJSON: () => { }
        };
        const mockDriverCol = {
            getBoundingClientRect: vi.fn().mockReturnValue(mockDriverColRect)
        } as unknown as HTMLDivElement;
        const driverColRefs = { current: { 'driver-1': mockDriverCol } };

        const setJobs = vi.fn();
        const setSplits = vi.fn();
        const recordHistory = vi.fn();

        const mockJob: BoardJob = {
            id: 'manual-123',
            title: 'Test Job',
            driverId: 'driver-1', // Initially set to driver-1
            timeConstraint: '10:00', // 10:00 (10*60=600 min). Top= 240/15*32 = 512px
            duration: 30,
            bucket: 'スポット'
        } as any;

        // Mock additional arguments for useBoardDragDrop
        const mockCalculateLayoutAndTiming = vi.fn();
        const mockGetDriversFromCache = vi.fn().mockReturnValue([]);
        const mockIncrementPendingVersion = vi.fn();
        const mockIsLayoutUpdating = { current: false };
        const mockCurrentContainerWidth = { current: 1000 };

        const { result } = renderHook(() => useBoardDragDrop(
            [], // jobs
            [mockJob], // pendingJobs
            [{ id: 'driver-1', name: 'Test Driver', currentVehicle: 'Test Car' } as any], // drivers
            [], // splits
            driverColRefs as any, // driverColRefs
            gridContainerRef as any, // gridContainerRef
            setJobs as any, // setJobs
            setJobs as any, // setPendingJobs
            setSplits as any, // _setSplits
            recordHistory as any, // recordHistory
            vi.fn(), // onInteractionChange
            null // createProposal
        ));

        // カード自体の表示位置 (絶対座標) 
        // コンテナTop 100 + 相対Top 512 = 612px
        const mockCardRect = {
            top: 612,
            left: 200,
            width: 150,
            height: 60,
            bottom: 672,
            right: 350,
            x: 200,
            y: 612,
            toJSON: () => { }
        };
        const mockCardElement: any = {
            getAttribute: vi.fn().mockReturnValue('manual-123'),
            getBoundingClientRect: vi.fn().mockReturnValue(mockCardRect),
        };
        mockCardElement.closest = vi.fn().mockReturnValue(mockCardElement);

        // シミュレーション1: ドラッグ開始（Down） - マウスは絶対Y=622 (カード上部から10pxの場所)
        const mockDownEvent = {
            button: 0,
            clientX: 250,
            clientY: 622,
            currentTarget: mockCardElement,
            stopPropagation: vi.fn()
        } as unknown as React.MouseEvent;

        act(() => {
            result.current.handleJobMouseDown(mockDownEvent, mockJob);
        });

        expect(result.current.draggingJobId).toBe('manual-123');
        expect(result.current.dropPreview?.startTime).toBe('10:00'); // ドラッグ中の初期値

        // シミュレーション2: ドラッグ移動（Move） - マウスを絶対Y=718（カードが下に96px移動：15分枠×3=45分増加）
        // 期待値: 新しい開始時間は 10:45
        const mockMoveEvent = new MouseEvent('mousemove', {
            clientX: 250,
            clientY: 718
        });

        act(() => {
            result.current.handleBackgroundMouseMove(mockMoveEvent);
        });

        // 答え合わせ: dropPreview が正しくオフセットを加味して新しい時間（10:45）を計算していること
        expect(result.current.dropPreview).toBeTruthy();
        console.log(`[SADA Diagnostic] Updated Preview Start Time: ${result.current.dropPreview?.startTime}`);
        expect(result.current.dropPreview?.startTime).toBe('10:45');
    });
});
