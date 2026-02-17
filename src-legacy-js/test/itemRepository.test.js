import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllItems, getItemById, createItem, updateItem, deleteItem } from '../lib/repositories/itemRepository';
import { supabase } from '../lib/supabase/client';

// Mock Supabase client
vi.mock('../lib/supabase/client', () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe('itemRepository', () => {
    let mockFrom, mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockOrder, mockSingle;

    beforeEach(() => {
        // Reset mocks
        mockSingle = vi.fn().mockResolvedValue({ data: { id: 'item_1', item_name: 'テスト品目' }, error: null });
        mockEq = vi.fn(() => ({ single: mockSingle }));
        mockOrder = vi.fn(() => ({ data: [], error: null }));
        mockSelect = vi.fn(() => ({ order: mockOrder, eq: mockEq, single: mockSingle }));
        mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
        mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) }));
        mockDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
        mockFrom = vi.fn(() => ({
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete
        }));

        supabase.from = mockFrom;
    });

    describe('getAllItems', () => {
        it('fetches all items from database', async () => {
            const mockItems = [
                { id: 'item_1', item_name: '燃えるゴミ', unit: 'kg' },
                { id: 'item_2', item_name: '段ボール', unit: 'kg' }
            ];

            mockOrder.mockResolvedValue({ data: mockItems, error: null });

            const result = await getAllItems();

            expect(supabase.from).toHaveBeenCalledWith('items');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockOrder).toHaveBeenCalledWith('item_name');
            expect(result).toEqual(mockItems);
        });

        it('throws error when database query fails', async () => {
            mockOrder.mockResolvedValue({ data: null, error: new Error('DB Error') });

            await expect(getAllItems()).rejects.toThrow('DB Error');
        });
    });

    describe('createItem', () => {
        it('creates a new item with generated ID', async () => {
            const newItem = { item_name: '新品目', unit: '個' };
            const createdItem = { id: 'item_123', ...newItem };

            mockSingle.mockResolvedValue({ data: createdItem, error: null });

            const result = await createItem(newItem);

            expect(supabase.from).toHaveBeenCalledWith('items');
            expect(mockInsert).toHaveBeenCalled();
            expect(result).toEqual(createdItem);
        });
    });

    describe('updateItem', () => {
        it('updates an existing item', async () => {
            const updates = { item_name: '更新された品目' };
            const updatedItem = { id: 'item_1', ...updates };

            mockSingle.mockResolvedValue({ data: updatedItem, error: null });

            const result = await updateItem('item_1', updates);

            expect(supabase.from).toHaveBeenCalledWith('items');
            expect(mockUpdate).toHaveBeenCalled();
            expect(result).toEqual(updatedItem);
        });
    });

    describe('deleteItem', () => {
        it('deletes an item by ID', async () => {
            await deleteItem('item_1');

            expect(supabase.from).toHaveBeenCalledWith('items');
            expect(mockDelete).toHaveBeenCalled();
        });
    });
});
