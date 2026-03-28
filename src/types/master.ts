/**
 * Master Data Management Types (Purified & Unified)
 */

export type MasterFieldType = 'text' | 'tel' | 'select' | 'days' | 'tags' | 'switch' | 'number' | 'boolean';

export interface MasterField {
    name: string;
    label: string;
    type: MasterFieldType;
    required?: boolean;
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

export interface MasterSchema {
    tableName: string;
    label: string;
    fields: MasterField[];
}
