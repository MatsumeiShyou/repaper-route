import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * テスト共通プロバイダー
 * ルーター、テーマ、あるいはReduxやContextなど
 * アプリケーション全体で必要とされるProviderをラップします。
 */
export const TestProviders = ({ children }: { children: ReactNode }) => {
    return (
        <MemoryRouter>
            {/* 今後 ThemeProvider, AuthProvider などが必要になればここに追加します */}
            {children}
        </MemoryRouter>
    );
};
