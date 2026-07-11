# Handoff Report — worker_m4_challenger_1

## 1. Observation

During our empirical verification, we ran compilation checks and vitest suites for Milestone 4. We observed the following:

- **Compilation Failure in `MasterDataLayout.tsx`**:
  Running `npm run type-check` in `apps/repaper-route` failed with 25+ errors:
  ```
  src/components/MasterDataLayout.tsx(400,41): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
  src/components/MasterDataLayout.tsx(437,25): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
  src/components/MasterDataLayout.tsx(441,68): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number'.
  src/components/MasterDataLayout.tsx(507,25): error TS2322: Type '{}' is not assignable to type 'ReactNode'.
  ...
  ```

- **Race Condition Vulnerability in `useDataSync.ts`**:
  Running `npx vitest run src/features/board/hooks/useDataSync.test.tsx` isolated test suite consistently fails the race condition test:
  ```
  FAIL  src/features/board/hooks/useDataSync.test.tsx > useDataSync Empirical Verification & Stress Tests > should trigger race condition when dateKey changes rapidly without cleanup
  AssertionError: expected 'Date 11 Job' to be 'Date 12 Job' // Object.is equality

  Expected: "Date 12 Job"
  Received: "Date 11 Job"
  ```

- **TypeError on Corrupt Payload in `useDataSync.ts`**:
  During the corrupt payload unit test, the hook throws a TypeScript TypeError which leaks to the user:
  ```
  Data sync error: TypeError: Cannot read properties of null (reading 'id')
      at C:/Users/shiyo/開発中APP/RePaper Route/apps/repaper-route/src/features/board/hooks/useDataSync.ts:59:23
      at Array.map (<anonymous>)
  ```

---

## 2. Logic Chain

1. **Build Failure**:
   - The type-check errors in `MasterDataLayout.tsx` stem from indexing a `Record<string, unknown>` type with string keys (`item[schema.primaryKey]`) which yields `unknown`. React 19 does not accept `unknown` as a valid component `key`.
   - This directly prevents the project from compiling, causing `npm run build` and `npm run type-check` to fail.

2. **State Overwrite via Race Condition**:
   - `useDataSync.ts` does not handle cleanup or request cancellation in its `useEffect` hook.
   - When the hook receives a new `dateKey` before the previous asynchronous query resolves, the previous query continues executing in the background.
   - When the stale query resolves, it invokes `setData` with outdated data, overwriting the newer state. The failing vitest assertion proves this vulnerability.

3. **Data Mapping Failures**:
   - In `useDataSync.ts`, the mapping logic `(jobsData || []).map(j => ({ id: j.id, ... }))` assumes that all elements returned in `jobsData` are non-null.
   - If a `null` row exists, indexing `j.id` throws a TypeError. While caught inside the try-catch block, this prevents the loading of *all* other valid jobs on the board and exposes raw JS errors on the UI.

---

## 3. Caveats

- **Scope of Review**: We only performed code reviews and test executions. In line with the `Review-only` constraint, we did not modify any source code to fix these bugs.
- **Realtime Subscriptions**: Realtime database event subscriptions were not verified because they are not currently implemented in `useDataSync.ts`.

---

## 4. Conclusion

The Milestone 4 changes contain critical bugs and compiler regressions. The codebase fails to compile due to type assignment mismatches in `MasterDataLayout.tsx`. Additionally, `useDataSync.ts` is vulnerable to date-switching race conditions (causing stale data to overwrite current data) and crashes (failing to load any data and leaking TypeErrors) when the database payload contains `null` rows. These issues must be resolved before merging the Milestone 4 changes.

---

## 5. Verification Method

To independently verify these findings, run the following commands in `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\`:

1. **Verify Build Regression**:
   ```powershell
   npm run type-check
   ```
   *Expected result*: Compiling fails with TS2322/TS2345 errors in `MasterDataLayout.tsx`.

2. **Verify Hook Vulnerabilities**:
   ```powershell
   npx vitest run src/features/board/hooks/useDataSync.test.tsx
   ```
   *Expected result*: The suite runs, exposing the TypeError log from the null payload mapping, and fails the race condition test (`expected 'Date 11 Job' to be 'Date 12 Job'`).
