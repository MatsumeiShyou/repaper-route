import { Database } from '../types/database.types';

type PublicSchema = Database['public'];
type ViewName = keyof PublicSchema['Views'] | keyof PublicSchema['Tables'];
type TableName = keyof PublicSchema['Tables'];

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
        searchFields: ['name'],
        columns: [
            { key: 'name', label: '契約主体名', type: 'text', className: 'font-bold' },
            { key: 'contractor_id', label: 'ID', type: 'text', className: 'text-xs text-slate-400' },
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'contractor_id', label: '契約主体ID', type: 'text', requiredForCreate: true, updatable: false },
            { name: 'name', label: '契約主体名', type: 'text', required: true, updatable: true },
            { name: 'payee_id', label: '支払元ID', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    drivers: {
        title: 'ドライバー管理',
        description: '乗務員の基本連絡先と稼働状態の設定',
        viewName: 'drivers',
        rpcTableName: 'drivers',
        primaryKey: 'id',
        searchFields: ['driver_name'],
        columns: [
            { key: 'driver_name', label: '氏名', type: 'text', className: 'font-bold' },
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'driver_name', label: '氏名', type: 'text', required: true, updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    vehicles: {
        title: '車両管理',
        description: '配車対象車両の登録と設定',
        viewName: 'vehicles',
        rpcTableName: 'master_vehicles',
        primaryKey: 'id',
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
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'number', label: '車両番号', type: 'text', required: true, updatable: true },
            { name: 'callsign', label: '通称', type: 'text', updatable: true },
            { name: 'vehicle_type', label: '車種', type: 'text', required: true, updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
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
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'name', label: '品目名', type: 'text', required: true, updatable: true, placeholder: '例: 段ボール' },
            { name: 'unit', label: '単位', type: 'text', required: true, updatable: true, placeholder: 'kg' },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    points: {
        title: '回収先管理',
        description: '現場制約（車両制限/時間）および巡回ルート設定',
        viewName: 'view_master_points',
        rpcTableName: 'master_collection_points',
        primaryKey: 'id',
        searchFields: ['display_name', 'address', 'contractor_name', 'default_route_code', 'area'],
        columns: [
            {
                key: 'display_name',
                subLabelKey: 'area', // 名称の横に地域を表示
                thirdLabelKey: 'address',
                label: '拠点/地域/住所',
                type: 'multi-row',
                className: 'font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[280px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]'
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
                styleRules: {
                    default: 'bg-slate-100 text-slate-800',
                    'AM': 'bg-blue-100 text-blue-800 border border-blue-200',
                    'PM': 'bg-orange-100 text-orange-800 border border-orange-200',
                    'FREE': 'bg-emerald-100 text-emerald-800'
                }
            },
            {
                key: 'vehicle_restriction_type',
                label: '車両制限',
                type: 'badge',
                styleRules: {
                    default: 'bg-slate-50 text-slate-400',
                    'FIXED': 'bg-red-600 text-white font-black px-3 py-1 animate-pulse',
                    'FIXED_UNTIL_RETURN': 'bg-purple-600 text-white font-black px-3 py-1'
                }
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
                className: 'text-[10px] text-emerald-600 font-mono'
            },
            {
                key: 'time_constraint_type',
                label: '時間制約',
                type: 'badge',
                styleRules: {
                    default: 'bg-slate-100 text-slate-600',
                    'NONE': 'bg-slate-50 text-slate-400',
                    'RANGE': 'bg-blue-50 text-blue-600 border border-blue-100',
                    'FIXED': 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold'
                }
            },
            {
                key: 'is_spot_only',
                label: '種別',
                type: 'badge',
                styleRules: {
                    default: 'bg-slate-50 text-slate-400',
                    'true': 'bg-amber-100 text-amber-900 border-2 border-amber-500 font-black shadow-sm',
                    'false': 'bg-slate-100 text-slate-500'
                }
            },
            {
                key: 'internal_note',
                label: '備考',
                type: 'text',
                className: 'text-xs text-slate-500 truncate max-w-[150px]'
            },
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'display_name', label: '地点名（表示用）', type: 'text', required: true, placeholder: '例: ○○スーパー(AM)' },
            { name: 'area', label: '地域・エリア', type: 'text', placeholder: '例: 中央区, 六本木' },
            {
                name: 'contractor_id',
                label: '契約主体',
                type: 'select',
                required: true,
                lookup: {
                    schemaKey: 'contractors',
                    labelKey: 'name',
                    valueKey: 'contractor_id'
                }
            },
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
            { name: 'address', label: '住所', type: 'text', className: 'col-span-2' },
            { name: 'site_contact_phone', label: '現場直通電話', type: 'tel' },
            {
                name: 'internal_note',
                label: '備考',
                type: 'text',
                className: 'col-span-2',
                placeholder: '例: 裏口から入場。天井低い。'
            },
            {
                name: 'weighing_site_id',
                label: '指定計量所',
                type: 'text',
                className: 'col-span-1',
                placeholder: '計量所IDを入力...'
            },
            {
                name: 'time_constraint_type',
                label: '時間制限区分',
                type: 'select',
                options: ['NONE', 'RANGE', 'FIXED'],
                className: 'col-span-1',
                required: true
            },
            {
                name: 'is_spot_only',
                label: 'スポット専用フラグ',
                type: 'switch',
                className: 'col-span-1'
            },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    }
};
