import { MasterField } from '../types/master';

export interface MasterSchema {
    tableName: string;
    label: string;
    fields: MasterField[];
}

export const masterSchemas: Record<string, MasterSchema> = {
    contractors: {
        tableName: 'master_contractors',
        label: '仕入先',
        fields: [
            { name: 'contractor_id', label: 'ID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'name', label: '仕入先名', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    items: {
        tableName: 'master_items',
        label: '品目',
        fields: [
            { name: 'id', label: 'ID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'name', label: '品目名', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    vehicles: {
        tableName: 'master_vehicles',
        label: '車両',
        fields: [
            { name: 'id', label: 'ID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'callsign', label: 'コールサイン', type: 'text', required: true, updatable: true },
            { name: 'number', label: '車両番号', type: 'text', updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true },
            { name: 'note', label: '備考', type: 'text', className: 'col-span-2' },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    drivers: {
        tableName: 'drivers',
        label: '配車スタッフ',
        fields: [
            { name: 'id', label: 'ID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'driver_name', label: '氏名', type: 'text', required: true, updatable: true },
            { name: 'furigana', label: 'ﾌﾘｶﾞﾅ', type: 'text', updatable: true },
            { name: 'note', label: '備考', type: 'text', className: 'col-span-2' },
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    },
    points: {
        tableName: 'master_collection_points',
        label: '回収先',
        fields: [
            { name: 'id', label: 'UUID', type: 'text', updatable: false, className: 'hidden' },
            { name: 'location_id', label: '管理番号', type: 'text', required: true, updatable: true, placeholder: '例: 28' },
            { name: 'name', label: '正式名称', type: 'text', required: true, placeholder: '例: ○○スーパー' },
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
            { name: 'is_active', label: '有効状態', type: 'switch', updatable: true }
        ]
    }
};
