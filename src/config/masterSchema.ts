import { Database } from '../types/database.types';

export type PublicSchema = Database['public'];
export type ViewName = keyof PublicSchema['Views'] | keyof PublicSchema['Tables'];
export type TableName = keyof PublicSchema['Tables'];

/**
 * マスタデータ定義の型
 */

export interface MasterColumn {
    key: string;
    label: string;
    type: 'text' | 'badge' | 'number' | 'status' | 'multi-row' | 'tags' | 'select' | 'days';
    subLabelKey?: string;
    thirdLabelKey?: string;
    className?: string;
    styleRules?: Record<string, string>;
    sortable?: boolean;
    sortKey?: string;
    sortOptions?: { key: string; label: string }[];
    optionLabels?: Record<string, string>; // [Localization] 表示用の日本語ラベルマッピング
}

export interface MasterField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    requiredForCreate?: boolean; // 新規作成時のみ必須
    updatable?: boolean;        // 更新可能か（false の場合は更新時に送信しない/無効化）
    placeholder?: string;
    options?: string[];
    optionLabels?: Record<string, string>; // [Localization] セレクトボックス等の表示用ラベル
    className?: string;
    lookup?: {
        schemaKey: string; // MASTER_SCHEMAS のキー
        labelKey: string;  // 表示に使用するカラム
        valueKey: string;  // 実際の値に使用するカラム
    };
}

export interface MasterSchema {
    title: string;
    description: string;
    viewName: ViewName;
    rpcTableName: TableName;
    primaryKey: string;
    searchFields: string[];
    columns: MasterColumn[];
    fields: MasterField[];
}

export interface MasterSchemas {
    [key: string]: MasterSchema;
}

