/**
 * Master Data Management Types (Purified & Unified)
 */

export type MasterFieldType = 'text' | 'tel' | 'select' | 'days' | 'tags' | 'switch' | 'number' | 'boolean';

export interface MasterField {
    name: string;
    label: string;
    type: MasterFieldType;
    required?: boolean;
    requiredForCreate?: boolean;
    updatable?: boolean;
    className?: string;
    placeholder?: string;
    options?: string[];
    optionLabels?: Record<string, string>;
    lookup?: {
        schemaKey: string;
        labelKey: string;
        valueKey: string;
    };
}

export interface MasterColumn {
    key: string;
    label: string;
    type?: 'text' | 'status' | 'badge' | 'multi-row' | 'tags' | 'days';
    sortable?: boolean;
    sortKey?: string;
    sortOptions?: { key: string; label: string }[];
    className?: string;
    subLabelKey?: string;
    thirdLabelKey?: string;
    optionLabels?: Record<string, string>;
    styleRules?: Record<string, string>;
}

export interface MasterSchema {
    tableName: string; // @deprecated
    rpcTableName: string;
    viewName: string;
    primaryKey: string;
    title: string;
    description: string;
    label: string;
    fields: MasterField[];
    columns: MasterColumn[];
    searchFields: string[];
}
