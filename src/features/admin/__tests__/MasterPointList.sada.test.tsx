import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MasterPointList from '../MasterPointList';
import { AITestBatcher } from '../../../test/ai/AITestBatcher';
import { AuthProvider } from '../../../contexts/AuthProvider';

// useMasterCRUDのモック化
vi.mock('../../hooks/useMasterCRUD', () => ({
    useMasterCRUD: () => ({
        data: [],
        loading: false,
        error: null,
        createItem: vi.fn(),
        updateItem: vi.fn(),
        deleteItem: vi.fn(),
        refresh: vi.fn()
    })
}));

describe('MasterPointList SADA Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('変則周期（第N曜日）の入力とバッジレンダリングを検証する', async () => {
        const batcher = new AITestBatcher();

        const { container } = render(
            <AuthProvider>
                <MasterPointList />
            </AuthProvider>
        );

        // 1. 初期状態の記録
        batcher.start(container);

        // 新規登録モーダルを開く
        fireEvent.click(screen.getByText('新規登録'));
        batcher.recordAction(container, '新規登録モーダルを開く', 'openModal');

        // 第2週 水曜日を選択して追加する
        fireEvent.change(screen.getByLabelText('第N週の選択'), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText('曜日の選択'), { target: { value: 'Wed' } });
        fireEvent.click(screen.getByLabelText('変則周期を追加'));

        batcher.recordAction(container, '第2週水曜日を追加', 'addPeriodicDay');

        // 祝日稼働を選択
        fireEvent.click(screen.getByText('祝日稼働'));
        batcher.recordAction(container, '祝日稼働を有効化', 'enableHoliday');

        // AI プロンプトデータの生成
        const promptData = batcher.generatePromptData(
            '「第2(水)」というタグが表示されていること、および祝日稼働が選択状態にあることを、DOMのセマンティック差分から確認してください。'
        );

        expect(promptData.steps.length).toBe(3);

        // デバッグ出力
        console.log('--- Periodic SADA Prompt Data ---');
        console.log(JSON.stringify(promptData, null, 2).substring(0, 1000) + '...');
    });
});
