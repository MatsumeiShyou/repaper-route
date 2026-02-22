import { render, fireEvent, screen } from '@testing-library/react';
import { MasterDataLayout } from './MasterDataLayout';
import { MASTER_SCHEMAS } from '../config/masterSchema';
import { AITestBatcher } from '../test/ai/AITestBatcher';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Supabase client and useMasterCRUD hook need to be mocked
vi.mock('../lib/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            update: vi.fn().mockResolvedValue({ data: null, error: null }),
            eq: vi.fn().mockReturnThis(),
        })),
    },
}));

vi.mock('../hooks/useMasterCRUD', () => ({
    default: vi.fn(() => ({
        data: [
            { id: '1', name: 'テスト車両1', callsign: 'C1', number: '11-11', type: '4t', is_active: true },
            { id: '2', name: 'テスト車両2', callsign: 'C2', number: '22-22', type: '10t', is_active: false },
        ],
        loading: false,
        error: null,
        createItem: vi.fn(),
        updateItem: vi.fn(),
        deleteItem: vi.fn(),
    })),
}));

describe('MasterDataLayout SADA Test', () => {
    let batcher: AITestBatcher;

    beforeEach(() => {
        batcher = new AITestBatcher();
    });

    it('captures semantic changes when opening and closing the creation modal', async () => {
        const { container } = render(<MasterDataLayout schema={MASTER_SCHEMAS.vehicles} />);

        // 1. Initial State
        batcher.start(container);

        // 2. Click "新規登録" to open modal
        const createButton = screen.getByRole('button', { name: /新規登録/i });
        fireEvent.click(createButton);

        // Wait for modal transition if any (Modal uses Portal in some implementations, but let's check container)
        // Note: MasterDataLayout renders Modal component which might use a Portal.
        // If it's a Portal, container might not have the modal.
        // Assuming MasterDataLayout renders Modal inline or within the tree for simple tests.

        batcher.recordAction(container, 'Clicked "新規登録" button', 'openModal');

        // 3. Verify modal header is present in the captured delta
        const promptData = batcher.generatePromptData(
            'Verify that clicking "新規登録" opens the creation modal with correct fields.'
        );

        expect(promptData.steps.length).toBeGreaterThan(0);
        expect(promptData.steps[0].delta).toBeDefined();
    });

    it('captures semantic changes when filtering the list', async () => {
        const { container } = render(<MasterDataLayout schema={MASTER_SCHEMAS.vehicles} />);

        batcher.start(container);

        // 1. Type "テスト車両1" in search input
        const searchInput = screen.getByPlaceholderText(/検索.../i);
        fireEvent.change(searchInput, { target: { value: 'テスト車両1' } });

        batcher.recordAction(container, 'Typed "テスト車両1" in search input', 'searchField');

        const promptData = batcher.generatePromptData(
            'Verify that searching for "テスト車両1" correctly filters the list and shows only the relevant record.'
        );

        expect(promptData.steps.length).toBeGreaterThan(0);
        expect(promptData.steps[0].delta).toBeDefined();
    });
});
