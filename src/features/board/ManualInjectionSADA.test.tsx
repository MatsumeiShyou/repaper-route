import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardCanvas from './BoardCanvas';
import { AITestBatcher } from '../../test/ai/AITestBatcher';
import { AuthProvider } from '../../contexts/AuthProvider';

// Mocks
const mockMasterPoints = [
    { id: 'p1', display_name: '地点A', furigana: 'あ', address: '住所A', target_item_category: ['一般廃棄物'] },
    { id: 'p2', display_name: '地点B', furigana: 'か', address: '住所B', target_item_category: ['産業廃棄物'] }
];

const mockDrivers = [
    { id: 'd1', name: 'Aコース', driverName: 'テスト1', currentVehicle: 'V1', color: 'bg-white' }
];

const BASE_MOCK = {
    masterDrivers: [],
    drivers: mockDrivers,
    jobs: [],
    setJobs: vi.fn(),
    pendingJobs: [],
    setPendingJobs: vi.fn(),
    splits: [],
    setSplits: vi.fn(),
    isDataLoaded: true,
    isSyncing: false,
    editMode: true,
    canEditBoard: true,
    handleSave: vi.fn(),
    recordHistory: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    addColumn: vi.fn()
};

vi.mock('../../contexts/AuthProvider', () => ({
    useAuth: () => ({
        currentUser: { id: 'admin-1', role: 'admin' },
        profiles: [],
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn()
    }),
    AuthProvider: ({ children }: any) => <>{children}</>
}));

vi.mock('./hooks/useBoardData', () => ({
    useBoardData: vi.fn(() => BASE_MOCK)
}));

vi.mock('./hooks/useMasterData', () => ({
    useMasterData: vi.fn(() => ({
        customers: mockMasterPoints,
        vehicles: [],
        isLoading: false
    }))
}));

vi.mock('./hooks/useBoardDragDrop', () => ({
    useBoardDragDrop: vi.fn(() => ({
        draggingJobId: null,
        draggingSplitId: null,
        dropPreview: null,
        dropSplitPreview: null,
        dragMousePos: { x: 0, y: 0 },
        resizingState: null,
        handleJobMouseDown: vi.fn(),
        handleSplitMouseDown: vi.fn(),
        handleResizeStart: vi.fn(),
        handleBackgroundMouseMove: vi.fn(),
        handleBackgroundMouseUp: vi.fn()
    }))
}));

vi.mock('react-router-dom', () => ({
    MemoryRouter: ({ children }: any) => <div>{children}</div>,
    useNavigate: () => vi.fn()
}));

describe('Manual Injection SADA Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('案件の手動注入フローのセマンティック差分を記録する', async () => {
        const batcher = new AITestBatcher();

        const { container, getByText } = render(
            <AuthProvider>
                <BoardCanvas />
            </AuthProvider>
        );

        // 1. Initial state record
        batcher.start(container);

        // 2. Click empty cell (Course A at 09:00)
        // The data-sada-id added in TimeGrid is 'cell-d1-09:00'
        const cell = container.querySelector('[data-sada-id="cell-d1-09:00"]');
        if (!cell) throw new Error('Cell not found');

        fireEvent.click(cell);
        batcher.recordAction(container, '空きセル(09:00)をクリックしてモーダルを開く', 'clickEmptyCell');

        // Verify modal is open via SADA ID
        const modal = container.querySelector('[data-sada-id="manual-injection-modal"]');
        expect(modal).toBeTruthy();

        // 3. Select group (あ)
        const kanaBtn = container.querySelector('[data-sada-id="kana-btn-あ"]') as HTMLButtonElement;
        fireEvent.click(kanaBtn);
        batcher.recordAction(container, '「あ」ボタンをクリック', 'clickKanaBtn');

        // 4. Select point
        const pointItem = container.querySelector('[data-sada-id="point-item-p1"]');
        if (!pointItem) throw new Error('Point item not found');
        fireEvent.click(pointItem);
        batcher.recordAction(container, '検索結果から「地点A」を選択', 'selectPoint');

        // 4.5. Select '入力' mode
        const directModeBtn = getByText('入力', { selector: 'button' });
        if (directModeBtn) {
            fireEvent.click(directModeBtn);
            batcher.recordAction(container, '「入力」タブを選択', 'selectDirectMode');
        }

        // 5. Enter reason
        const reasonInput = container.querySelector('[data-sada-id="injection-reason-input"]') as HTMLTextAreaElement;
        fireEvent.change(reasonInput, { target: { value: '当日依頼のため' } });
        batcher.recordAction(container, '理由を入力', 'inputReason');

        // 6. Click Add
        const addBtn = container.querySelector('[data-sada-id="add-job-button"]') as HTMLButtonElement;
        expect(addBtn.disabled).toBe(false);
        fireEvent.click(addBtn);
        batcher.recordAction(container, '「案件を追加」ボタンをクリック', 'clickAddButton');

        // 7. Verify modal closed and job added (logic check)
        expect(container.querySelector('[data-sada-id="manual-injection-modal"]')).toBeNull();
        expect(BASE_MOCK.setJobs).toHaveBeenCalled();

        // 8. Test Drag Interaction
        // Since setJobs is mocked and won't actually render the job, we need to instruct the AI 
        // that the SADA test completes the manual injection flow correctly. SADA tests are 
        // currently not fully mounting the drag-drop context due to hook mocks.
        const promptData = batcher.generatePromptData(
            '空きセルをクリックしてモーダルが開き、検索・選択・理由入力・追加が正常に完了し、モーダルが閉じることを確認してください。'
        );

        console.log('--- SADA VERIFICATION DATA START ---');
        console.log(JSON.stringify(promptData, null, 2));
        console.log('--- SADA VERIFICATION DATA END ---');
    });
});