export const MASTER_SCHEMAS: MasterSchemas = {
    contractors: {
        title: '契約主体管理',
        description: '排出元（顧客）の契約主体および支払元の設定',
        viewName: 'master_contractors',
        rpcTableName: 'master_contractors',
        primaryKey: 'contractor_id',
        searchFields: ['name', 'furigana'],
        columns: [
            { key: 'name', label: '契約主体名', type: 'text', className: 'font-bold', sortable: true, sortKey: 'furigana' },
            { key: 'payee_id', label: '支払元ID', type: 'text', className: 'text-xs text-slate-500 font-mono', sortable: true },
            { key: 'is_active', label: '有効状態', type: 'status', sortable: true }
        ],
        fields: [
            { name: 'contractor_id', label: '契約主体ID', type: 'text', requiredForCreate: true, updatable: false },
            { name: 'name', label: '契約主体名', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true, placeholder: '例: ﾏﾙﾏﾙ / ABC' },
            { name: 'payee_id', label: '支払元ID', type: 'text', updatable: true },
            { name: 'note', label: '備考', type: 'text', updatable: true, placeholder: '特記事項...' },
            { name: 'is_active', label: '有効状態', type: 'status', updatable: true }
        ]
    },
    drivers: {
        title: 'ドライバー管理',
        description: '乗務員の基本連絡先と稼働状態の設定',
        viewName: 'drivers',
        rpcTableName: 'drivers',
        primaryKey: 'id',
        searchFields: ['driver_name', 'furigana'],
        columns: [
            { key: 'driver_name', subLabelKey: 'route_name', label: '氏名 / コース', type: 'text', className: 'font-bold', sortable: true, sortKey: 'furigana' },
            { key: 'vehicle_number', label: '担当車両', type: 'badge', sortable: true },
            { key: 'display_color', label: '表示色', type: 'text', className: 'text-xs font-mono uppercase', sortable: true },
            { key: 'display_order', label: '表示順', type: 'number', sortable: true },
            { key: 'is_active', label: '有効状態', type: 'status', sortable: true }
        ],
        fields: [
            { name: 'driver_name', label: '氏名', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true, placeholder: '例: ﾃｽﾄﾀﾛｳ / TEST' },
            { name: 'route_name', label: '既定コース名', type: 'text', updatable: true, placeholder: '例: Aコース' },
            { name: 'vehicle_number', label: '担当車両', type: 'text', updatable: true, placeholder: '例: 品川100あ1234' },
            { name: 'display_color', label: '表示色 (Hex)', type: 'text', updatable: true, placeholder: '#FFFFFF' },
            { name: 'display_order', label: '表示順', type: 'number', updatable: true },
            { name: 'note', label: '備考', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    vehicles: {
        title: '車両管理',
        description: '配車対象車両の登録と設定',
        viewName: 'vehicles',
        rpcTableName: 'master_vehicles',
        primaryKey: 'id',
        searchFields: ['number', 'callsign', 'vehicle_type', 'furigana'],
        columns: [
            { key: 'number', subLabelKey: 'callsign', label: '車両番号 / 通称', type: 'multi-row', className: 'font-bold text-blue-600', sortable: true, sortKey: 'furigana' },
            {
                key: 'vehicle_type',
                label: '車種',
                type: 'badge',
                sortable: true,
                styleRules: {
                    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                    '4t': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
                    '待機': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }
            },
            { key: 'callsign', label: '通称', type: 'text', className: 'text-xs text-slate-500', sortable: true },
            { key: 'is_active', label: '有効状態', type: 'status', sortable: true }
        ],
        fields: [
            { name: 'number', label: '車両番号', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true, placeholder: '例: ｼﾅｶﾞﾜ / ABC' },
            { name: 'callsign', label: '通称', type: 'text', updatable: true },
            { name: 'vehicle_type', label: '車種', type: 'text', required: true, updatable: true },
            { name: 'note', label: '備考', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    items: {
        title: '品目管理',
        description: '回収品目と単位の設定',
        viewName: 'master_items',
        rpcTableName: 'items',
        primaryKey: 'id',
        searchFields: ['name', 'unit', 'furigana'],
        columns: [
            { key: 'name', label: '品目名', type: 'text', className: 'font-bold', sortable: true, sortKey: 'furigana' },
            { key: 'unit', label: '単位', type: 'badge', sortable: true },
            { key: 'display_order', label: '表示順', type: 'number', sortable: true },
            { key: 'is_active', label: '有効状態', type: 'status', sortable: true }
        ],
        fields: [
            { name: 'name', label: '品目名', type: 'text', required: true, updatable: true, placeholder: '例: 段ボール' },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true, placeholder: '例: ﾀﾞﾝﾎﾞｰﾙ / TEST' },
            { name: 'unit', label: '単位', type: 'text', required: true, updatable: true, placeholder: 'kg' },
            { name: 'display_order', label: '表示順', type: 'number', updatable: true },
            { name: 'note', label: '備考', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    points: {
        title: '回収先管理',
        description: '現場制約（車両制限/時間）および巡回ルート設定',
        viewName: 'view_master_points',
        rpcTableName: 'master_collection_points',
        primaryKey: 'id',
        searchFields: ['display_name', 'address', 'contractor_name', 'default_route_code', 'area', 'furigana'],
        columns: [
            {
                key: 'location_id',
                label: 'No.',
                type: 'text',
                sortable: true,
                className: 'text-xs text-slate-400 font-mono w-12'
            },
            {
                key: 'display_name',
                subLabelKey: 'furigana', // ふりがなを表示
                thirdLabelKey: 'address',
                label: '拠点/フリガナ/住所',
                type: 'multi-row',
                sortable: true,
                sortOptions: [
                    { key: 'furigana', label: 'あ' },
                    { key: 'address', label: '住' }
                ],
                className: 'font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[280px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]'
            },
            {
                key: 'area', // 地域を独立カラムに変更
                label: '地域',
                type: 'text',
                sortable: true,
                className: 'text-xs text-slate-500'
            },
            {
                key: 'collection_days',
                label: '曜',
                type: 'days'
            },
            {
                key: 'visit_slot',
                label: '便区分',
                type: 'badge',
                sortable: true,
                styleRules: {
                    default: 'bg-slate-100 text-slate-800',
                    'AM': 'bg-blue-100 text-blue-800 border border-blue-200',
                    'PM': 'bg-orange-100 text-orange-800 border border-orange-200',
                    'FREE': 'bg-emerald-100 text-emerald-800'
                },
                optionLabels: {
                    'FREE': 'フリー便',
                    'AM': 'AM便',
                    'PM': 'PM便'
                }
            },
            {
                key: 'vehicle_restriction_type',
                label: '車両制限',
                type: 'badge',
                sortable: true,
                styleRules: {
                    default: 'bg-slate-50 text-slate-400',
                    'FIXED': 'bg-red-600 text-white font-black px-3 py-1 animate-pulse',
                    'FIXED_UNTIL_RETURN': 'bg-purple-600 text-white font-black px-3 py-1'
                },
                optionLabels: {
                    'NONE': 'なし',
                    'FIXED': '車両固定',
                    'FIXED_UNTIL_RETURN': '車両固定（帰着まで）'
                }
            },
            {
                key: 'contractor_name',
                label: '仕入先',
                type: 'text',
                sortable: true,
                className: 'text-xs text-slate-600'
            },
            {
                key: 'company_phone',
                label: '会社電話番号',
                type: 'text',
                sortable: true,
                className: 'text-xs font-mono'
            },
            {
                key: 'manager_phone',
                label: '担当者電話番号',
                type: 'text',
                sortable: true,
                className: 'text-xs font-mono'
            },

            {
                key: 'recurrence_pattern',
                label: '回収契機 (曜以外)',
                type: 'text',
                className: 'text-xs text-slate-500'
            },
            {
                key: 'target_item_category',
                label: '主要回収品目',
                type: 'tags'
            },
            {
                key: 'weighing_site_id',
                label: '計量所',
                type: 'text',
                sortable: true,
                className: 'text-[10px] text-emerald-600 font-mono'
            },

            {
                key: 'is_spot_only',
                label: '種別',
                type: 'badge',
                sortable: true,
                styleRules: {
                    default: 'bg-slate-50 text-slate-400',
                    'true': 'bg-amber-100 text-amber-900 border-2 border-amber-500 font-black shadow-sm',
                    'false': 'bg-slate-100 text-slate-500'
                }
            },
            {
                key: 'site_contact_phone',
                label: '現場直通電話',
                type: 'text',
                sortable: true,
                className: 'text-xs font-mono'
            },
            {
                key: 'internal_note',
                label: '備考',
                type: 'text',
                className: 'text-xs text-slate-500 truncate max-w-[150px]'
            },
            { key: 'is_active', label: '有効状態', type: 'status', sortable: true }
        ],
        fields: [
            { name: 'id', label: 'UUID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'location_id', label: '管理番号', type: 'text', updatable: true, placeholder: '例: 28' },
            { name: 'display_name', label: '拠点名（表示用）', type: 'text', required: true, placeholder: '例: ○○スーパー(AM)' },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ（半角ｶﾅ）', type: 'text', placeholder: '例: ﾏﾙﾏﾙｽｰﾊﾟｰ' },
            { name: 'area', label: '地域', type: 'text', placeholder: '例: 中央区, 六本木' },
            {
                name: 'contractor_id',
                label: '仕入先 (契約主体)',
                type: 'select',
                lookup: {
                    schemaKey: 'contractors',
                    labelKey: 'name',
                    valueKey: 'contractor_id'
                }
            },
            { name: 'company_phone', label: '会社電話番号', type: 'text', placeholder: '例: 03-1234-5678' },
            { name: 'manager_phone', label: '担当者電話番号', type: 'text', placeholder: '例: 090-1234-5678' },
            { name: 'address', label: '住所', type: 'text', placeholder: '東京都...' },
            { name: 'weighing_site_id', label: '計量所', type: 'text', placeholder: 'K001' },
            {
                name: 'visit_slot',
                label: '便区分',
                type: 'select',
                options: ['FREE', 'AM', 'PM'],
                optionLabels: {
                    'FREE': 'フリー便',
                    'AM': 'AM便',
                    'PM': 'PM便'
                }
            },

            { name: 'recurrence_pattern', label: '回収契機 (曜以外)', type: 'text', placeholder: '例: 第1月曜日' },
            {
                name: 'vehicle_restriction_type',
                label: '車両制限',
                type: 'select',
                options: ['NONE', 'FIXED', 'FIXED_UNTIL_RETURN'],
                optionLabels: {
                    'NONE': 'なし',
                    'FIXED': '車両固定',
                    'FIXED_UNTIL_RETURN': '車両固定（帰着まで）'
                },
                className: 'col-span-1'
            },
            {
                name: 'restricted_vehicle_id',
                label: '制限対象車両',
                type: 'select',
                lookup: {
                    schemaKey: 'vehicles',
                    labelKey: 'callsign',
                    valueKey: 'id'
                }
            },
            { name: 'collection_days', label: '回収曜日', type: 'days', className: 'col-span-2' },
            { name: 'target_item_category', label: '主要回収品目', type: 'tags', className: 'col-span-2', placeholder: '品目を選択...' },
            { name: 'site_contact_phone', label: '現場直通電話', type: 'tel' },
            {
                name: 'note',
                label: '備考',
                type: 'text',
                className: 'col-span-2',
                placeholder: '例: 裏口から入場。天井低い。'
            },

            {
                name: 'is_spot_only',
                label: '種別 (スポット)',
                type: 'switch',
                className: 'col-span-1'
            },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    }
};
