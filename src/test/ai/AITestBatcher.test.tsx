import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AITestBatcher } from './AITestBatcher';
import '@testing-library/jest-dom';

describe('DeltaManager & AITestBatcher', () => {

    it('creates correct delta when a single node changes in a tree', () => {
        const batcher = new AITestBatcher();

        const App = ({ status }: { status: string }) => (
            <div data-testid="app">
                <header>
                    <h1 role="heading">App Title</h1>
                </header>
                <main>
                    <button>Click</button>
                    <p role="status">{status}</p>
                </main>
            </div>
        );

        const { container, rerender } = render(<App status="Idle" />);

        // 1. バッチ開始（初期状態をスナップショット）
        batcher.start(container);

        // 2. 状態を変更して再レンダリングし、アクションを記録
        rerender(<App status="Loading..." />);
        batcher.recordAction(container, 'Status changed to loading');

        const promptData = batcher.generatePromptData('Verify status change');

        expect(promptData.initialState).toBeDefined();
        expect(promptData.steps.length).toBe(1);

        const step = promptData.steps[0];
        expect(step.action).toBe('Status changed to loading');

        const delta = step.delta;
        expect(delta).toBeDefined();

        if (delta) {
            // Root (the wrapper div) has children
            const appDiv = delta.children?.[0];
            expect(appDiv?.tag).toBe('div');

            // Due to pruning, h1, button, and p are direct children of appDiv
            const h1 = appDiv?.children?.find((c: any) => c.tag === 'h1');
            expect(h1?.unchanged).toBe(true);

            const btn = appDiv?.children?.find((c: any) => c.tag === 'button');
            expect(btn?.unchanged).toBe(true);

            const p = appDiv?.children?.find((c: any) => c.tag === 'p');
            expect(p?.unchanged).toBeUndefined();
            expect(p?.content).toBe('Loading...');
        }
    });

    it('generates error diagnostic logic correctly', () => {
        const batcher = new AITestBatcher();
        const { container } = render(<div role="main">Hello</div>);
        batcher.start(container);
        batcher.recordAction(container, 'Dummy action');

        const diag = batcher.generateErrorDiagnostic(new Error('Test Failed'));
        expect(diag.error).toBe('Test Failed');
        expect(diag.executedSteps.length).toBe(1);
    });

});
