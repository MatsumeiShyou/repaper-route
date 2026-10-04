import { describe, it, expect } from 'vitest';
import { getHolidayInfo } from './holidayUtils';

describe('holidayUtils', () => {
    it('should identify 蜈・律', () => { expect(getHolidayInfo(new Date(2026, 0, 1))?.name).toBe('蜈・律'); });
    it('should identify 蟒ｺ蝗ｽ險伜ｿｵ縺ｮ譌･', () => { expect(getHolidayInfo(new Date(2026, 1, 11))?.name).toBe('蟒ｺ蝗ｽ險伜ｿｵ縺ｮ譌･'); });
    it('should identify 螟ｩ逧・ｪ慕函譌･', () => { expect(getHolidayInfo(new Date(2026, 1, 23))?.name).toBe('螟ｩ逧・ｪ慕函譌･'); });

    it('should identify 謌蝉ｺｺ縺ｮ譌･', () => { expect(getHolidayInfo(new Date(2026, 0, 12))?.name).toBe('謌蝉ｺｺ縺ｮ譌･'); });
    it('should identify 豬ｷ縺ｮ譌･', () => { expect(getHolidayInfo(new Date(2026, 6, 20))?.name).toBe('豬ｷ縺ｮ譌･'); });
    it('should identify 謨ｬ閠√・譌･', () => { expect(getHolidayInfo(new Date(2026, 8, 21))?.name).toBe('謨ｬ閠√・譌･'); });

    it('should identify 譏･蛻・・譌･', () => { expect(getHolidayInfo(new Date(2026, 2, 20))?.name).toBe('譏･蛻・・譌･'); });
    it('should identify 遘句・縺ｮ譌･', () => { expect(getHolidayInfo(new Date(2026, 8, 23))?.name).toBe('遘句・縺ｮ譌･'); });

    it('should identify 諞ｲ豕戊ｨ伜ｿｵ譌･', () => { expect(getHolidayInfo(new Date(2026, 4, 3))?.name).toBe('諞ｲ豕戊ｨ伜ｿｵ譌･'); });
    it('should identify 縺ｿ縺ｩ繧翫・譌･', () => { expect(getHolidayInfo(new Date(2026, 4, 4))?.name).toBe('縺ｿ縺ｩ繧翫・譌･'); });
    it('should identify 縺薙←繧ゅ・譌･', () => { expect(getHolidayInfo(new Date(2026, 4, 5))?.name).toBe('縺薙←繧ゅ・譌･'); });
    it('should identify 謖ｯ譖ｿ莨第律 2026-05-06', () => { expect(getHolidayInfo(new Date(2026, 4, 6))?.name).toBe('謖ｯ譖ｿ莨第律'); });

    it('should return null for normal day 2026-03-19', () => { expect(getHolidayInfo(new Date(2026, 2, 19))).toBeNull(); });
    it('should return null for normal day 2026-01-02', () => { expect(getHolidayInfo(new Date(2026, 0, 2))).toBeNull(); });

    it('should identify custom holidays', () => {
        const custom = [{ month: 3, day: 8, name: '蜑ｵ遶玖ｨ伜ｿｵ譌･' }];
        expect(getHolidayInfo(new Date(2026, 2, 8), custom)?.name).toBe('蜑ｵ遶玖ｨ伜ｿｵ譌･');
    });
});
