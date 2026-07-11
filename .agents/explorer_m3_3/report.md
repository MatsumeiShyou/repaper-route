# Milestone 3 Investigation Report: `any`-type Refactoring Strategy & Challenger Findings

This report details the findings and refactoring strategy for resolving all `any` type occurrences in `MasterDataLayout.tsx`, along with the three Challenger findings from Milestone 2.

---

## 1. Executive Summary

- **Target Component**: `apps/repaper-route/src/components/MasterDataLayout.tsx`
  - **Findings**: A total of 22 `any` type occurrences (including variables, generic parameters, arrays, and casts) were identified.
  - **Refactoring Strategy**: Safely replace `any` with `Record<string, unknown>`, explicitly defined local interfaces, or specific types (like `MasterField`). Adapt property accesses from dot-notation (e.g. `item.prop`) to index-notation (e.g. `item['prop']`) to ensure strict compiler compliance without losing flexibility.
- **Challenger Findings Incorporated**:
  1. **`PostgrestError` check stringifies as `[object Object]`** in `useMasterCRUD.ts`: Resolved by introducing an error parser that inspects for a `.message` property before falling back to `String(err)`.
  2. **`Array.isArray` fallback type guards** in `MasterDataContext.tsx`: Ensured that all master table responses (`vehicles`, `customers`, `items`, `customerItemDefaults`) are validated as arrays before setting state.
  3. **Promise timeout leakage/unhandled rejection** in `AuthAdapter.ts`: Resolved by keeping a reference to the `setTimeout` identifier and executing `clearTimeout` in a `finally` block, ensuring no scheduled rejections fire after the fetch completes.

---

## 2. Analysis of `any` Occurrences in `MasterDataLayout.tsx`

We identified 22 occurrences of the `any` type in `MasterDataLayout.tsx`. Below is the detailed catalog and refactoring strategy for each:

### Group A: Generic Parameter & Form Data `any`
These occur due to using `Record<string, any>` to represent dynamically structured master data records.

1. **Line 40**: `useMasterCRUD<Record<string, any>>(schema);`
   - *Problem*: Allows unchecked access on fetched records.
   - *Strategy*: Replace with `useMasterCRUD<Record<string, unknown>>(schema);`.
2. **Line 45**: `const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);`
   - *Problem*: Allows unchecked mutations on the state representation of the edited item.
   - *Strategy*: Replace with `useState<Record<string, unknown> | null>(null);`.
3. **Line 120**: `const matchesInitial = (item: Record<string, any>) => {`
   - *Problem*: Parameter `item` is type-unsafe.
   - *Strategy*: Change parameter type to `Record<string, unknown>`. Inside the function, change `item.furigana` to index access `item['furigana']` to avoid compiler warnings.
4. **Line 172**: `const handleEdit = async (item: Record<string, any>) => {`
   - *Problem*: Parameter `item` is type-unsafe.
   - *Strategy*: Change parameter type to `Record<string, unknown>`.
5. **Line 204**: `const handleSave = async (formData: Record<string, any>) => {`
   - *Problem*: Form data parameter is type-unsafe.
   - *Strategy*: Change parameter type to `Record<string, unknown>`.
6. **Line 450**: `function renderCell(item: Record<string, any>, col: MasterColumn) {`
   - *Problem*: Rendering helper accepts `any` records.
   - *Strategy*: Change parameter type to `Record<string, unknown>`. Convert internal dot accesses (`item.site_contact_phone`, `item.vehicle_restriction_type`, `item.internal_note`) to type-safe index notation (`item['site_contact_phone']`, etc.).
7. **Line 641**: `initialData: Record<string, any> | null,` (in `MasterForm` props)
   - *Problem*: Component accepts `any` initial state.
   - *Strategy*: Change type to `Record<string, unknown> | null`. On Line 905, change `initialData.id` to `String(initialData['id'])`.
