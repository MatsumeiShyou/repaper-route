/**
 * Master Schema Configuration Template
 * 
 * Defines the UI structure and behavior for Schema-Driven UI.
 * Copy this to create new master maintenance screens.
 */
export const masterSchema = {
    // DB Configuration
    viewName: 'view_master_placeholder', // Read View
    rpcTableName: 'master_placeholder',  // Write Table

    // UI Metadata
    title: 'マスタデータ管理テンプレート',
    description: '新しいマスタ管理画面のテンプレートです。',
    audit_hint: '変更理由を具体的に記述してください',

    // Functionality
    searchFields: ['name', 'code'],
    initialSort: { column: 'code', ascending: true },

    // List Columns
    columns: [
        { key: 'code', label: 'コード', className: 'font-mono w-24' },
        { key: 'name', label: '名称', className: 'font-bold' },
        { key: 'category', label: 'カテゴリ' },
        { key: 'is_active', label: '状態', type: 'badge', color: 'blue' }
    ],

    // Form Fields
    fields: [
        { name: 'code', label: 'コード', type: 'text', required: true, placeholder: '例: M001', className: 'col-span-1' },
        { name: 'name', label: '名称', type: 'text', required: true, placeholder: '名称を入力', className: 'col-span-1' },
        { name: 'category', label: 'カテゴリ', type: 'select', options: ['A', 'B', 'C'], required: true, className: 'col-span-2' },
        { name: 'remarks', label: '備考', type: 'text', placeholder: '任意', className: 'col-span-2' }
    ]
};
