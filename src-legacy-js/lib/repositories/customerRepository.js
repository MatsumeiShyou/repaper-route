import { supabase } from '../supabase/client';

/**
 * Customer Repository
 * 顧客マスタのCRUD操作を提供
 */

/**
 * 全顧客を取得
 * @param {object} options - { includeItems: boolean }
 * @returns {Promise<Array>}
 */
export const getAllCustomers = async (options = {}) => {
    let query = supabase
        .from('customers')
        .select('*')
        .order('customer_name');

    // オプション: 関連品目も取得
    if (options.includeItems) {
        query = supabase
            .from('customers')
            .select(`
        *,
        customer_items (
          item_id,
          is_default,
          estimated_quantity,
          items (
            id,
            item_name,
            unit
          )
        )
      `)
            .order('customer_name');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
};

/**
 * IDで顧客を取得
 * @param {string} id
 * @param {boolean} includeItems
 * @returns {Promise<object>}
 */
export const getCustomerById = async (id, includeItems = false) => {
    let query = supabase
        .from('customers')
        .select('*')
        .eq('id', id);

    if (includeItems) {
        query = supabase
            .from('customers')
            .select(`
        *,
        customer_items (
          item_id,
          is_default,
          estimated_quantity,
          items (
            id,
            item_name,
            unit
          )
        )
      `)
            .eq('id', id);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
};

/**
 * 顧客を作成
 * @param {object} customer - { customer_name, area, address, phone, default_duration_minutes, schedule_type, holiday_handling, note }
 * @returns {Promise<object>}
 */
export const createCustomer = async (customer) => {
    const { data, error } = await supabase
        .from('customers')
        .insert([{
            id: `c_${Date.now()}`,
            ...customer,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 顧客を更新
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateCustomer = async (id, updates) => {
    const { data, error } = await supabase
        .from('customers')
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
 * 顧客を削除
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteCustomer = async (id) => {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

/**
 * 顧客に品目を関連付け
 * @param {string} customerId
 * @param {string} itemId
 * @param {object} options - { is_default, estimated_quantity }
 * @returns {Promise<object>}
 */
export const addItemToCustomer = async (customerId, itemId, options = {}) => {
    const { data, error } = await supabase
        .from('customer_items')
        .insert([{
            id: `ci_${customerId}_${itemId}_${Date.now()}`,
            customer_id: customerId,
            item_id: itemId,
            is_default: options.is_default !== undefined ? options.is_default : true,
            estimated_quantity: options.estimated_quantity,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 顧客から品目の関連付けを削除
 * @param {string} customerId
 * @param {string} itemId
 * @returns {Promise<void>}
 */
export const removeItemFromCustomer = async (customerId, itemId) => {
    const { error } = await supabase
        .from('customer_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('item_id', itemId);

    if (error) throw error;
};

/**
 * 顧客の品目リストを取得
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export const getCustomerItems = async (customerId) => {
    const { data, error } = await supabase
        .from('customer_items')
        .select(`
      item_id,
      is_default,
      estimated_quantity,
      items (
        id,
        item_name,
        unit,
        description
      )
    `)
        .eq('customer_id', customerId)
        .eq('is_default', true);

    if (error) throw error;
    return data || [];
};