8. **Line 642**: `onSave: (data: Record<string, any>) => Promise<void>,` (in `MasterForm` props)
   - *Problem*: Callback parameter is typed as `any`.
   - *Strategy*: Change to `onSave: (data: Record<string, unknown>) => Promise<void>`.
9. **Line 647**: `const [formData, setFormData] = useState<Record<string, any>>(() => {`
   - *Problem*: State variable is typed with `any`.
   - *Strategy*: Change to `useState<Record<string, unknown>>`.
10. **Line 662**: `const { data: allItems } = useMasterCRUD<Record<string, any>>(MASTER_SCHEMAS.items);`
    - *Problem*: Fetching all items uses `any`.
    - *Strategy*: Change to `useMasterCRUD<Record<string, unknown>>`. Change accesses within tag rendering (`item.name`, `item.id`) to index signature access (`item['name']`, `item['id']`).

### Group B: API Fetches & Exception `any`
11. **Line 177**: `const { data: results, error: fetchErr } = await nativeSupabaseFetch<any[]>(`
    - *Problem*: Generic type of native fetch response is open-ended.
    - *Strategy*: Replace with `nativeSupabaseFetch<Record<string, unknown>[]>(`.
12. **Line 214**: `} catch (err: any) {`
    - *Problem*: Catch block variable explicitly typed as `any`.
    - *Strategy*: Change to `catch (err: unknown)` and perform type assertions on properties inside the block:
      ```typescript
      const error = err as { message?: string; code?: string; hint?: string; details?: string };
      const errorMsg = error.message || '不明なエラー';
      ```

### Group C: Lookup Component `any`
13. **Line 945**: `field: any, // MasterField from schema`
    - *Problem*: Parameter `field` is typed as `any`.
    - *Strategy*: Change type to `MasterField`, imported from `../types/master`.
14. **Line 961**: `{options.map((opt: any) => (`
    - *Problem*: Array mapping item is typed as `any`.
    - *Strategy*: Since `useMasterCRUD` returns `Record<string, unknown>[]`, we can omit `any` and let TypeScript infer `opt` as `Record<string, unknown>`, accessing fields via index signatures.

### Group D: PointAccessSection `any` (Supabase Bypasses)
15. **Line 976**: `const [permissions, setPermissions] = useState<any[]>([]);`
    - *Problem*: Component state holds `any[]`.
    - *Strategy*: Define a local interface `PointAccessPermission` and use `useState<PointAccessPermission[]>([]);`:
      ```typescript
      interface PointAccessPermission {
          id: string;
          point_id: string;
          driver_id: string;
          vehicle_id: string;
          is_active: boolean;
      }
      ```
16. **Line 977**: `const [drivers, setDrivers] = useState<any[]>([]);`
    - *Problem*: Mapped staffs records stored as `any[]`.
    - *Strategy*: Use `useState<{ id: string; name: string }[]>([]);`.
17. **Line 978**: `const [vehicles, setVehicles] = useState<any[]>([]);`
    - *Problem*: Vehicles list stored as `any[]`.
    - *Strategy*: Define a local interface `SimpleVehicle` and use `useState<SimpleVehicle[]>([]);`:
      ```typescript
      interface SimpleVehicle {
          id: string;
          number: string;
          callsign?: string;
      }
      ```
18. **Line 992**: `setDrivers((data || []).map((d: any) => ({ id: d.id, name: d.name || d.id })))`
    - *Problem*: Maps Supabase staff data with type `any`.
    - *Strategy*: Explicitly type the map parameter: `(d: { id: string; name: string | null })`.
19. **Line 1003**: `await (supabase.from('point_access_permissions') as any).upsert(`
    - *Problem*: Suppresses types for table builder.
    - *Strategy*: Remove `as any` casting. Localize type casting to `onConflict` value if compiler complains: `onConflict: 'point_id,driver_id' as any`.
20. **Line 1009**: `const { data } = await (supabase.from('point_access_permissions') as any).select('*')`
    - *Problem*: Unnecessary `as any` bypass on standard select query.
    - *Strategy*: Remove `as any`.
