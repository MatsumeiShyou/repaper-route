# Components and OS `any` Types Scan Report

## Overview
This report lists all occurrences of `any` types found in the following directories of the `repaper-route` application:
- `src/components/`
- `src/os/`
- Root of `src/`

Scan Date: 2026-07-10T08:35:00+09:00

## Summary of Findings
| Target Directory | Total Files | Files with `any` | Total Occurrences of `any` |
| --- | --- | --- | --- |
| `src/components` | 8 | 1 | 21 |
| `src/os` | 4 | 2 | 3 |
| `src/` root | 3 | 0 | 0 |
| **Total** | **15** | **3** | **24** |

---

## Detailed Occurrences by File

### 1. `src/components/MasterDataLayout.tsx`
Total Occurrences: 21 (20 type usages/assertions, 1 comment)

- **Line 32**: (Comment)
  ```typescript
  // 汎用レイアウトなので Record<string, any> として扱う
  ```
- **Line 40**: (Generic type parameter)
  ```typescript
  const { ... } = useMasterCRUD<Record<string, any>>(schema);
  ```
- **Line 45**: (Generic type parameter)
  ```typescript
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);
  ```
- **Line 120**: (Parameter type)
  ```typescript
  const matchesInitial = (item: Record<string, any>) => {
  ```
- **Line 172**: (Parameter type)
  ```typescript
  const handleEdit = async (item: Record<string, any>) => {
  ```
- **Line 204**: (Parameter type)
  ```typescript
  const handleSave = async (formData: Record<string, any>) => {
  ```
- **Line 214**: (Catch variable type)
  ```typescript
  } catch (err: any) {
  ```
- **Line 450**: (Parameter type)
  ```typescript
  function renderCell(item: Record<string, any>, col: MasterColumn) {
  ```
- **Line 641**: (Property type)
  ```typescript
  initialData: Record<string, any> | null,
  ```
- **Line 642**: (Parameter type)
  ```typescript
  onSave: (data: Record<string, any>) => Promise<void>,
  ```
- **Line 647**: (Generic type parameter)
  ```typescript
  const [formData, setFormData] = useState<Record<string, any>>(() => {
  ```
- **Line 945**: (Parameter type)
  ```typescript
  field: any, // MasterField from schema
  ```
- **Line 961**: (Callback parameter type)
  ```typescript
  {options.map((opt: any) => (
  ```
- **Line 976**: (State array type)
  ```typescript
  const [permissions, setPermissions] = useState<any[]>([]);
  ```
- **Line 977**: (State array type)
  ```typescript
  const [drivers, setDrivers] = useState<any[]>([]);
  ```
- **Line 978**: (State array type)
  ```typescript
  const [vehicles, setVehicles] = useState<any[]>([]);
  ```
- **Line 992**: (Callback parameter type)
  ```typescript
  setDrivers((data || []).map((d: any) => ({ id: d.id, name: d.name || d.id })))
  ```
- **Line 1003**: (Type assertion)
  ```typescript
  await (supabase.from('point_access_permissions') as any).upsert(
  ```
- **Line 1009**: (Type assertion)
  ```typescript
  const { data } = await (supabase.from('point_access_permissions') as any)
  ```
- **Line 1017**: (Type assertion)
  ```typescript
  await (supabase.from('point_access_permissions') as any).update({ is_active: false }).eq('id', id);
  ```
- **Line 1055**: (Callback parameter type)
  ```typescript
  {permissions.map((p: any) => {
  ```

---

### 2. `src/os/auth/AuthAdapter.ts`
Total Occurrences: 1

- **Line 134**: (Generic type parameter)
  ```typescript
  const timeoutPromise = new Promise<any>((_, reject) => {
  ```

---

### 3. `src/os/auth/types.ts`
Total Occurrences: 2

- **Line 8**: (Property type)
  ```typescript
  allowed_apps: any; // jsonb
  ```
- **Line 54**: (Property type)
  ```typescript
  details?: any;
  ```

---

## Clean Files (No occurrences of `any`)
- `src/components/AdminLayout.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/Modal.tsx`
- `src/components/ProfilePortal.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Skeleton.tsx`
- `src/components/Toast.tsx`
- `src/os/auth/AuthErrorBoundary.tsx`
- `src/os/auth/authStore.ts`
- `src/App.tsx`
- `src/main.tsx`
- `src/vite-env.d.ts`
