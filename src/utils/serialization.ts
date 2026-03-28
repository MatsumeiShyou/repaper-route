import { MasterField } from '../types/master';

/**
 * マスタデータの保存用形式への変換
 */
export function serializeMasterData<T extends Record<string, any>>(
    formData: Partial<T>,
    fields: MasterField[],
    _rpcTableName: string
): any {
    const serialized: any = {};

    fields.forEach(field => {
        const value = formData[field.name as keyof T];
        if (value === undefined) return;

        // 型に応じた変換
        if (field.type === 'number') {
            serialized[field.name] = value === '' ? null : Number(value);
        } else if (value === '') {
            // 空文字はそのまま送り、DB側のデフォルト値やRPC内部の正規化ロジックに委ねる
            serialized[field.name] = '';
        } else if (field.type === 'switch' || field.type === 'boolean') {
            serialized[field.name] = !!value;
        } else if (field.type === 'days' || Array.isArray(value)) {
            // UI形式: ["Mon", "Wed"]
            // DB形式: { mon: true, tue: false, wed: true, ... }
            if (Array.isArray(value)) {
                const dayMap: Record<string, string> = {
                    Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun',
                    Hol: 'hol', Oth: 'oth'
                };
                const obj: Record<string, boolean> = {};
                
                // 固定曜日の初期化（false)
                Object.values(dayMap).forEach(key => {
                    obj[key] = false;
                });

                // 選択された曜日の反映
                value.forEach((uiKey: string) => {
                    const dbKey = dayMap[uiKey];
                    if (dbKey) {
                        obj[dbKey] = true;
                    } else if (/^[A-Z][a-z]{2}[1-5]$/.test(uiKey)) {
                        // 第N曜日 (Mon1 -> mon1)
                        const lowerKey = uiKey.charAt(0).toLowerCase() + uiKey.slice(1);
                        obj[lowerKey] = true;
                    }
                });
                serialized[field.name] = obj;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                // すでにオブジェクト形式（DB形式）の場合はそのまま通す
                serialized[field.name] = value;
            } else {
                serialized[field.name] = value;
            }
        } else {
            serialized[field.name] = value;
        }
    });

    return serialized;
}

/**
 * 曜日配列の正規化（MasterDataLayout.tsx で使用されている形式に変換）
 * DB形式: { mon: true, tue: false, ... }
 * UI形式: ["Mon", "Tue", ...]
 */
export function normalizeDays(days: any): string[] {
    if (!days) return [];

    // DBからのオブジェクト形式 ({ mon: true, ... }) を配列形式に変換
    if (typeof days === 'object' && !Array.isArray(days)) {
        const dayMap: Record<string, string> = {
            mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
            hol: 'Hol', oth: 'Oth'
        };
        const activeDays: string[] = [];

        // 固定曜日
        Object.entries(dayMap).forEach(([dbKey, uiKey]) => {
            if ((days as any)[dbKey] === true) {
                activeDays.push(uiKey);
            }
        });

        // 第N曜日 (Mon1, Mon2 等)
        Object.entries(days).forEach(([key, value]) => {
            if (value === true && /^[a-z]{3}[1-5]$/.test(key)) {
                // キーの頭文字を大文字にする (mon1 -> Mon1)
                const uiKey = key.charAt(0).toUpperCase() + key.slice(1);
                activeDays.push(uiKey);
            }
        });

        return activeDays;
    }

    if (Array.isArray(days)) return days.map(String).filter(s => s !== 'undefined' && s !== 'null');
    if (typeof days === 'string' && days.trim() !== '') return days.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}
/**
 * 送信前のデータから廃止された不純物フィールド（is_spot等）を再帰的に全削除する
 * [Ref: Sanctuary Governance Constitution Section B-4 F-SSOT]
 */
export function cleansePurgedFields<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;

    const purgedKeys = [
        'is_spot', 'is_spot_only', 'special_type', 
        'time_constraint_type', 'is_template', 'applied_template_id'
    ];

    if (Array.isArray(data)) {
        return data.map(item => cleansePurgedFields(item)) as any;
    }

    const cleansed = { ...data } as any;
    Object.keys(cleansed).forEach(key => {
        if (purgedKeys.includes(key)) {
            delete cleansed[key];
        } else if (typeof cleansed[key] === 'object') {
            cleansed[key] = cleansePurgedFields(cleansed[key]);
        }
    });

    return cleansed;
}
