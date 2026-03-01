/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { renderWithProviders } from './utils/renderWithProviders';

// Appコンポーネント内で使用される外部依存（Supabaseのモック等）が必要な場合はここに追記
vi.mock('../contexts/AuthProvider', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
        currentUser: {
            id: "test-admin-id",
            name: "Admin User",
            role: "admin",
            user_id: "test-auth-id",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicle_info: null,
            can_edit_board: true
        },
        isLoading: false,
        logout: vi.fn(),
    }),
}));

// ResizeObserverのグローバルモック (Recharts等のチャート・キャンバス系ライブラリがマウント時に必要とするケース用)
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
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('Smoke Test - Global App Mount', () => {
    it('renders the application root without crashing', () => {
        // 100-pt SADA-First Reconstruction: 
        // real context providers + mock auth -> full tree mount
        renderWithProviders(<App />);

        // AuthProviderがモックされ、adminユーザーとしてロードされているため、
        // AdminLayoutのロゴテキスト等が表示されるはず
        expect(screen.getByText(/epaper/i)).toBeInTheDocument();
    });
});
