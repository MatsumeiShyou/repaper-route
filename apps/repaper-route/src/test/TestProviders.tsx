import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * チE��ト�E通�Eロバイダー
 * ルーター、テーマ、あるいはReduxやContextなど
 * アプリケーション全体で忁E��とされるProviderをラチE�Eします、E */
export const TestProviders = ({ children }: { children: ReactNode }) => {
    return (
        <MemoryRouter>
            {/* 今征EThemeProvider, AuthProvider などが忁E��になれ�Eここに追加しまぁE*/}
            {children}
        </MemoryRouter>
    );
};
