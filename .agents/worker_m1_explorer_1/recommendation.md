# Recommendation for replacing `any` types - Milestone 1

This document outlines the detailed refactoring recommendations for 14 occurrences of `any` types in 4 files under `apps/repaper-route`. All recommended changes use standard TypeScript type system mechanisms (e.g., `unknown`, generics, type guards, explicit cast assertions) to ensure compile-time type safety with zero runtime degradation.

---

## 1. File: `apps/repaper-route/src/lib/PeriodicJobImporter.ts` (1 occurrence)

### Occurrence 1: Line 38
* **Code:** `const collectionDays = p.collection_days as any;`
* **Analysis:**
  * `p` is of type `MasterPoint` (`Database['public']['Tables']['master_collection_points']['Row']`).
  * `collection_days` is representing a JSON/JSONB field in the database, yielding `Json | null` in TypeScript, which cannot be directly indexed.
  * The code checks if it's an Array (`["Mon", "Tue"]`) or an Object (`{ mon: true, tue: false }`).
  * Casting to `any` bypasses all type checking when indexing the object.
* **Recommendation:**
  * Cast `p.collection_days` to `unknown` first, then cast to a more specific type safe check after confirming the runtime types.
  * In the Array block, cast to `unknown[]` and safely check string elements.
  * In the Object block, cast to `Record<string, unknown>`.

#### Refactoring Diff proposal:
```typescript
// BEFORE
36:         return (data || []).filter((p: MasterPoint) => {
37:             // 1. Day of Week Check (Handle both Object and Array structures)
38:             const collectionDays = p.collection_days as any;
39:             if (!collectionDays) return false;
40: 
41:             let isDayMatch = false;
42: 
43:             if (Array.isArray(collectionDays)) {
44:                 // Handle Array case: ["Mon", "Tue"] or ["mon", "tue"]
45:                 isDayMatch = collectionDays.some(d => 
46:                     typeof d === 'string' && d.toLowerCase().startsWith(dayKey)
47:                 );
48:             } else if (typeof collectionDays === 'object') {
49:                 // Handle Object case: { mon: true, tue: false }
50:                 isDayMatch = !!collectionDays[dayKey];
51:             }

// AFTER
36:         return (data || []).filter((p: MasterPoint) => {
37:             // 1. Day of Week Check (Handle both Object and Array structures)
38:             const collectionDays = p.collection_days as unknown;
39:             if (!collectionDays) return false;
40: 
41:             let isDayMatch = false;
42: 
43:             if (Array.isArray(collectionDays)) {
44:                 // Handle Array case: ["Mon", "Tue"] or ["mon", "tue"]
45:                 isDayMatch = (collectionDays as unknown[]).some(d => 
46:                     typeof d === 'string' && d.toLowerCase().startsWith(dayKey)
47:                 );
48:             } else if (typeof collectionDays === 'object') {
49:                 // Handle Object case: { mon: true, tue: false }
50:                 const daysObj = collectionDays as Record<string, unknown>;
51:                 isDayMatch = !!daysObj[dayKey];
52:             }
```

---

## 2. File: `apps/repaper-route/src/lib/supabase/nativeFetch.ts` (3 occurrences)

### Occurrence 1: Line 5
* **Code:** `export async function nativeSupabaseFetch<T = any>(`
* **Analysis:** Default generic type parameter is set to `any`.
* **Recommendation:**
  * Change default type to `unknown` (`<T = unknown>`).
  * Encourage callers to supply explicit types. For example, in `PeriodicJobImporter.ts` (line 17), call it as `await nativeSupabaseFetch<MasterPoint[]>('master_collection_points', ...)`.

### Occurrence 2: Line 9
* **Code:** `body?: any`
* **Analysis:** The request payload `body` can be of any JSON-serializable type.
* **Recommendation:**
  * Change to `body?: unknown`. `JSON.stringify(body)` supports `unknown` type safely since `JSON.stringify` accepts `any`.

