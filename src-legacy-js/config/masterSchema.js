/**
 * マスタデータ定義スキーマ
 * 画面構成、バリデーション、DBテーブルマッピングを一元管理する
 */
export const MASTER_SCHEMAS = {
    drivers: {
        title: 'ドライバー管理',
        description: '乗務員の基本情報と稼働状態の設定',
        viewName: 'profiles',
        rpcTableName: 'drivers', // Matches RPC branch
        searchFields: ['name', 'mobile_phone'],
        columns: [
            { key: 'name', label: '氏名 / 電話番号', type: 'multi-row', subKey: 'mobile_phone', className: 'font-bold' },
            { key: 'vehicle_name', label: '担当車両', type: 'badge' }
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
            { key: 'number', label: '車両番号 / 通称', type: 'multi-row', subKey: 'callsign', className: 'font-bold text-blue-600' },
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
        description: '仕分け品目と単位の設定',
        viewName: 'master_items',
        rpcTableName: 'items',
        searchFields: ['name', 'unit'],
        columns: [
            { key: 'name', label: '品目名 / 単位', type: 'multi-row', subKey: 'unit', className: 'font-bold' },
        ],
        fields: [
            { name: 'name', label: '品目名', type: 'text', required: true },
            { name: 'unit', label: '単位', type: 'text', required: true }
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
            { key: 'name', label: '地点名 / 排出元', type: 'multi-row', subKey: 'contractor_name', className: 'font-bold' },
            { key: 'address', label: '住所', type: 'text' }
        ],
        fields: [
            { name: 'name', label: '地点名', type: 'text', required: true },
            { name: 'address', label: '住所', type: 'text' }
        ]
    }
};
