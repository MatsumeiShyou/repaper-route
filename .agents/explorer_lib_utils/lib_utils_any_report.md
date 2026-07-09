# Any Types Scan Report

- **Target Directories**: 
  - `apps/repaper-route/src/lib`
  - `apps/repaper-route/src/utils`
- **Scan Date**: 2026-07-09T23:26:13Z

---

## Summary of Findings

| File Path | Count of `any` | Line Numbers |
| --- | --- | --- |
| `apps/repaper-route/src/lib/PeriodicJobImporter.ts` | 1 | 38 |
| `apps/repaper-route/src/lib/idb/boardStore.ts` | 0 | - |
| `apps/repaper-route/src/lib/supabase/client.ts` | 0 | - |
| `apps/repaper-route/src/lib/supabase/nativeFetch.ts` | 3 | 5, 9, 84 |
| `apps/repaper-route/src/utils/serialization.ts` | 7 | 6, 10, 11, 71, 84, 118, 121 |
| `apps/repaper-route/src/utils/sortUtils.ts` | 3 | 13 (x2), 45 |
| **Total** | **14** | |

---

## Detailed Findings by File

### 1. `apps/repaper-route/src/lib/PeriodicJobImporter.ts`
- **Line 38**:
  ```typescript
  const collectionDays = p.collection_days as any;
  ```
  *Context*: Casting `p.collection_days` (type from Database rows) as `any` to handle dynamic object/array structure parsing on downstream lines.

---

### 2. `apps/repaper-route/src/lib/supabase/nativeFetch.ts`
- **Line 5**:
  ```typescript
  export async function nativeSupabaseFetch<T = any>(
  ```
  *Context*: Default generic parameter `T` defaults to `any` for raw Supabase response payload.
- **Line 9**:
  ```typescript
  body?: any
  ```
  *Context*: The request payload parameter `body` is typed as `any` to support various object formats passed to Supabase REST/RPC endpoints.
- **Line 84**:
  ```typescript
  } catch (fetchErr: any) {
  ```
  *Context*: Catch block variable `fetchErr` is typed as `any`.

---

### 3. `apps/repaper-route/src/utils/serialization.ts`
- **Line 6**:
  ```typescript
  export function serializeMasterData<T extends Record<string, any>>(
  ```
  *Context*: Generic constraint `T` extends `Record<string, any>` to allow indexing of fields by string keys on form data objects.
- **Line 10**:
  ```typescript
  ): any {
  ```
  *Context*: Return type of `serializeMasterData` is explicitly marked `any`.
- **Line 11**:
  ```typescript
  const serialized: any = {};
  ```
  *Context*: Intermediate variable `serialized` is typed as `any` because properties are dynamically assigned from different field configurations.
- **Line 71**:
  ```typescript
  export function normalizeDays(days: any): string[] {
  ```
  *Context*: Argument `days` is typed as `any` because the DB storage value can be either an Array, an Object, a String, or null/undefined.
- **Line 84**:
  ```typescript
  if ((days as any)[dbKey] === true) {
  ```
  *Context*: `days` cast to `any` inside property check to bypass compiler indexing errors on potential object type.
- **Line 118**:
  ```typescript
  return data.map(item => cleansePurgedFields(item)) as any;
  ```
  *Context*: Array map result is cast to `any` before returning.
- **Line 121**:
  ```typescript
  const cleansed = { ...data } as any;
  ```
  *Context*: Copied object is cast to `any` to allow deletion and mutation of arbitrary keys.

---

### 4. `apps/repaper-route/src/utils/sortUtils.ts`
- **Line 13**:
  ```typescript
  export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {
  ```
  *Context*: Parameters `a` and `b` (the elements to compare) are typed as `any` to allow sorting collections of arbitrary shape.
- **Line 45**:
  ```typescript
  function isValidDate(val: any): boolean {
  ```
  *Context*: Parameter `val` is typed as `any` as it checks dynamic values to determine if they represent a valid date string.
