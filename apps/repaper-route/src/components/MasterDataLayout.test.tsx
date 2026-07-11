// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MasterDataLayout } from './MasterDataLayout';
import useMasterCRUD from '../hooks/useMasterCRUD';
import { MasterSchema } from '../config/masterSchema';

vi.mock('../hooks/useMasterCRUD', () => {
    return {
        default: vi.fn()
    };
});

vi.mock('../lib/supabase/client', () => {
    return {
        supabase: {
            auth: {
                getSession: vi.fn(),
                getUser: vi.fn(),
                onAuthStateChange: vi.fn().mockReturnValue({
                    data: { subscription: { unsubscribe: vi.fn() } }
                })
            }
        }
    };
});

const dummySchema: MasterSchema = {
    tableName: 'master_collection_points',
    rpcTableName: 'master_collection_points',
    viewName: 'view_master_points',
    primaryKey: 'id',
    title: '拠点マスタ管理',
    description: '回収拠点および顧客情報の管理を行います。',
    label: 'Points (Master)',
    fields: [
        { name: 'display_name', label: 'Point Name', type: 'text', required: true, updatable: true },
        { name: 'furigana', label: 'Furigana', type: 'text', required: false, updatable: true }
    ],
    columns: [
        { key: 'display_name', label: '拠点名', type: 'text', sortable: true },
        { key: 'furigana', label: 'フリガナ', type: 'text', sortable: true }
    ],
    searchFields: ['display_name', 'furigana']
};

describe('MasterDataLayout Japanese Syllabary Filter regex', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMasterCRUD).mockReturnValue({
            data: [
                { id: '1', display_name: 'かきこ', furigana: 'カキコ' },
                { id: '2', display_name: 'がぎぐ', furigana: 'ガギグ' },
                { id: '3', display_name: 'さしす', furigana: 'サシス' },
                { id: '4', display_name: 'ざじず', furigana: 'ザジズ' },
                { id: '5', display_name: 'たちつ', furigana: 'タチツ' },
                { id: '6', display_name: 'だぢづ', furigana: 'ダヂヅ' },
                { id: '7', display_name: 'はひふ', furigana: 'ハヒフ' },
                { id: '8', display_name: 'ばびぶ', furigana: 'バビブ' },
                { id: '9', display_name: 'ぱぴぷ', furigana: 'パピプ' },
                { id: '10', display_name: 'あいう', furigana: 'アイウ' }
            ],
            loading: false,
            error: null,
            createItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            refresh: vi.fn()
        });
    });

    it('should correctly filter voiced and semi-voiced kana for か, さ, た, は groups', async () => {
        render(<MasterDataLayout schema={dummySchema} />);

        // Click 'か' group button
        const kaButton = screen.getByRole('button', { name: 'か' });
        fireEvent.click(kaButton);

        // Should match 'かきこ' (カキコ) and 'がぎぐ' (ガギグ)
        expect(screen.queryByText('かきこ')).not.toBeNull();
        expect(screen.queryByText('がぎぐ')).not.toBeNull();
        // Should NOT match 'さしす'
        expect(screen.queryByText('さしす')).toBeNull();

        // Click 'さ' group button
        const saButton = screen.getByRole('button', { name: 'さ' });
        fireEvent.click(saButton);

        expect(screen.queryByText('さしす')).not.toBeNull();
        expect(screen.queryByText('ざじず')).not.toBeNull();
        expect(screen.queryByText('かきこ')).toBeNull();

        // Click 'た' group button
        const taButton = screen.getByRole('button', { name: 'た' });
        fireEvent.click(taButton);

        expect(screen.queryByText('たちつ')).not.toBeNull();
        expect(screen.queryByText('だぢづ')).not.toBeNull();
        expect(screen.queryByText('さしす')).toBeNull();

        // Click 'は' group button
        const haButton = screen.getByRole('button', { name: 'は' });
        fireEvent.click(haButton);

        expect(screen.queryByText('はひふ')).not.toBeNull();
        expect(screen.queryByText('ばびぶ')).not.toBeNull();
        expect(screen.queryByText('ぱぴぷ')).not.toBeNull();
        expect(screen.queryByText('あいう')).toBeNull();
    });
});
