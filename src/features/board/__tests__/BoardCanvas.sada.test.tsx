/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BoardCanvas from '../BoardCanvas';
import { renderWithProviders } from '../../../test/utils/renderWithProviders';
import { MockFactory } from '../../../test/utils/MockFactory';
import { BoardDriver, BoardJob } from '../../../types';

// --- モックの定義 ---

vi.mock('../../../contexts/AuthProvider', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
        currentUser: { role: 'admin' },
        isLoading: false,
    }),
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// useMasterData のモック
const mockUseMasterData = vi.fn();
vi.mock('../hooks/useMasterData', () => ({
    useMasterData: () => mockUseMasterData()
}));

// useBoardData のモック
const mockUseBoardData = vi.fn();
vi.mock('../hooks/useBoardData', () => ({
    useBoardData: () => mockUseBoardData()
}));

describe('BoardCanvas SADA', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseMasterData.mockReturnValue({
            customers: [MockFactory.createPoint()],
            vehicles: [MockFactory.createVehicle()],
            isLoading: false
        });
    });

    it('renders the board with a mock driver and job', () => {
        const testDriver: BoardDriver = {
            id: 'drv_1',
            name: 'テスト担当者',
            driverName: 'テスト担当者',
            currentVehicle: 'テスト車両',
            course: 'テストコース',
            color: '#000',
        };

        const testJob: BoardJob = {
            id: 'job_1',
            driverId: 'drv_1',
            timeConstraint: '09:00',
            startTime: '09:00',
            duration: 30,
            title: 'SADAテスト案件',
            taskType: 'collection',
            bucket: '4t',
            area: 'テストエリア',
            isSpot: false
        };

        mockUseBoardData.mockReturnValue({
            masterDrivers: [],
            drivers: [testDriver],
            setDrivers: vi.fn(),
            jobs: [testJob],
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
        });

        renderWithProviders(<BoardCanvas />);

        // ドライバーヘッダーが表示されているか
        // DriverHeaderでは `{driverName} / {currentVehicle}` の形式で出力されるため、部分一致で検索する
        expect(screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'div' && content.includes('テスト担当者') && content.includes('テスト車両');
        })).toBeInTheDocument();

        // 案件が表示されているか (JobLayer内部構造に依存するため、テキストノードとして探す)
        expect(screen.getByText((content) => {
            return content.includes('SADAテスト案件');
        })).toBeInTheDocument();
    });

    it('renders loading state when data is not loaded', () => {
        mockUseBoardData.mockReturnValue({
            isDataLoaded: false,
            masterDrivers: [],
            drivers: [],
            jobs: [],
            pendingJobs: [],
            splits: []
        });

        renderWithProviders(<BoardCanvas />);

        expect(screen.getByText('情報を読み込み中...')).toBeInTheDocument();
    });
});
