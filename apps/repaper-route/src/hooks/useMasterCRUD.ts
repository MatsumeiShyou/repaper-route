import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { MasterSchema } from '../config/masterSchema';
import { invalidateMasterCache } from '../features/board/hooks/useMasterData';
import { serializeMasterData } from '../utils/serialization';

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
                .from(schema.viewName as unknown as any) // suppress type error dynamically
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
            // Phase 7-2: 新規作成時バリデーション
            schema.fields.forEach(f => {
                if (f.requiredForCreate && (formData[f.name as keyof T] === undefined || formData[f.name as keyof T] === '')) {
                    throw new Error(`${f.label}は新規作成時に必須です。`);
                }
            });

            // 物理保存用のシリアライズ
            const serialized = serializeMasterData(formData, schema.fields, schema.rpcTableName as string);

            const { error: err } = await (supabase as any)
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: String(formData[schema.primaryKey as keyof T] || ''),
                    p_core_data: serialized,
                    p_ext_data: {},
                    p_decision_type: 'MASTER_CREATE',
                    p_reason: `マスタ登録: ${window.navigator.userAgent}`,
                    p_user_id: (await supabase.auth.getUser()).data.user?.id
                });
            if (err) throw err;
            invalidateMasterCache();
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    const updateItem = async (idValue: string | number, formData: Partial<T>) => {
        try {
            // Phase 7-2: 更新可能項目のみにフィルタリング (防衛的UI) & シリアライズ
            const updatableData: Partial<T> = {};
            schema.fields.forEach(f => {
                if (f.updatable !== false && formData[f.name as keyof T] !== undefined) {
                    updatableData[f.name as keyof T] = formData[f.name as keyof T];
                }
            });

            const serialized = serializeMasterData(updatableData, schema.fields, schema.rpcTableName as string);

            const { error: err } = await (supabase as any)
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: String(idValue),
                    p_core_data: serialized,
                    p_ext_data: {},
                    p_decision_type: 'MASTER_UPDATE',
                    p_reason: `マスタ更新: ${window.navigator.userAgent}`,
                    p_user_id: (await supabase.auth.getUser()).data.user?.id
                });
            if (err) throw err;
            invalidateMasterCache();
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    const deleteItem = async (idValue: string | number) => {
        try {
            const { error: err } = await (supabase as any)
                .rpc('rpc_execute_master_update', {
                    p_table_name: schema.rpcTableName,
                    p_id: String(idValue),
                    p_core_data: { is_active: false },
                    p_ext_data: {},
                    p_decision_type: 'MASTER_ARCHIVE',
                    p_reason: `マスタ削除（アーカイブ）: ${window.navigator.userAgent}`,
                    p_user_id: (await supabase.auth.getUser()).data.user?.id
                });
            if (err) throw err;
            invalidateMasterCache();
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
