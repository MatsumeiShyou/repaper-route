import { describe, it, expect } from 'vitest';
import { getHolidayInfo } from './holidayUtils';

describe('holidayUtils', () => {
    it('should identify 元日', () => { expect(getHolidayInfo(new Date(2026, 0, 1))?.name).toBe('元日'); });
    it('should identify 建国記念の日', () => { expect(getHolidayInfo(new Date(2026, 1, 11))?.name).toBe('建国記念の日'); });
    it('should identify 天皇誕生日', () => { expect(getHolidayInfo(new Date(2026, 1, 23))?.name).toBe('天皇誕生日'); });

    it('should identify 成人の日', () => { expect(getHolidayInfo(new Date(2026, 0, 12))?.name).toBe('成人の日'); });
    it('should identify 海の日', () => { expect(getHolidayInfo(new Date(2026, 6, 20))?.name).toBe('海の日'); });
    it('should identify 敬老の日', () => { expect(getHolidayInfo(new Date(2026, 8, 21))?.name).toBe('敬老の日'); });

    it('should identify 春分の日', () => { expect(getHolidayInfo(new Date(2026, 2, 20))?.name).toBe('春分の日'); });
    it('should identify 秋分の日', () => { expect(getHolidayInfo(new Date(2026, 8, 23))?.name).toBe('秋分の日'); });

    it('should identify 憲法記念日', () => { expect(getHolidayInfo(new Date(2026, 4, 3))?.name).toBe('憲法記念日'); });
    it('should identify みどりの日', () => { expect(getHolidayInfo(new Date(2026, 4, 4))?.name).toBe('みどりの日'); });
    it('should identify こどもの日', () => { expect(getHolidayInfo(new Date(2026, 4, 5))?.name).toBe('こどもの日'); });
    it('should identify 振替休日 2026-05-06', () => { expect(getHolidayInfo(new Date(2026, 4, 6))?.name).toBe('振替休日'); });

    it('should return null for normal day 2026-03-19', () => { expect(getHolidayInfo(new Date(2026, 2, 19))).toBeNull(); });
    it('should return null for normal day 2026-01-02', () => { expect(getHolidayInfo(new Date(2026, 0, 2))).toBeNull(); });

    it('should identify custom holidays', () => {
        const custom = [{ month: 3, day: 8, name: '創立記念日' }];
        expect(getHolidayInfo(new Date(2026, 2, 8), custom)?.name).toBe('創立記念日');
    });
});
