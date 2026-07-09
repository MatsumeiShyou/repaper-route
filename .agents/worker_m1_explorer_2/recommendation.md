# Milestone 1: Lib & Utils Refactoring - Type Safety Recommendation

This document provides refactoring strategies and concrete recommendations to replace the 14 occurrences of `any` types with strict types in the following 4 files:
- `apps/repaper-route/src/lib/PeriodicJobImporter.ts` (1 occurrence)
- `apps/repaper-route/src/lib/supabase/nativeFetch.ts` (3 occurrences)
- `apps/repaper-route/src/utils/serialization.ts` (7 occurrences)
- `apps/repaper-route/src/utils/sortUtils.ts` (3 occurrences)

---

## 1. apps/repaper-route/src/lib/PeriodicJobImporter.ts (1 occurrence)

### Occurrence 1: Line 38
- **Code:** `const collectionDays = p.collection_days as any;`
- **Analysis:** `p.collection_days` is fetched from Supabase and is typed as `Json | null` in database row type definition. By using `as any`, the code bypasses type checks to handle both array and object structures.
- **Refactoring Strategy:** Cast `p.collection_days` as `unknown` and use TypeScript narrowing. Since `Array.isArray()` and `typeof` are used, casting to `unknown` and then narrowing with proper types ensures compile-time safety.

#### Recommended Refactoring:
##### Before:
```typescript
const collectionDays = p.collection_days as any;
if (!collectionDays) return false;

let isDayMatch = false;

if (Array.isArray(collectionDays)) {
    isDayMatch = collectionDays.some(d => 
        typeof d === 'string' && d.toLowerCase().startsWith(dayKey)
    );
} else if (typeof collectionDays === 'object') {
    isDayMatch = !!collectionDays[dayKey];
}
```

##### After:
```typescript
const collectionDays = p.collection_days as unknown;
if (!collectionDays) return false;

let isDayMatch = false;

if (Array.isArray(collectionDays)) {
    // Array.isArray narrows collectionDays to unknown[]
    isDayMatch = collectionDays.some(d => 
        typeof d === 'string' && d.toLowerCase().startsWith(dayKey)
    );
} else if (typeof collectionDays === 'object') {
    // Cast to indexable Record type since it's confirmed to be an object (and non-null because of the falsy check)
    isDayMatch = !!(collectionDays as Record<string, unknown>)[dayKey];
}
```

---

## 2. apps/repaper-route/src/lib/supabase/nativeFetch.ts (3 occurrences)

### Occurrence 2: Line 5
- **Code:** `export async function nativeSupabaseFetch<T = any>(`
- **Analysis:** Default generic type parameter is set to `any`.
- **Refactoring Strategy:** Change the default parameter type from `any` to `unknown`. This forces callers of `nativeSupabaseFetch` to either specify the generic type parameter or handle the return type as `unknown`, promoting overall type safety.

### Occurrence 3: Line 9
- **Code:** `body?: any`
- **Analysis:** The `body` parameter passed to the fetch payload is typed as `any`.
- **Refactoring Strategy:** Change `body?: any` to `body?: unknown`. `JSON.stringify` accepts `unknown` (since any is compatible with it) and it prevents arbitrary usage inside the fetch helper.

### Occurrence 4: Line 84
- **Code:** `} catch (fetchErr: any) {`
- **Analysis:** The `fetchErr` variable inside the catch block is typed as `any`.
- **Refactoring Strategy:** Under modern TypeScript standards, caught exceptions should be typed as `unknown` (or omit the type parameter entirely). We can safe-guard the message access using a type guard or check `instanceof Error`.

#### Recommended Refactoring:
##### Before:
```typescript
export async function nativeSupabaseFetch<T = any>(
    table: string, 
    queryParams: string = 'select=*', 
    method: NativeFetchMethod = 'GET',
    body?: any
) {
    // ...
    try {
        // ...
        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }
        // ...
    } catch (fetchErr: any) {
        console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
        return { data: null, error: { message: fetchErr.message, status: 0 } };
    }
}
```

##### After:
```typescript
export async function nativeSupabaseFetch<T = unknown>(
    table: string, 
    queryParams: string = 'select=*', 
    method: NativeFetchMethod = 'GET',
    body?: unknown
) {
    // ...
    try {
        // ...
        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }
        // ...
    } catch (fetchErr: unknown) {
        console.error(`[nativeSupabaseFetch] <<< NETWORK ERROR on ${table}:`, fetchErr);
        const errorMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        return { data: null, error: { message: errorMessage, status: 0 } };
    }
}
```
*Note: Existing callers should be updated to explicitly pass the type parameter to `nativeSupabaseFetch` (e.g., `nativeSupabaseFetch<MasterPoint[]>(...)`) to prevent compile-time type-safety errors on the returned `data`.*

---

## 3. apps/repaper-route/src/utils/serialization.ts (7 occurrences)

