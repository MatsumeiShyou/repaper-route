import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { MasterSchema } from '../config/masterSchema';

/**
 * 汎用マスタCRUDフック (TypeScript版)
 * SDR（State/Decision/Reason）プロトコルに基づくデータ更新を行う
 */
export function useMasterCRUD(schema: MasterSchema) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

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

    const createItem = async (formData: any) => {
        try {
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

    const updateItem = async (idValue: string, formData: any) => {
        try {
            const { error: err } = await supabase
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: idValue,
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

    const deleteItem = async (idValue: string) => {
        try {
            const { error: err } = await supabase
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: idValue,
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
