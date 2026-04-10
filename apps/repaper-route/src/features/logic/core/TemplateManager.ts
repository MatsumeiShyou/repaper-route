import { Database } from '../../../types/database.types';

type Template = Database['public']['Tables']['board_templates']['Row'];

/**
 * テンプレートの周期管理・算出ロジック。
 * SDRモデルに基づき、決定論的な計算のみを行う。
 */
export const TemplateManager = {
    /**
     * 指定された日付が「その月の何回目のその曜日か」を返す（1-5）。
     */
    getNthWeek: (date: Date): number => {
        const dayOfMonth = date.getDate();
        return Math.ceil(dayOfMonth / 7);
    },

    /**
     * 指定された日付の曜日指数を返す（0=日, 1=月, ..., 6=土）。
     */
    getDayOfWeek: (date: Date): number => {
        return date.getDay();
    },

    /**
     * 利用可能なテンプレートの中から、日付に最適なものを選択する。
     * 優先順位:
     * 1. 曜日かつ第N回目が一致するもの (nth_week IS NOT NULL)
     * 2. 曜日のみが一致するもの (nth_week IS NULL)
     */
    findBestMatchingTemplate: (templates: Template[], date: Date): Template | null => {
        const dow = TemplateManager.getDayOfWeek(date);
        const nth = TemplateManager.getNthWeek(date);

        // 1. 第N回目まで一致するものを探す
        const specificMatch = templates.find(t =>
            t.is_active &&
            t.day_of_week === dow &&
            t.nth_week === nth
        );
        if (specificMatch) return specificMatch;

        // 2. 毎週（nth_week が NULL）かつ曜日が一致するものを探す
        const generalMatch = templates.find(t =>
            t.is_active &&
            t.day_of_week === dow &&
            t.nth_week === null
        );

        return generalMatch || null;
    }
};
