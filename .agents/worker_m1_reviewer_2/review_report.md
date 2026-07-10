# Code Review Report — Milestone 1 (Lib & Utils Refactoring)

## Review Summary

**Verdict**: REQUEST_CHANGES

This review assesses the code changes implemented for Milestone 1. While the overall refactoring of library functions, utilities, and context initialization shows high quality and successfully passes all type-checks (`npm run type-check`) and unit tests (`npm run test`), we identified one critical runtime issue in `MasterDataLayout.tsx` (specifically within `PointAccessSection`) regarding Postgrest joins, along with a few minor robustness improvements in serialization and sorting.

---

## Findings

### [Critical] Finding 1: Postgrest Joins in `PointAccessSection` Will Fail at Runtime

- **What**: The Supabase join query inside `PointAccessSection` tries to fetch staff and vehicle relationships that do not exist at the database foreign key level.
- **Where**: `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\components\MasterDataLayout.tsx` (Lines 986-989)
- **Why**: 
  1. The query joins `profile:staffs(id, name)`. However, `staffs` is a View in the database schema, and `point_access_permissions`'s foreign key `point_access_permissions_driver_id_fkey` references the `profiles` table, not the `staffs` view. Postgrest does not support implicit joins across views without explicit relationships.
  2. The query joins `vehicle:vehicles(id, callsign, number)`. However, the `point_access_permissions` table lacks a foreign key constraint for `vehicle_id` pointing to either `vehicles` (view) or `master_vehicles` (table) in the schema (`types/supabase.ts`).
  This causes Postgrest to reject the query with a `400 Bad Request` ("Could not find a relationship..."), rendering the permissions section completely empty/broken.
- **Suggestion**: Since `PointAccessSection` already fetches the complete lists of `drivers` (from `staffs`) and `vehicles` (from `master_vehicles`) in the same `useEffect`, fetch the raw `point_access_permissions` list without joins and map them on the client side (in-memory join):
  ```typescript
  // Fetch raw permissions without joins
  supabase.from('point_access_permissions')
      .select('*')
      .eq('point_id', pointId).eq('is_active', true)
      .then(({ data }) => setPermissions(data || []));
  ```
  And then resolve the labels in the render loop using the locally fetched `drivers` and `vehicles` lists:
  ```typescript
  const staff = drivers.find(d => d.id === p.driver_id);
  const vehicle = vehicles.find(v => v.id === p.vehicle_id);
  const staffName = staff?.name || p.driver_id;
  const vehicleLabel = vehicle ? `${vehicle.number}（${vehicle.callsign || ''}）` : p.vehicle_id;
  ```

### [Major] Finding 2: `cleansePurgedFields` Corrupts `Date` Objects

- **What**: Passing nested `Date` objects to `cleansePurgedFields` results in data loss.
- **Where**: `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\utils\serialization.ts` (Line 110)
- **Why**: The function recursively traverses objects and shallow-copies them using `const cleansed = { ...data }`. Since `typeof dateObj === 'object'` is true, it attempts to spread a `Date` object, which yields `{}` (losing all date information and prototypes).
- **Suggestion**: Add a type guard at the beginning of the function to return instances of `Date` (and other non-plain objects like `RegExp`) immediately:
  ```typescript
  if (!data || typeof data !== 'object' || data instanceof Date || data instanceof RegExp) return data;
  ```

### [Minor] Finding 3: `isValidDate` in `sortUtils.ts` Does Not Support `Date` Objects

- **What**: `isValidDate` returns `false` if passed a `Date` object directly.
- **Where**: `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\utils\sortUtils.ts` (Line 50)
- **Why**: The function strictly checks `typeof val !== 'string'`. If a `Date` object is passed to `universalSort`, it falls through to the string sorting block (`localeCompare`), comparing strings like `"Fri Jul 10..."` alphabetically.
- **Suggestion**: Add support for `Date` objects:
  ```typescript
  function isValidDate(val: unknown): val is string | Date {
      if (val instanceof Date) return !isNaN(val.getTime());
      if (typeof val !== 'string') return false;
      const date = new Date(val);
      return !isNaN(date.getTime()) && val.includes('-') && (val.length >= 10);
  }
  ```

### [Minor] Finding 4: Unescaped ID Parameter in Deep Fetch

- **What**: `handleEdit` interpolates the primary key directly into the query string without URI encoding.
- **Where**: `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\components\MasterDataLayout.tsx` (Line 179)
- **Why**: If a primary key contains characters that are not URL-safe, the request will fail.
- **Suggestion**: Wrap the primary key value in `encodeURIComponent`:
  ```typescript
  `select=*&${schema.primaryKey}=eq.${encodeURIComponent(item[schema.primaryKey])}`
  ```

---

## Verified Claims

- **Type safety is preserved** → verified via running `npm run type-check` → **PASS** (Zero compilation errors)
- **Unit tests pass successfully** → verified via running `npm run test` → **PASS** (33/33 tests passed, covering serialization, sorting, native fetch, and job importer)
- **PeriodicJobImporter filters points by date & recurrence** → verified via `PeriodicJobImporter.test.ts` → **PASS**
- **universalSort correctly handles numbers, booleans, dates, and null/undefined values** → verified via `sortUtils.test.ts` → **PASS** (Nulls are always sorted to the end regardless of direction)
- **cleansePurgedFields removes blacklisted keys** → verified via `serialization.test.ts` → **PASS**

---

## Coverage Gaps

- **PointAccessSection runtime execution** — Risk level: **High** — Recommendation: **Investigate and apply suggestion in Finding 1**. The lack of foreign key constraints on the view/table prevents Postgrest join syntax from succeeding.
- **Date objects in serialization/cleansation** — Risk level: **Medium** — Recommendation: **Investigate and apply suggestion in Finding 2**.

---

## Unverified Items

- **Real Database Integration for PointAccessSection** — Reason not verified: Database connection is not available in current environment; analyzed statically through schema files (`types/supabase.ts`) and code patterns.
