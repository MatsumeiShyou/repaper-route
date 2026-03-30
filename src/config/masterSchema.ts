import { MasterSchema } from '../types/master';

/**
 * Master Data Schema Definitions (Sanctuary Purified)
 * [Ref: Sanctuary Governance Constitution Section B-4 F-SSOT]
 */

const pointSchema: MasterSchema = {
    tableName: 'master_collection_points',
    rpcTableName: 'master_collection_points',
    viewName: 'view_master_points',
    primaryKey: 'id',
    title: '拠点マスタ管理',
    description: '回収拠点および顧客情報の管理を行います。',
    label: 'Points (Master)',
    fields: [
        { name: 'display_name', label: 'Point Name', type: 'text', required: true, updatable: true },
        { name: 'furigana', label: 'Furigana', type: 'text', required: false, updatable: true },
        { name: 'address', label: 'Address', type: 'text', required: true, updatable: true },
        { name: 'note', label: 'Internal Note', type: 'text', required: false, updatable: true },
        { name: 'is_active', label: 'Active', type: 'switch', required: true, updatable: true }
    ],
    columns: [
        { key: 'display_name', label: '拠点名', type: 'multi-row', subLabelKey: 'address', sortable: true, className: 'sticky left-0' },
        { key: 'furigana', label: 'フリガナ', type: 'text', sortable: true },
        { key: 'area', label: 'エリア', type: 'badge', sortable: true },
        { key: 'is_active', label: '状態', type: 'status', sortable: true }
    ],
    searchFields: ['display_name', 'address', 'furigana']
};

const vehicleSchema: MasterSchema = {
    tableName: 'master_vehicles',
    rpcTableName: 'master_vehicles',
    viewName: 'vehicles',
    primaryKey: 'id',
    title: '車両マスタ管理',
    description: '稼働車両およびスペックの管理を行います。',
    label: 'Vehicles (Master)',
    fields: [
        { name: 'name', label: 'Vehicle Name', type: 'text', required: true, updatable: true },
        { name: 'callsign', label: 'Callsign', type: 'text', required: false, updatable: true },
        { name: 'is_active', label: 'Active', type: 'switch', required: true, updatable: true }
    ],
    columns: [
        { key: 'name', label: '車両名', type: 'text', sortable: true },
        { key: 'callsign', label: 'コールサイン', type: 'badge', sortable: true },
        { key: 'vehicle_type', label: '種別', type: 'badge', sortable: true },
        { key: 'is_active', label: '状態', type: 'status', sortable: true }
    ],
    searchFields: ['name', 'callsign']
};

const itemSchema: MasterSchema = {
    tableName: 'master_items',
    rpcTableName: 'master_items',
    viewName: 'master_items',
    primaryKey: 'id',
    title: '品目マスタ管理',
    description: '回収品目および単位の管理を行います。',
    label: 'Items (Master)',
    fields: [
        { name: 'name', label: 'Item Name', type: 'text', required: true, updatable: true },
        { name: 'unit', label: 'Unit', type: 'text', required: false, updatable: true },
        { name: 'display_order', label: 'Display Order', type: 'number', required: false, updatable: true }
    ],
    columns: [
        { key: 'name', label: '品目名', type: 'text', sortable: true },
        { key: 'unit', label: '単位', type: 'badge', sortable: true },
        { key: 'display_order', label: '順位', type: 'text', sortable: true }
    ],
    searchFields: ['name']
};

const driverSchema: MasterSchema = {
    tableName: 'staffs',
    rpcTableName: 'staffs',
    viewName: 'staffs',
    primaryKey: 'id',
    title: 'スタッフ名簿管理',
    description: 'ドライバーおよび管理者、OSユーザーの管理を行います。',
    label: 'Drivers (Master)',
    fields: [
        { name: 'name', label: 'Driver Name', type: 'text', required: true, updatable: false },
        { name: 'role', label: 'Role', type: 'select', options: ['admin', 'driver'], required: true, updatable: true },
        { name: 'vehicle_info', label: 'Vehicle Info', type: 'text', required: false, updatable: true }
    ],
    columns: [
        { key: 'name', label: '氏名', type: 'text', sortable: true },
        { key: 'role', label: '役割', type: 'badge', sortable: true, styleRules: { 'admin': 'bg-rose-100 text-rose-700', 'driver': 'bg-blue-100 text-blue-700' } },
        { key: 'vehicle_info', label: '車両情報', type: 'text', sortable: true }
    ],
    searchFields: ['name', 'role']
};

// [Export] 既存 UI (MasterDataLayout.tsx) が期待する命名 (MASTER_SCHEMAS) に同期
export const MASTER_SCHEMAS: Record<string, MasterSchema> = {
    points: pointSchema,
    vehicles: vehicleSchema,
    items: itemSchema,
    drivers: driverSchema
};

/**
 * Legacy Alias Support (Preventing future hallucinations)
 */
export const masterSchemas = MASTER_SCHEMAS;
export type { MasterSchema, MasterColumn } from '../types/master';
