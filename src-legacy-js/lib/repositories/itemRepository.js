import { supabase } from '../supabase/client';

/**
 * Item Repository
 * 品目マスタのCRUD操作を提供
 */

/**
 * 全品目を取得
 * @returns {Promise<Array>}
 */
export const getAllItems = async () => {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('item_name');

    if (error) throw error;
    return data || [];
};

/**
 * IDで品目を取得
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getItemById = async (id) => {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * 品目を作成
 * @param {object} item - { item_name, unit, description }
 * @returns {Promise<object>}
 */
export const createItem = async (item) => {
    const { data, error } = await supabase
        .from('items')
        .insert([{
            id: `item_${Date.now()}`,
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 品目を更新
 * @param {string} id
 * @param {object} updates - { item_name?, unit?, description? }
 * @returns {Promise<object>}
 */
export const updateItem = async (id, updates) => {
    const { data, error } = await supabase
        .from('items')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 品目を削除
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteItem = async (id) => {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
