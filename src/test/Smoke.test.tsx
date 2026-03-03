/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { TestProviders } from './TestProviders';

describe('Smoke Test - Global App Mount', () => {
    it('renders the application root without crashing', () => {
        // App全体を共通Providerでラップしてマウントする最小限のテスト
        // （JSDOMの限界を超える複雑な描画テストは責務外）
        render(
            <TestProviders>
                <App />
            </TestProviders>
        );

        // まずはAppコンポーネントがクラッシュせずにマウントされる（"div"が存在する）かを検証
        const rootElement = document.querySelector('div');
        expect(rootElement).toBeInTheDocument();
    });
});
