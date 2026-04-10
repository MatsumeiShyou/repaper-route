import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { InteractionProvider } from '../../contexts/InteractionContext';
import { AuthProvider } from '../../contexts/AuthProvider';
import { NotificationProvider } from '../../contexts/NotificationContext';
// Note: SADA tests may require specific mocks for Supabase before mounting AuthProvider
// depending on how deep the integration is meant to be tested. 
// For Zero-Baseline SADA, we inject a mock AuthContext if needed, 
// but by default we wrap with the real providers.

/**
 * 実際の全Providerツリー（App.tsx準拠）でコンポーネントをラップし、
 * 本番環境と同一のコンテキストを提供するカスタムレンダー関数。
 * 100-pt SADA-First Reconstruction (Phase 2) にて導入。
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <InteractionProvider>
            <AuthProvider>
                <NotificationProvider>
                    {children}
                </NotificationProvider>
            </AuthProvider>
        </InteractionProvider>
    );
};

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as renderWithProviders };