### Occurrence 3: Line 84
* **Code:** `catch (fetchErr: any) {`
* **Analysis:** Catching errors in TypeScript allows `unknown` (or `any`), but accessing properties on `unknown` requires type checking.
* **Recommendation:**
  * Type catch variable as `unknown`. Use an `instanceof Error` type guard to safely extract the `.message` property, falling back to converting to string if it is not an `Error`.

#### Refactoring Diff proposal:
```typescript
// BEFORE
5: export async function nativeSupabaseFetch<T = any>(
6:     table: string, 
7:     queryParams: string = 'select=*', 
8:     method: NativeFetchMethod = 'GET',
9:     body?: any
10: ) {
...
84:     } catch (fetchErr: any) {
85:         console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
86:         return { data: null, error: { message: fetchErr.message, status: 0 } };
87:     }

// AFTER
5: export async function nativeSupabaseFetch<T = unknown>(
6:     table: string, 
7:     queryParams: string = 'select=*', 
8:     method: NativeFetchMethod = 'GET',
9:     body?: unknown
10: ) {
...
84:     } catch (fetchErr: unknown) {
85:         console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
86:         const errorMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
87:         return { data: null, error: { message: errorMessage, status: 0 } };
88:     }
```

---

## 3. File: `apps/repaper-route/src/utils/serialization.ts` (7 occurrences)

### Occurrence 1: Line 6
* **Code:** `export function serializeMasterData<T extends Record<string, any>>(`
* **Analysis:** Constraint on form data record defaults to `any` values.
* **Recommendation:**
  * Change to `T extends Record<string, unknown>`.

### Occurrence 2: Line 10
* **Code:** `): any {` (return type of `serializeMasterData`)
* **Analysis:** The function returns a serialized database-ready record, which has string keys and various database column-compatible values.
* **Recommendation:**
  * Change return type to `Record<string, unknown>`.

### Occurrence 3: Line 11
* **Code:** `const serialized: any = {};`
* **Analysis:** Temporary local variable storing serialized data.
* **Recommendation:**
  * Change type to `Record<string, unknown>`.

### Occurrence 4: Line 71
* **Code:** `export function normalizeDays(days: any): string[] {`
* **Analysis:** Parameter `days` represents database value which is typically a JSON object, array, or string.
* **Recommendation:**
  * Change signature to `days: unknown`.

### Occurrence 5: Line 84
* **Code:** `if ((days as any)[dbKey] === true) {`
* **Analysis:** Type assertion used to index into the `days` object.
* **Recommendation:**
  * Assert `days` as `Record<string, unknown>` once at the block level: `const dayRecord = days as Record<string, unknown>`. This allows safe indexing.

### Occurrence 6: Line 118
* **Code:** `return data.map(item => cleansePurgedFields(item)) as any;`
* **Analysis:** Return type casting for mapped array structure.
* **Recommendation:**
  * Use `as unknown as T` to safely cast after map.

### Occurrence 7: Line 121
* **Code:** `const cleansed = { ...data } as any;`
* **Analysis:** Copying object structure for field removal.
* **Recommendation:**
  * Cast to `Record<string, unknown>` instead, allowing safe property deletions and recursively calling `cleansePurgedFields`.

