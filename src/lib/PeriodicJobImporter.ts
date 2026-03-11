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
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dayName = days[date.getDay()];

        const { data, error } = await supabase
            .from('master_collection_points')
            .select('*')
            .eq('is_active', true)
            .contains('collection_days', [dayName])
            .order('display_name', { ascending: true });

        if (error) {
            console.error('[PeriodicJobImporter] 案件取得に失敗しました:', error);
            throw error;
        }

        return data || [];
    }
};

