import { supabase } from './supabase/client';
import { Database } from '../types/database.types';

type MasterPoint = Database['public']['Tables']['master_collection_points']['Row'];

/**
 * PeriodicJobImporter
 * マスタ設定！Easter_collection_points�E�から特定�E日付に該当する定期案件を抽出する、E */
export const PeriodicJobImporter = {
    /**
     * 持E��された日付�E曜日に基づぁE��定期案件を取得すめE     * @param date ターゲチE��の日仁E     * @returns 該当する�Eスタ案件の配�E
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
            if (!collectionDays) return false; // [Fix] collection_days ぁEnull の場合�E除夁E
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
                // [Fix] 数字以外�E斁E��！E第" めE"月曜日"�E�が含まれてぁE��も数値を抽出できるように修正
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

