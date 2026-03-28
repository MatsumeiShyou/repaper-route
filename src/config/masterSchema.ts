import { MasterSchema } from '../types/master';

/**
 * Master Data Schema Definitions (Sanctuary Purified)
 * [Ref: Sanctuary Governance Constitution Section B-4 F-SSOT]
 */

const pointSchema: MasterSchema = {
    tableName: 'master_collection_points',
    label: 'Points (Master)',
    fields: [
        { name: 'display_name', label: 'Point Name', type: 'text', required: true, updatable: true },
        { name: 'furigana', label: 'Furigana', type: 'text', required: false, updatable: true },
        { name: 'address', label: 'Address', type: 'text', required: true, updatable: true },
        { name: 'note', label: 'Internal Note', type: 'text', required: false, updatable: true },
        { name: 'is_active', label: 'Active', type: 'switch', required: true, updatable: true }
    ]
};

const vehicleSchema: MasterSchema = {
    tableName: 'master_vehicles',
    label: 'Vehicles (Master)',
    fields: [
        { name: 'name', label: 'Vehicle Name', type: 'text', required: true, updatable: true },
        { name: 'callsign', label: 'Callsign', type: 'text', required: false, updatable: true },
        { name: 'is_active', label: 'Active', type: 'switch', required: true, updatable: true }
    ]
};

const itemSchema: MasterSchema = {
    tableName: 'master_items',
    label: 'Items (Master)',
    fields: [
        { name: 'name', label: 'Item Name', type: 'text', required: true, updatable: true },
        { name: 'unit', label: 'Unit', type: 'text', required: false, updatable: true },
        { name: 'display_order', label: 'Display Order', type: 'number', required: false, updatable: true }
    ]
};

const driverSchema: MasterSchema = {
    tableName: 'profiles',
    label: 'Drivers (Master)',
    fields: [
        { name: 'name', label: 'Driver Name', type: 'text', required: true, updatable: false },
        { name: 'role', label: 'Role', type: 'select', options: ['admin', 'driver'], required: true, updatable: true },
        { name: 'vehicle_info', label: 'Vehicle Info', type: 'text', required: false, updatable: true }
    ]
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
