/**
 * 汎用ソート設定�E垁E */
export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc' | null;
}

/**
 * 汎用ソート関数 (Universal Sort)
 * 数値、文字�E�E�日本語）、真偽値を柔軟に扱ぁE */
export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {
    const valA = a[key];
    const valB = b[key];

    // 両方ぁEnull/undefined の場合�E等価
    if (valA == null && valB == null) return 0;
    // 牁E��ぁEnull/undefined の場合�E、�E頁E�E降頁E��関わらず常に末尾に表示する�E�利便性のため�E�E    if (valA == null) return 1;
    if (valB == null) return -1;

    let comparison = 0;

    if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
    } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : valA ? -1 : 1;
    } else if (isValidDate(valA) && isValidDate(valB)) {
        comparison = new Date(valA).getTime() - new Date(valB).getTime();
    } else {
        // 斁E���E比輁E 日本誁E0音頁E��数値の自然頁E��E < 2 < 10�E�を老E�E
        comparison = String(valA).localeCompare(String(valB), 'ja', {
            numeric: true,
            sensitivity: 'base',
        });
    }

    return direction === 'asc' ? comparison : -comparison;
};

/**
 * 簡易的な日付妥当性チェチE��
 */
function isValidDate(val: any): boolean {
    if (typeof val !== 'string') return false;
    // ISO 8601 形式などの基本皁E��チェチE��
    const date = new Date(val);
    return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
}
