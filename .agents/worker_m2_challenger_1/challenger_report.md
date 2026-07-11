# Challenger Report - Milestone 2 & Milestone 1 Verification

## Challenge Summary

**Overall risk assessment**: MEDIUM

- Unit tests pass rate: 100% (91 of 91 tests passed).
- Build compilation check: SUCCESS (`npm run type-check` outputs zero errors).
- Although the overall refactoring has made the codebase significantly more robust and type-safe, two vulnerabilities/bugs were detected during the adversarial stress testing.

---

## Challenges

### [Medium] Challenge 1: PostgrestError Conversion Bug in `useMasterCRUD.ts`

- **Assumption challenged**: Assumes `err instanceof Error ? err : new Error(String(err))` correctly handles and stringifies all error objects caught in the hook.
- **Attack scenario**: Supabase database RPC returns plain objects (`PostgrestError` shape) instead of JS `Error` instances. The catch block checks `err instanceof Error`, which resolves to `false`, and falls back to `new Error(String(err))`. Stringifying a plain object results in `new Error("[object Object]")`.
- **Blast radius**: The user interface displays a generic `[object Object]` error message to administrative users instead of the actual user-friendly database message (e.g., "Database constraint failed due to lock conflict"), causing severe confusion and making diagnostics hard.
- **Mitigation**: Update `useMasterCRUD.ts` to inspect the error object shape:
  ```typescript
  setError(
      err instanceof Error 
          ? err 
          : new Error(typeof err === 'object' && err !== null && 'message' in err 
              ? String((err as any).message) 
              : String(err))
  );
  ```

### [Medium] Challenge 2: Missing Array Validation in `MasterDataContext.tsx`

- **Assumption challenged**: Assumes that `nativeSupabaseFetch` for master data endpoints (vehicles, master_collection_points, master_items, customer_item_defaults) always returns an array or null.
- **Attack scenario**: If a database view fails or permissions are corrupted, the payload may return a non-array value (e.g., a string or custom error structure).
- **Blast radius**: Since `MasterDataContext.tsx` directly maps the fields: `customers: (cRes.data || []) as MasterCustomer[]` without checking if they are arrays, a malformed string or object returned in `data` will be stored directly as the value of `customers`, causing subsequent UI rendering loops or `.map()` crashes in frontend components reading the context.
- **Mitigation**: Validate using `Array.isArray()` before assigning data to the states. E.g.:
  ```typescript
  setData({
      drivers: processedDrivers,
      vehicles: (Array.isArray(vRes.data) ? vRes.data : []) as MasterVehicle[],
      customers: (Array.isArray(cRes.data) ? cRes.data : []) as MasterCustomer[],
      items: (Array.isArray(iRes.data) ? iRes.data : []) as MasterItem[],
      customerItemDefaults: (Array.isArray(cidRes.data) ? cidRes.data : []) as unknown as CustomerItemDefault[]
  });
  ```

### [Low] Challenge 3: Timeout Promise Leak and Uncaught Promise Rejection Warning in `AuthAdapter`

- **Assumption challenged**: Assumes that `Promise.race` cleans up all race conditions.
- **Attack scenario**: If `fetch` hangs, the `timeoutPromise` rejects after 15 seconds. If the fetch resolves or rejects *after* the timeout fires, or if `Promise.race` rejects, `timeoutPromise` is still a rejected promise without a direct `.catch()` handler attached to it.
- **Blast radius**: In some JS environments, this can trigger a `PromiseRejectionHandledWarning` or uncaught rejection warning, potentially polluting logs or causing server-side rendering processes to exit.
- **Mitigation**: Attach a dummy `.catch(() => {})` handler directly to `timeoutPromise` or handle clean-ups explicitly.

---

## Stress Test Results

- **Garbage Token JSON Parsing** → `localStorage` has invalid token → Fallback to `getSession` completes successfully and fails safely without crash → **PASS**
- **Offline Cache Recovery** → Server is offline (native fetch fails) → Falls back to IndexedDB cache (`recoverFromCache`) successfully → **PASS**
- **Allowed Apps Validation** → User tries to log in without `repaper-route` in `allowed_apps` → Correctly throws `AppAccessDeniedError` → **PASS**
- **Database Fetch Hang (15s Timeout)** → Mock fetch hangs indefinitely → Triggers `TIMEOUT_DB_FETCH` error and signs out cleanly → **PASS**
- **MasterDataContext Null/Error Payload** → Master data fetch returns null or API errors → State falls back to empty arrays safely without hanging or crashing → **PASS** (Note: A bug was found here; the context currently maps non-array values directly to state without fallback unless they are null/undefined).
- **MasterDataContext Casing Mapping** → Driver data payload has casing variations (`default_course` vs `defaultCourse`) → Maps properties safely on the client → **PASS**
- **useMasterCRUD Required Field Validation** → `createItem` called with missing required fields → Throws a validation error successfully before calling RPC → **PASS**
- **useMasterCRUD Read-only Field Filtering** → `updateItem` called with read-only fields → Read-only fields are safely filtered out of serialization → **PASS**
- **useMasterCRUD RPC Failure Error State** → RPC call fails with constraint error → Hook catches error, sets it, and throws it → **PASS** (Exposed the PostgrestError `[object Object]` bug).

---

## Unchallenged Areas

- **Supabase Realtime Synchronization** — Realtime database sync features rely on live WebSockets which cannot be fully simulated in micro-unit tests without a running Supabase container.