### Occurrence 5: Line 6
- **Code:** `export function serializeMasterData<T extends Record<string, any>>(`
- **Analysis:** Generic constraint of `T` uses `any` for dictionary values.
- **Refactoring Strategy:** Change `Record<string, any>` to `Record<string, unknown>`.

### Occurrence 6: Line 10
- **Code:** `): any {` (Return type of `serializeMasterData`)
- **Analysis:** The return type is defined as `any`.
- **Refactoring Strategy:** Change the return type to `Record<string, unknown>` since it returns a serialized object representation of form fields.

### Occurrence 7: Line 11
- **Code:** `const serialized: any = {};`
- **Analysis:** The internal accumulator is initialized as `any`.
- **Refactoring Strategy:** Initialize it as `Record<string, unknown>`.

### Occurrence 8: Line 71
- **Code:** `export function normalizeDays(days: any): string[] {`
- **Analysis:** The input parameter `days` can be a database JSON object, array of strings, or comma-separated string, so it's typed as `any`.
- **Refactoring Strategy:** Change `days: any` to `days: unknown` and use runtime narrowing.

### Occurrence 9: Line 84
- **Code:** `if ((days as any)[dbKey] === true) {`
- **Analysis:** Index signature access is cast to `any`.
- **Refactoring Strategy:** Cast `days` to `Record<string, unknown>` since we already checked that `typeof days === 'object' && days !== null`.

### Occurrence 10: Line 118
- **Code:** `return data.map(item => cleansePurgedFields(item)) as any;`
- **Analysis:** The map result is cast to `any` because `data` is typed as generic `T`.
- **Refactoring Strategy:** Cast the map result to `unknown as T` to satisfy the return type safely.

### Occurrence 11: Line 121
- **Code:** `const cleansed = { ...data } as any;`
- **Analysis:** The copy of `data` is cast to `any` to allow mutating and deleting keys dynamically.
- **Refactoring Strategy:** Cast to `Record<string, unknown>` instead of `any`, and cast to `unknown as T` before returning.

#### Recommended Refactoring:
##### Before:
```typescript
export function serializeMasterData<T extends Record<string, any>>(
    formData: Partial<T>,
    fields: MasterField[],
    _rpcTableName: string
): any {
    const serialized: any = {};

    fields.forEach(field => {
        const value = formData[field.name as keyof T];
        if (value === undefined) return;

        // ...
        } else if (field.type === 'days' || Array.isArray(value)) {
            if (Array.isArray(value)) {
                // ...
                value.forEach((uiKey: string) => {
                    // ...
                });
                serialized[field.name] = obj;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                serialized[field.name] = value;
            } else {
                serialized[field.name] = value;
            }
        } else {
            serialized[field.name] = value;
        }
    });

    return serialized;
}

export function normalizeDays(days: any): string[] {
    if (!days) return [];

    if (typeof days === 'object' && !Array.isArray(days)) {
        // ...
        Object.entries(dayMap).forEach(([dbKey, uiKey]) => {
            if ((days as any)[dbKey] === true) {
                activeDays.push(uiKey);
            }
        });

        Object.entries(days).forEach(([key, value]) => {
            if (value === true && /^[a-z]{3}[1-5]$/.test(key)) {
                const uiKey = key.charAt(0).toUpperCase() + key.slice(1);
                activeDays.push(uiKey);
            }
        });

        return activeDays;
    }

    if (Array.isArray(days)) return days.map(String).filter(s => s !== 'undefined' && s !== 'null');
    if (typeof days === 'string' && days.trim() !== '') return days.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

export function cleansePurgedFields<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;
    // ...
    if (Array.isArray(data)) {
        return data.map(item => cleansePurgedFields(item)) as any;
    }

    const cleansed = { ...data } as any;
    Object.keys(cleansed).forEach(key => {
        if (purgedKeys.includes(key)) {
            delete cleansed[key];
        } else if (typeof cleansed[key] === 'object') {
            cleansed[key] = cleansePurgedFields(cleansed[key]);
        }
    });

    return cleansed;
}
```

