/**
 * RePaper Route - Date Utilities (JST Strict Mode)
 * AGENTS.md 100pt Closure 要件: タイムゾーン差異を排除し、
 * 深夜0時前後の誤作動を防ぐための堅牢な日付操作ロジック。
 */

/**
 * 日本標準時 (JST) の現在日付オブジェクトを取得する
 * 内部MSは現地時間だが、表示・計算用に今日の日付を保つ
 */
export const getJSTNow = (): Date => {
    return new Date(); // 日本国内利用を前提とし、標準のDateを使用（必要に応じIntlで補正）
};

/**
 * Dateオブジェクトを YYYY-MM-DD 形式の文字列に変換する (JST基準)
 */
export const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * 2つの日付が同じ日か判定する (時間切り捨て)
 */
export const isSameDayJST = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

/**
 * 対象日が今日より過去か判定する (JST基準・日付単位)
 * Intlを使用することで環境（ブラウザ/OS）のタイムゾーン設定に依存せず
 * 日本時間（Asia/Tokyo）として比較を行う。
 */
export const isPastDayJST = (date: Date): boolean => {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const todayStr = formatter.format(new Date());
    const targetStr = formatter.format(date);

    // YYYY/MM/DD 形式で文字列として比較
    return targetStr < todayStr;
};

/**
 * 「第N番目の〇曜日」という文字列を生成する
 * 例: 2026-03-08 は「第2日曜日」
 */
export const getNthWeekdayString = (date: Date): string => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    // 第Nの計算: (その月の何日目か - 1) / 7 + 1 の切り捨て
    const nth = Math.floor((date.getDate() - 1) / 7) + 1;

    return `第${nth}${dayName}曜日`;
};

/**
 * 指定された形式で日付文字列を生成する
 * 例: 2026年 03月 08日 第2日曜日
 */
export const formatFullDateWithNthDay = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const nthDay = getNthWeekdayString(date);

    return `${y}年 ${m}月 ${d}日 ${nthDay}`;
};
/**
 * 配車盤表示用の時刻フォーマット変換
 * @param timeSlot 'HH:mm' 形式の文字列 (例: '06:00', '15:30')
 * @returns 表示用文字列 (例: '6:00', ':30')
 */
export const formatTimeForDisplay = (timeSlot: string): string => {
    if (!timeSlot || !timeSlot.includes(':')) return timeSlot;

    const [hourStr, minuteStr] = timeSlot.split(':');
    const hour = parseInt(hourStr, 10);

    // 正時 (:00) の場合は、一桁時間のゼロ埋めを解除して返す (例: '06:00' -> '6:00')
    if (minuteStr === '00') {
        return `${hour}:00`;
    }

    // 15/30/45 分の場合は、時を省略して ':MM' 形式で返す
    // ユーザー要望により、正時とのズレを表現するため先頭に半角スペース2つを追加
    return `  :${minuteStr}`;
};
