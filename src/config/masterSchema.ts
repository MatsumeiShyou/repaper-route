/**
 * マスタデータ定義の型
 */

export interface MasterColumn {
    key: string;
    label: string;
    type: 'text' | 'badge' | 'number' | 'status' | 'multi-row';
    subLabelKey?: string;
    className?: string;
    styleRules?: Record<string, string>;
}

export interface MasterField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    className?: string;
}

export interface MasterSchema {
    title: string;
    description: string;
    viewName: string;
    rpcTableName: string;
    primaryKey: string;
    searchFields: string[];
    columns: MasterColumn[];
    fields: MasterField[];
}

export interface MasterSchemas {
    [key: string]: MasterSchema;
}

export const MASTER_SCHEMAS: MasterSchemas = {
    drivers: {
        title: 'ドライバー管理',
        description: '乗務員の基本連絡先と稼働状態の設定',
        viewName: 'profiles',
        rpcTableName: 'drivers',
        primaryKey: 'id',
        searchFields: ['name', 'mobile_phone'],
        columns: [
            { key: 'name', subLabelKey: 'mobile_phone', label: '氏名 / 電話番号', type: 'multi-row', className: 'font-bold' },
            { key: 'is_active', label: '有効 / 無効', type: 'status' }
        ],
        fields: [
            { name: 'name', label: '氏名', type: 'text', required: true },
            { name: 'mobile_phone', label: '電話番号', type: 'tel' }
        ]
    },
    vehicles: {
        title: '車両管理',
        description: '配車対象車両の登録と設定',
        viewName: 'vehicles',
        rpcTableName: 'vehicles',
        searchFields: ['number', 'callsign', 'vehicle_type'],
        columns: [
            { key: 'number', subLabelKey: 'callsign', label: '車両番号 / 通称', type: 'multi-row', className: 'font-bold text-blue-600' },
            {
                key: 'vehicle_type',
                label: '車種',
                type: 'badge',
                styleRules: {
                    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                    '4t': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
                    '待機': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }
            },

            { key: 'display_order', label: '表示順', type: 'number' }
        ],
        fields: [
            { name: 'number', label: '車両番号', type: 'text', required: true },
            { name: 'callsign', label: '通称', type: 'text' },
            { name: 'vehicle_type', label: '車種', type: 'text', required: true },
            { name: 'display_order', label: '表示順', type: 'number' }
        ]
    },
    items: {
        title: '品目管理',
        description: '回収品目と単位の設定',
        viewName: 'master_items',
        rpcTableName: 'items',
        primaryKey: 'id',
        searchFields: ['name', 'unit'],
        columns: [
            { key: 'name', subLabelKey: 'unit', label: '品目名 / 単位', type: 'multi-row', className: 'font-bold' },
        ],
        fields: [
            { name: 'name', label: '品目名', type: 'text', required: true, placeholder: '例: 段ボール' },
            { name: 'unit', label: '単位', type: 'text', required: true, placeholder: 'kg' }
        ]
    },
    points: {
        title: '回収先管理',
        description: '現場制約（車両制限/時間）および巡回ルート設定',
        viewName: 'view_master_points',
        rpcTableName: 'master_collection_points',
        primaryKey: 'id',
        searchFields: ['display_name', 'address', 'contractor_name', 'default_route_code'],
        columns: [
            {
                key: 'display_name',
                subLabelKey: 'contractor_name',
                label: '地点名 / 排出元',
                type: 'multi-row',
                className: 'font-bold'
            },
            {
                key: 'visit_slot',
                label: '便区分',
                type: 'badge',
                styleRules: {
                    default: 'bg-slate-100 text-slate-800',
                    'AM': 'bg-blue-100 text-blue-800 border border-blue-200',
                    'PM': 'bg-orange-100 text-orange-800 border border-orange-200',
                    'FREE': 'bg-emerald-100 text-emerald-800'
                }
            },
            {
                key: 'visit_slot',
                label: '便区分',
                type: 'badge',
                styleRules: {
                    default: 'bg-slate-100 text-slate-800',
                    'AM': 'bg-blue-100 text-blue-800 border border-blue-200',
                    'PM': 'bg-orange-100 text-orange-800 border border-orange-200',
                    'FREE': 'bg-emerald-100 text-emerald-800'
                }
            },
            { key: 'address', label: '住所', type: 'text', className: 'text-[10px] text-slate-500 max-w-[150px] truncate' },
            { key: 'is_active', label: '有効 / 無効', type: 'status' }
        ],
        fields: [
            { name: 'display_name', label: '地点名（表示用）', type: 'text', required: true, placeholder: '例: ○○スーパー(AM)' },
            { name: 'contractor_id', label: '契約主体ID', type: 'text', required: true },
            {
                name: 'visit_slot',
                label: '便区分（スロット）',
                type: 'select',
                options: ['AM', 'PM', 'FREE'],
                className: 'col-span-1'
            },
            {
                name: 'vehicle_restriction_type',
                label: '車両制約タイプ',
                type: 'select',
                options: ['NONE', 'FIXED', 'FIXED_UNTIL_RETURN'],
                className: 'col-span-1'
            },
            { name: 'restricted_vehicle_id', label: '制限対象車両ID', type: 'text', placeholder: '車両ID（UUID）' },
            { name: 'target_item_category', label: '主要回収品目', type: 'tags', className: 'col-span-2', placeholder: '品目を選択...' },
            { name: 'address', label: '住所', type: 'text', className: 'col-span-2' },
            { name: 'site_contact_phone', label: '現場直通電話', type: 'tel' },
            { name: 'average_weight', label: '平均回収重量(kg)', type: 'number' },
            {
                name: 'note',
                label: '備考',
                type: 'text',
                className: 'col-span-2',
                placeholder: '例: 裏口から入場。天井低い。'
            }
        ]
    }
};
