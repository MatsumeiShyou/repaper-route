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
        const { data, error } = await supabase
            .from('master_collection_points')
            .select('*')
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            console.error('[PeriodicJobImporter] 案件取得に失敗しました:', error);
            throw error;
        }

        const dayMap: Record<number, string> = {
            0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
        };
        const dayIdx = date.getDay();
        const dayKey = dayMap[dayIdx]; // e.g., 'mon'
        
        // Import TemplateManager for Nth week logic consistency
        const { TemplateManager } = await import('../features/logic/core/TemplateManager');
        const nth = TemplateManager.getNthWeek(date);

        return (data || []).filter(p => {
            // 1. Day of Week Check (Handle both Object and Array structures)
            const collectionDays = p.collection_days as any;
            if (!collectionDays) return false; // [Fix] collection_days が null の場合は除外

            let isDayMatch = false;

            if (Array.isArray(collectionDays)) {
                // Handle Array case: ["Mon", "Tue"] or ["mon", "tue"]
                isDayMatch = collectionDays.some(d => 
                    typeof d === 'string' && d.toLowerCase().startsWith(dayKey)
                );
            } else if (typeof collectionDays === 'object') {
                // Handle Object case: { mon: true, tue: false }
                isDayMatch = !!collectionDays[dayKey];
            }

            if (!isDayMatch) return false;

            // 2. Recurrence Pattern Check (Nth week)
            // e.g., p.recurrence_pattern might be "3" or "第3月曜日"
            if (p.recurrence_pattern) {
                // [Fix] 数字以外の文字（"第" や "月曜日"）が含まれていても数値を抽出できるように修正
                const match = p.recurrence_pattern.match(/\d+/);
                const patternNth = match ? parseInt(match[0], 10) : NaN;
                
                if (!isNaN(patternNth) && patternNth !== nth) {
                    return false;
                }
            }

            return true;
        });
    }
};

