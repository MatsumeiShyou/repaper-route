/**
 * マスタデータ定義の型
 */

export interface MasterColumn {
    key: string;
    label: string;
    type: 'text' | 'badge' | 'number' | 'status' | 'multi-row';
    subLabelKey?: string;
    className?: string;
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
            { key: 'is_active', label: '稼働状態', type: 'status' }
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
            { key: 'vehicle_type', label: '車種', type: 'badge' },
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
        description: '店舗・拠点の位置情報と設定',
        viewName: 'view_master_points',
        rpcTableName: 'master_collection_points', // Fixed from 'points' to match DB table
        primaryKey: 'id',
        searchFields: ['name', 'address', 'contractor_name'],
        columns: [
            { key: 'name', subLabelKey: 'contractor_name', label: '地点名 / 排出元', type: 'multi-row', className: 'font-bold' },
            { key: 'address', label: '住所', type: 'text', className: 'text-xs text-slate-500' },
            { key: 'is_active', label: '状態', type: 'status' }
        ],
        fields: [
            { name: 'name', label: '地点名', type: 'text', required: true },
            { name: 'address', label: '住所', type: 'text' }
        ]
    }
};
