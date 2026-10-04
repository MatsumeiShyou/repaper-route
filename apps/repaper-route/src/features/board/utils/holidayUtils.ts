/**
 * RePaper Route - Holiday Utilities
 * AGENTS.md 100pt Version: 決定論的ロジチE��による祝日判定と封E��の拡張性、E */

export interface HolidayInfo {
    name: string;
    isHoliday: boolean;
}

/**
 * 独自休日の定義用インターフェース
 * 封E��の拡張�E�EB連携等）を見据えた構造、E */
export interface CustomHolidayDef {
    month: number;
    day: number;
    name: string;
}

/**
 * 祝日の基本惁E��を判定すめE(振替休日・国民�E休日を除ぁE
 */
const getCoreHolidayName = (date: Date, customHolidays: CustomHolidayDef[] = []): string | null => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // 1. 独自休日
    const custom = customHolidays.find(h => h.month === month && h.day === day);
    if (custom) return custom.name;

    // 2. 固定祝日
    const fixedHolidays: Record<string, string> = {
        '1-1': '允E��', '2-11': '建国記念の日', '2-23': '天皁E��生日',
        '4-29': '昭和�E日', '5-3': '憲法記念日', '5-4': 'みどり�E日', '5-5': 'こども�E日',
        '8-11': '山の日', '11-3': '斁E��の日', '11-23': '勤労感謝�E日',
    };
    if (fixedHolidays[`${month}-${day}`]) return fixedHolidays[`${month}-${day}`];

    // 3. ハッピ�EマンチE�E
    const nthMonday = Math.floor((day - 1) / 7) + 1;
    if (dayOfWeek === 1) {
        if (month === 1 && nthMonday === 2) return '成人の日';
        if (month === 7 && nthMonday === 3) return '海の日';
        if (month === 9 && nthMonday === 3) return '敬老�E日';
        if (month === 10 && nthMonday === 2) return 'スポ�EチE�E日';
    }

    // 4. 春刁E�E秋�E
    if (month === 3) {
        const shunbun = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
        if (day === shunbun) return '春刁E�E日';
    }
    if (month === 9) {
        const shubun = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
        if (day === shubun) return '秋�Eの日';
    }

    return null;
};

/**
 * 持E��された日付が日本の祝日�E�また�E独自休日�E�か判定すめE(振替休日・国民�E休日を含む)
 */
export const getHolidayInfo = (date: Date, customHolidays: CustomHolidayDef[] = []): HolidayInfo | null => {
    const name = getCoreHolidayName(date, customHolidays);
    if (name) return { name, isHoliday: true };

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // 5. 振替休日
    if (dayOfWeek === 1) {
        const yesterday = new Date(year, month - 1, day - 1);
        if (getCoreHolidayName(yesterday, customHolidays) && yesterday.getDay() === 0) {
            return { name: '振替休日', isHoliday: true };
        }
    }
    // GW特殊ケース
    if (month === 5 && day === 6 && (dayOfWeek >= 1 && dayOfWeek <= 3)) {
        const d3 = new Date(year, 4, 3); const d4 = new Date(year, 4, 4); const d5 = new Date(year, 4, 5);
        if ((getCoreHolidayName(d3, customHolidays) && d3.getDay() === 0) ||
            (getCoreHolidayName(d4, customHolidays) && d4.getDay() === 0) ||
            (getCoreHolidayName(d5, customHolidays) && d5.getDay() === 0)) {
            return { name: '振替休日', isHoliday: true };
        }
    }

    // 6. 国民�E休日
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const tomorrow = new Date(year, month - 1, day + 1);
        const yesterday = new Date(year, month - 1, day - 1);
        if (getCoreHolidayName(tomorrow, customHolidays) && getCoreHolidayName(yesterday, customHolidays)) {
            return { name: '国民�E休日', isHoliday: true };
        }
    }

    return null;
};
