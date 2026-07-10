# Handoff Report — Milestone 1 (Lib & Utils Refactoring) Review

## 1. Observation

- **Reviewed files**:
  1. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\lib\PeriodicJobImporter.ts`
  2. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\lib\supabase\nativeFetch.ts`
  3. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\utils\serialization.ts`
  4. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\utils\sortUtils.ts`
  5. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\components\MasterDataLayout.tsx`
  6. `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\contexts\MasterDataContext.tsx`
- **Execution Results**:
  - `npm run type-check` succeeded with exit code 0 (no errors).
  - `npm run test` succeeded with exit code 0:
    ```
    Test Files  5 passed (5)
         Tests  33 passed (33)
    ```
- **Code Patterns**:
  - In `MasterDataLayout.tsx` lines 986-989:
    ```typescript
    supabase.from('point_access_permissions')
        .select('*, profile:staffs(id, name), vehicle:vehicles(id, callsign, number)')
        .eq('point_id', pointId).eq('is_active', true)
    ```
  - In `types/supabase.ts` lines 992-1043:
    ```typescript
          point_access_permissions: {
            Row: { ... }
            Relationships: [
              {
                foreignKeyName: "point_access_permissions_driver_id_fkey"
                referencedRelation: "profiles"
                ...
              },
              ...
            ]
          }
    ```
    There is no relationship referencing table/view `staffs` or `vehicles` under `point_access_permissions`'s relationships. `staffs` (line 1263) and `vehicles` (line 1301) are defined under `Views: {`.
  - In `serialization.ts` line 110:
    ```typescript
    export function cleansePurgedFields<T>(data: T): T {
        if (!data || typeof data !== 'object') return data;
        ...
        const cleansed = { ...data } as Record<string, unknown>;
        ...
    ```

---

## 2. Logic Chain

1. **Postgrest Joins Constraint**: Supabase/Postgrest requires explicit foreign key constraints in the database to execute join queries (e.g. `profile:staffs(...)`, `vehicle:vehicles(...)`).
2. **Missing Foreign Keys on Views**: In Postgres/Supabase, views (`staffs`, `vehicles`) cannot have foreign key constraints referencing them. The actual foreign key for `driver_id` in the schema points to the `profiles` table. The column `vehicle_id` has no foreign key constraint at all in the schema.
3. **Query Failure**: Because Postgrest cannot find matching relationships from `point_access_permissions` to views `staffs` or `vehicles`, the query `.select('*, profile:staffs(...), vehicle:vehicles(...)')` will return a `400 Bad Request` at runtime.
4. **UI Failure**: This runtime error results in the "入場制限設定" (Point Access Section) showing no rules even if rules exist, which is a critical functionality failure.
5. **Serialization Bug**: If a `Date` object is passed into `cleansePurgedFields`, since `typeof DateInstance === 'object'` is true, it is spread as a plain object `{ ...DateInstance }`, resulting in `{}`. This strips all date features and corrupts data.

---

## 3. Caveats

- We did not connect to the live Supabase instance since we are operating in CODE_ONLY network mode and have no database credentials. However, the schema file `types/supabase.ts` is generated from the database by Supabase CLI and serves as the Single Source of Truth for database relationships.

---

## 4. Conclusion

The verdict is **REQUEST_CHANGES**. The implementation of Milestone 1 has one Critical runtime bug in the component level (`MasterDataLayout.tsx` joining views without database foreign keys) and a few minor robustness risks. We recommend changing `PointAccessSection` to fetch permissions without joins, and perform the mapping/lookup on the client-side.

---

## 5. Verification Method

- **Type check command**: Run `npm run type-check` (Must succeed).
- **Test execution command**: Run `npm run test` or `npx vitest` (Must succeed).
- **Inspecting fix for Finding 1**: Ensure that `PointAccessSection` query in `MasterDataLayout.tsx` no longer attempts to join `staffs` or `vehicles` through Postgrest, or that the database relationships are successfully mocked or client-side joined.
- **Inspecting fix for Finding 2**: Ensure that `cleansePurgedFields` in `serialization.ts` correctly handles `Date` and `RegExp` objects by returning them immediately.
