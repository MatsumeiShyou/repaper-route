/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MasterPointList from '../MasterPointList';
import { renderWithProviders } from '../../../test/utils/renderWithProviders';
import { MockFactory } from '../../../test/utils/MockFactory';

// --- モックの定義 ---

// 1. AuthProvider のモック (Smokeテストと同様)
vi.mock('../../../contexts/AuthProvider', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
        currentUser: { role: 'admin' },
        isLoading: false,
    }),
}));

// ResizeObserver のモック (Recharts 等用)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// matchMedia のモック
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

// 2. useMasterCRUD のモック
// MasterDataLayout は内部でこのカスタムフックを呼び出してデータを取得する
const mockUseMasterCRUD = vi.fn();
vi.mock('../../../hooks/useMasterCRUD', () => ({
    default: (...args: any[]) => mockUseMasterCRUD(...args)
}));

describe('MasterData SADA - MasterPointList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the MasterPointList with mocked point data', async () => {
        // MockFactory を使用して厳格に型付けされたダミーデータを生成
        const testPoint = MockFactory.createPoint({
            display_name: 'テスト第一回収拠点',
            address: '東京都テスト区1-2-3',
            is_active: true
        });

        // useMasterCRUD の戻り値をモック設定
        mockUseMasterCRUD.mockReturnValue({
            data: [testPoint],
            loading: false,
            error: null,
            createItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
        });

        renderWithProviders(<MasterPointList />);

        // タイトル（スキーマ設定による）が存在するか
        expect(screen.getByText('回収先管理')).toBeInTheDocument();

        // テーブルにモックデータの `display_name` がレンダリングされているか
        await waitFor(() => {
            expect(screen.getByText('テスト第一回収拠点')).toBeInTheDocument();
        });

        // 住所もレンダリングされているか
        expect(screen.getByText('東京都テスト区1-2-3')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        // ローディング状態のモック
        mockUseMasterCRUD.mockReturnValue({
            data: [],
            loading: true,
            error: null,
        });

        const { container } = renderWithProviders(<MasterPointList />);

        // ローディングスピナー（animate-spinクラスを持つ要素）が存在するか確認
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
});