##### After:
```typescript
export function serializeMasterData<T extends Record<string, unknown>>(
    formData: Partial<T>,
    fields: MasterField[],
    _rpcTableName: string
): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    fields.forEach(field => {
        const value = formData[field.name as keyof T];
        if (value === undefined) return;

        // 型に応じた変換
        if (field.type === 'number') {
            serialized[field.name] = value === '' ? null : Number(value);
        } else if (value === '') {
            serialized[field.name] = '';
        } else if (field.type === 'switch' || field.type === 'boolean') {
            serialized[field.name] = !!value;
        } else if (field.type === 'days' || Array.isArray(value)) {
            if (Array.isArray(value)) {
                const dayMap: Record<string, string> = {
                    Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun',
                    Hol: 'hol', Oth: 'oth'
                };
                const obj: Record<string, boolean> = {};
                
                Object.values(dayMap).forEach(key => {
                    obj[key] = false;
                });

                (value as unknown[]).forEach((item) => {
                    const uiKey = String(item);
                    const dbKey = dayMap[uiKey];
                    if (dbKey) {
                        obj[dbKey] = true;
                    } else if (/^[A-Z][a-z]{2}[1-5]$/.test(uiKey)) {
                        const lowerKey = uiKey.charAt(0).toLowerCase() + uiKey.slice(1);
                        obj[lowerKey] = true;
                    }
                });
                serialized[field.name] = obj;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                serialized[field.name] = value;
            } else {
                serialized[field.name] = value;
            }
        } else {
            serialized[field.name] = value;
        }
    });

    return serialized;
}

export function normalizeDays(days: unknown): string[] {
    if (!days) return [];

    if (typeof days === 'object' && !Array.isArray(days)) {
        const dayMap: Record<string, string> = {
            mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
            hol: 'Hol', oth: 'Oth'
        };
        const activeDays: string[] = [];

        const daysRecord = days as Record<string, unknown>;

        Object.entries(dayMap).forEach(([dbKey, uiKey]) => {
            if (daysRecord[dbKey] === true) {
                activeDays.push(uiKey);
            }
        });

        Object.entries(daysRecord).forEach(([key, value]) => {
            if (value === true && /^[a-z]{3}[1-5]$/.test(key)) {
                const uiKey = key.charAt(0).toUpperCase() + key.slice(1);
                activeDays.push(uiKey);
            }
        });

        return activeDays;
    }

    if (Array.isArray(days)) return days.map(String).filter(s => s !== 'undefined' && s !== 'null');
    if (typeof days === 'string' && days.trim() !== '') return days.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

export function cleansePurgedFields<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;

    const purgedKeys = [
        'is_spot', 'is_spot_only', 'special_type', 
        'time_constraint_type', 'is_template', 'applied_template_id'
    ];

    if (Array.isArray(data)) {
        return data.map(item => cleansePurgedFields(item)) as unknown as T;
    }

    const cleansed = { ...data } as Record<string, unknown>;
    Object.keys(cleansed).forEach(key => {
        if (purgedKeys.includes(key)) {
            delete cleansed[key];
        } else if (cleansed[key] && typeof cleansed[key] === 'object') {
            cleansed[key] = cleansePurgedFields(cleansed[key]);
        }
    });

    return cleansed as unknown as T;
}
```

---

## 4. apps/repaper-route/src/utils/sortUtils.ts (3 occurrences)

### Occurrences 12 & 13: Line 13
- **Code:** `export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {`
- **Analysis:** `a` and `b` parameters are typed as `any`.
- **Refactoring Strategy:** Type `a` and `b` as `Record<string, unknown>` to allow safe indexing of properties using `key` while maintaining universal comparison capability.

### Occurrence 14: Line 45
- **Code:** `function isValidDate(val: any): boolean {`
- **Analysis:** `val` is typed as `any`.
- **Refactoring Strategy:** Type `val` as `unknown`. Since it validates that `val` is a string, checking `typeof val !== 'string'` narrows it to `string` in TypeScript for the remainder of the function.

#### Recommended Refactoring:
##### Before:
```typescript
export const universalSort = (a: any, b: any, key: string, direction: 'asc' | 'desc') => {
    const valA = a[key];
    const valB = b[key];
    // ...
};

function isValidDate(val: any): boolean {
    if (typeof val !== 'string') return false;
    const date = new Date(val);
    return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
}
```

##### After:
```typescript
export const universalSort = (
    a: Record<string, unknown>, 
    b: Record<string, unknown>, 
    key: string, 
    direction: 'asc' | 'desc'
) => {
    const valA = a[key];
    const valB = b[key];

    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    let comparison = 0;

    if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
    } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : valA ? -1 : 1;
    } else if (isValidDate(valA) && isValidDate(valB)) {
        comparison = new Date(valA as string | number | Date).getTime() - new Date(valB as string | number | Date).getTime();
    } else {
        comparison = String(valA).localeCompare(String(valB), 'ja', {
            numeric: true,
            sensitivity: 'base',
        });
    }

    return direction === 'asc' ? comparison : -comparison;
};

function isValidDate(val: unknown): boolean {
    if (typeof val !== 'string') return false;
    const date = new Date(val);
    return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
}
```
*Note: In `new Date(valA)`, because `valA` is `unknown` but checked to be a valid date string via `isValidDate(valA)`, casting it to `string | number | Date` (or `string`) ensures the `Date` constructor is satisfied without compilation errors.*

---

## 5. Verification Plan (No Runtime Degradation)

To verify the changes:
1. **Type checking:** Run `npm run type-check` (or compile TSC) to ensure no compile-time errors in the updated files and their dependencies.
2. **Unit Tests:** Run existing tests for these helper utilities:
   - Run vitest/jest commands if available (e.g. `npm run test` or `npx vitest apps/repaper-route/src/utils/holidayUtils.test.ts` etc. or any utility test suites).
3. **Application Verification:** Ensure that sorting table columns (which uses `universalSort`), master data CRUD saving (which uses `serializeMasterData` and `cleansePurgedFields`), and daily import operations still execute correctly and behave identically.