#### Refactoring Diff proposal:
```typescript
// BEFORE
6: export function serializeMasterData<T extends Record<string, any>>(
7:     formData: Partial<T>,
8:     fields: MasterField[],
9:     _rpcTableName: string
10: ): any {
11:     const serialized: any = {};
...
71: export function normalizeDays(days: any): string[] {
72:     if (!days) return [];
73: 
74:     // DBからのオブジェクト形式 ({ mon: true, ... }) を配列形式に変換
75:     if (typeof days === 'object' && !Array.isArray(days)) {
...
83:         Object.entries(dayMap).forEach(([dbKey, uiKey]) => {
84:             if ((days as any)[dbKey] === true) {
85:                 activeDays.push(uiKey);
86:             }
87:         });
...
109: export function cleansePurgedFields<T>(data: T): T {
...
117:     if (Array.isArray(data)) {
118:         return data.map(item => cleansePurgedFields(item)) as any;
119:     }
120: 
121:     const cleansed = { ...data } as any;
122:     Object.keys(cleansed).forEach(key => {
123:         if (purgedKeys.includes(key)) {
124:             delete cleansed[key];
125:         } else if (typeof cleansed[key] === 'object') {
126:             cleansed[key] = cleansePurgedFields(cleansed[key]);
127:         }
128:     });

// AFTER
6: export function serializeMasterData<T extends Record<string, unknown>>(
7:     formData: Partial<T>,
8:     fields: MasterField[],
9:     _rpcTableName: string
10: ): Record<string, unknown> {
11:     const serialized: Record<string, unknown> = {};
...
71: export function normalizeDays(days: unknown): string[] {
72:     if (!days) return [];
73: 
74:     // DBからのオブジェクト形式 ({ mon: true, ... }) を配列形式に変換
75:     if (typeof days === 'object' && !Array.isArray(days)) {
76:         const dayRecord = days as Record<string, unknown>;
...
83:         Object.entries(dayMap).forEach(([dbKey, uiKey]) => {
84:             if (dayRecord[dbKey] === true) {
85:                 activeDays.push(uiKey);
86:             }
87:         });
...
109: export function cleansePurgedFields<T>(data: T): T {
...
117:     if (Array.isArray(data)) {
118:         return data.map(item => cleansePurgedFields(item)) as unknown as T;
119:     }
120: 
121:     const cleansed = { ...data } as Record<string, unknown>;
122:     Object.keys(cleansed).forEach(key => {
123:         if (purgedKeys.includes(key)) {
124:             delete cleansed[key];
125:         } else {
126:             const val = cleansed[key];
127:             if (val && typeof val === 'object') {
128:                 cleansed[key] = cleansePurgedFields(val);
129:             }
130:         }
131:     });
```

---

## 4. File: `apps/repaper-route/src/utils/sortUtils.ts` (3 occurrences)

### Occurrence 1 & 2: Line 13
* **Code:** `export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {`
* **Analysis:** `a` and `b` parameters are typed as `any`.
* **Recommendation:**
  * Parameterize `universalSort` using a generic `<T>` and use type casting `as Record<string, unknown>` to retrieve the values at `key`.

### Occurrence 3: Line 45
* **Code:** `function isValidDate(val: any): boolean {`
* **Analysis:** Checks the validity of dates for arbitrary inputs.
* **Recommendation:**
  * Change signature to `val: unknown`. The `typeof val !== 'string'` guard narrows `val` to `string` for the rest of the checks (e.g. `new Date(val)`, `val.includes()`, `val.length`).

#### Refactoring Diff proposal:
```typescript
// BEFORE
13: export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {
14:     const valA = a[key];
15:     const valB = b[key];
...
45: function isValidDate(val: any): boolean {
46:     if (typeof val !== 'string') return false;
47:     // ISO 8601 形式などの基本的なチェック
48:     const date = new Date(val);
49:     return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
50: }

// AFTER
13: export const universalSort = <T>(
14:     a: T, 
15:     b: T, 
16:     key: keyof T & string, 
17:     direction: 'asc' | 'desc'
18: ) => {
19:     const valA = (a as Record<string, unknown>)[key];
20:     const valB = (b as Record<string, unknown>)[key];
...
45: function isValidDate(val: unknown): boolean {
46:     if (typeof val !== 'string') return false;
47:     // ISO 8601 形式などの基本的なチェック
48:     const date = new Date(val);
49:     return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
50: }
```

---

## 5. Non-degradation and Safety Analysis

1. **Compilation-only changes**: TypeScript types are completely erased at compile time. Replacing `any` with generic bounds, `unknown`, or `Record<string, unknown>` does not generate any extra JavaScript code, nor does it affect JS engine performance (V8 JIT compilation).
2. **Type narrowing performance**: Type guards like `typeof` or `instanceof` are extremely cheap standard JavaScript operations.
3. **No logic changes**: The runtime logic, checks, and error handling behaviors remain completely identical, ensuring backward compatibility.
