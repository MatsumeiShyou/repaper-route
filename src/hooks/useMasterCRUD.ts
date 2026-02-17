import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { MasterSchema } from '../config/masterSchema';

/**
 * 汎用マスタCRUDフック (TypeScript版)
 * SDR（State/Decision/Reason）プロトコルに基づくデータ更新を行う
 */
export function useMasterCRUD<T extends Record<string, any>>(schema: MasterSchema) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const { data: res, error: err } = await supabase
                // @ts-ignore Dynamic view name from schema cannot be statically verified against Database types
                .from(schema.viewName)
                .select('*');

            if (err) throw err;
            setData((res as unknown as T[]) || []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            console.error('Master Data Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    }, [schema.viewName]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createItem = async (formData: Partial<T>) => {
        try {
            const { error: err } = await supabase
                // @ts-ignore Dynamic RPC call with schema-driven table name
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_core_data: formData,
                    p_reason: 'マスタ管理画面からの新規登録'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    const updateItem = async (idValue: string | number, formData: Partial<T>) => {
        try {
            const { error: err } = await supabase
                // @ts-ignore Dynamic RPC call with schema-driven table name
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: idValue,
                    p_core_data: formData,
                    p_reason: 'マスタ管理画面からの更新'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    const deleteItem = async (idValue: string | number) => {
        try {
            const { error: err } = await supabase
                // @ts-ignore Dynamic RPC call with schema-driven table name
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: idValue,
                    p_core_data: { is_active: false },
                    p_reason: 'マスタ管理画面からのアーカイブ'
                });
            if (err) throw err;
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
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