21. **Line 1017**: `await (supabase.from('point_access_permissions') as any).update({ is_active: false })`
    - *Problem*: Unnecessary `as any` bypass on standard update query.
    - *Strategy*: Remove `as any`.
22. **Line 1055**: `{permissions.map((p: any) => {`
    - *Problem*: Map item typed as `any`.
    - *Strategy*: Remove explicit type annotation entirely; TS will infer `p` as `PointAccessPermission` based on refactored state.

---

## 3. Milestone 2 Challenger Findings Analysis

### Finding 1: `PostgrestError` check stringification in `useMasterCRUD.ts`
- **Root Cause**: When a fetch or database interaction fails, Supabase returns a `PostgrestError` object. In `useMasterCRUD.ts`, the catch block uses `err instanceof Error ? err : new Error(String(err))`. Because `PostgrestError` is a plain object, `String(err)` evaluates to `"[object Object]"`, obscuring the actual error message.
- **Refactoring Strategy**: Introduce a helper function `toStandardError` to extract the message cleanly from plain object errors:
  ```typescript
  const toStandardError = (err: unknown): Error => {
      if (err instanceof Error) return err;
      if (err && typeof err === 'object') {
          const record = err as Record<string, unknown>;
          if (typeof record.message === 'string') {
              const error = new Error(record.message);
              if ('code' in record) (error as any).code = record.code;
              if ('details' in record) (error as any).details = record.details;
              if ('hint' in record) (error as any).hint = record.hint;
              return error;
          }
          return new Error(JSON.stringify(err));
      }
      return new Error(String(err));
  };
  ```
  Replace all `new Error(String(err))` conversions inside `useMasterCRUD.ts` with `toStandardError(err)`.

### Finding 2: `Array.isArray` fallback type guards in `MasterDataContext.tsx`
- **Root Cause**: Fetch results from `nativeSupabaseFetch` are typed as returning arrays. However, network failure or anomalous API responses can yield null, undefined, or error objects instead of arrays. The context setter relies on `vRes.data || []`, which fails to protect against non-null non-array objects.
- **Refactoring Strategy**: Standardize array checks for all master data fields to mirror the pattern used for drivers:
  ```typescript
  setData({
      drivers: processedDrivers,
      vehicles: (Array.isArray(vRes.data) ? vRes.data : []) as MasterVehicle[],
      customers: (Array.isArray(cRes.data) ? cRes.data : []) as MasterCustomer[],
      items: (Array.isArray(iRes.data) ? iRes.data : []) as MasterItem[],
      customerItemDefaults: (Array.isArray(cidRes.data) ? cidRes.data : []) as CustomerItemDefault[]
  });
  ```

### Finding 3: Promise timeout leakage/unhandled rejection warnings inside `AuthAdapter.ts`
- **Root Cause**: In `AuthAdapter.ts`, the fetch query runs alongside a timeout promise:
  ```typescript
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT_DB_FETCH')), 15000);
  });
  const { data: staff, error } = await Promise.race([queryPromise, timeoutPromise]);
  ```
  If `queryPromise` resolves first (e.g. in 100ms), the execution proceeds. However, the scheduled `reject` inside `setTimeout` is never cancelled and still executes 15 seconds later. Since `Promise.race` has already resolved, the rejection is unhandled, triggering unhandled promise rejection warnings and leaking memory.
- **Refactoring Strategy**: Capture the `setTimeout` ID and clear it in a `finally` block when the race ends:
  ```typescript
  let timeoutId: number | NodeJS.Timeout | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('TIMEOUT_DB_FETCH')), 15000);
  });
  
  try {
    const { data: staff, error } = await Promise.race([queryPromise, timeoutPromise]);
    // process results...
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
  ```
  Since `queryPromise` also has a `.catch` block that converts rejection to a resolved `{ data: null, error: err }`, no other rejection path will leak, guaranteeing a leak-proof setup.
