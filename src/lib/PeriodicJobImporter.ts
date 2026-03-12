import { supabase } from './supabase/client';
import { Database } from '../types/database.types';

type MasterPoint = Database['public']['Tables']['master_collection_points']['Row'];

/**
 * PeriodicJobImporter
 * マスタ設定（master_collection_points）から特定の日付に該当する定期案件を抽出する。
 */
export const PeriodicJobImporter = {
    /**
     * 指定された日付の曜日に基づいて定期案件を取得する
     * @param date ターゲットの日付
     * @returns 該当するマスタ案件の配列
     */
    fetchPointsByDate: async (date: Date): Promise<MasterPoint[]> => {
        // [修正] 実データ構造 {mon: true, ...} に合わせて英略称を使用

        // JSONB のクエリ構文エラー回避のため、一旦有効な案件を全取得してクライアント側でフィルタリング
        const { data, error } = await supabase
            .from('master_collection_points')
            .select('*')
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            console.error('[PeriodicJobImporter] 案件取得に失敗しました:', error);
            throw error;
        }

        // collection_days が {mon: true, tue: false, ...} という構造であることを考慮してフィルタリング
        const dayMap: Record<number, string> = {
            0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
        };
        const dayKey = dayMap[date.getDay()];

        return (data || []).filter(p => {
            const collectionDays = p.collection_days as any;
            if (collectionDays && typeof collectionDays === 'object') {
                return !!collectionDays[dayKey];
            }
            return false;
        });
    }
};

