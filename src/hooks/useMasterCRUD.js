import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // assuming standard supabase client location

/**
 * 汎用マスタCRUDフック
 * SDR（State/Decision/Reason）プロトコルに基づくデータ更新を行う
 */
export function useMasterCRUD(schema) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const { data: res, error: err } = await supabase
                .from(schema.viewName)
                .select('*');

            if (err) throw err;
            setData(res || []);
        } catch (err) {
            setError(err);
            console.error('Master Data Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    }, [schema.viewName]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createItem = async (formData) => {
        try {
            // Simplified for rollback, actual implementation uses RPC for SDR
            const { error: err } = await supabase
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_core_data: formData,
                    p_reason: 'マスタ管理画面からの新規登録'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const updateItem = async (id, formData) => {
        try {
            const { error: err } = await supabase
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: id,
                    p_core_data: formData,
                    p_reason: 'マスタ管理画面からの更新'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const deleteItem = async (id) => {
        try {
            // Archive logic
            const { error: err } = await supabase
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: id,
                    p_core_data: { is_active: false },
                    p_reason: 'マスタ管理画面からのアーカイブ'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    return {
        data,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem,
        refresh
    };
}

export default useMasterCRUD;
