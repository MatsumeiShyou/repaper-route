/**
 * 汎用ソート設定の型
 */
export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc' | null;
}

/**
 * 汎用ソート関数 (Universal Sort)
 * 数値、文字列（日本語）、真偽値を柔軟に扱う
 */
export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {
    const valA = a[key];
    const valB = b[key];

    // 両方が null/undefined の場合は等価
    if (valA == null && valB == null) return 0;
    // 片方が null/undefined の場合は、昇順・降順に関わらず常に末尾に表示する（利便性のため）
    if (valA == null) return 1;
    if (valB == null) return -1;

    let comparison = 0;

    if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
    } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : valA ? -1 : 1;
    } else if (isValidDate(valA) && isValidDate(valB)) {
        comparison = new Date(valA).getTime() - new Date(valB).getTime();
    } else {
        // 文字列比較: 日本語50音順、数値の自然順（1 < 2 < 10）を考慮
        comparison = String(valA).localeCompare(String(valB), 'ja', {
            numeric: true,
            sensitivity: 'base',
        });
    }

    return direction === 'asc' ? comparison : -comparison;
};

/**
 * 簡易的な日付妥当性チェック
 */
function isValidDate(val: any): boolean {
    if (typeof val !== 'string') return false;
    // ISO 8601 形式などの基本的なチェック
    const date = new Date(val);
    return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
}
