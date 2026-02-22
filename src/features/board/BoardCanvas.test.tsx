import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BoardCanvas from './BoardCanvas';
import { AITestBatcher } from '../../test/ai/AITestBatcher';
import { AuthProvider } from '../../contexts/AuthProvider';

// モック化
vi.mock('./hooks/useBoardData', () => ({
    useBoardData: () => ({
        drivers: [{ id: 'd1', name: 'ドライバーA', display_order: 1 }],
        jobs: [],
        setJobs: vi.fn(),
        pendingJobs: [{ id: 'pj1', title: '未配車案件' }],
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
    })
}));

// react-router-dom のモック (依存関係がない場合を考慮)
vi.mock('react-router-dom', () => ({
    MemoryRouter: ({ children }: any) => <div>{children}</div>
}));

describe('BoardCanvas SADA Test', () => {
    it('サイドバーの開閉に伴うセマンティック差分を抽出し、AI検証用のデータを生成する', async () => {
        const batcher = new AITestBatcher();

        const { container } = render(
            <AuthProvider>
                <BoardCanvas />
            </AuthProvider>
        );

        // 1. 初期状態の記録
        batcher.start(container);

        // 2. サイドバーを開くアクション
        const openBtn = screen.getByTitle('未配車リスト');
        fireEvent.click(openBtn);

        // 差分記録
        batcher.recordAction(container, 'サイドバーを開くボタンをクリック', 'sidebarOpenBtn');

        // 3. サイドバーを閉じるアクション
        const closeBtn = screen.getByTitle('リストを閉じる');
        fireEvent.click(closeBtn);

        // 差分記録
        batcher.recordAction(container, 'サイドバーを閉じるボタンをクリック', 'sidebarCloseBtn');

        // AI プロンプトデータの生成
        const promptData = batcher.generatePromptData(
            'サイドバーが正しく開閉し、未配車案件が表示・非表示されることを確認してください。'
        );

        // 検証: プロンプトデータに意味のあるアクションが含まれていること
        expect(promptData.steps.length).toBe(2);

        // デバッグ出力
        console.log('--- SADA Prompt Data (Draft) ---');
        console.log(JSON.stringify(promptData, null, 2).substring(0, 500) + '...');
    });
});
