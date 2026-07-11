# Milestone 2 & Milestone 1 Bug Fixes - Review Report

## Review Summary

**Verdict**: APPROVE

This review covers the code changes implemented for Milestone 2 (OS, Contexts & Hooks refactoring) and the bugs fixes for Milestone 1.
All 72 unit tests across 7 test files pass successfully (`npm run test`), and type-checking succeeds without compilation errors (`npm run type-check`). The codebase demonstrates strong type safety, defensive handling of edge cases, and compliance with the Sanctuary Governance Constitution (AGENTS.md).

---

## 1. Quality Review Report

### Findings

#### [Minor] Finding 1: Redundant Double Serialization in Master Save Flow
- **What**: In the master data save flow, data serialization (`serializeMasterData`) is called twice.
- **Where**: `apps/repaper-route/src/components/MasterDataLayout.tsx` (line 207) and `apps/repaper-route/src/hooks/useMasterCRUD.ts` (lines 50 & 81).
- **Why**: `MasterDataLayout.tsx` calls `serializeMasterData` before passing the form data to `createItem` or `updateItem`. Within `useMasterCRUD.ts`, these functions call `serializeMasterData` again on the already-serialized object.
- **Suggestion**: The implementation is safe because `serializeMasterData` is idempotent (it checks if days field is already an object and leaves other fields like numbers and booleans as is). However, to clean up redundant calls, `MasterDataLayout.tsx` could pass the raw form data directly to `useMasterCRUD` methods, leaving serialization exclusively to the hook.

#### [Minor] Finding 2: Lack of Strict Typing for Driver in MasterDataContext
- **What**: The `drivers` array is typed as `unknown[]` in `MasterData`.
- **Where**: `apps/repaper-route/src/contexts/MasterDataContext.tsx` (line 6).
- **Why**: While type casting and property normalization (`defaultCourse`, `defaultVehicle`) are done safely in `fetchAll` (line 42), downstream consumers of `drivers` do not benefit from type autocomplete or compile-time checks for Driver structures.
- **Suggestion**: Define a strict `MasterDriver` type and replace `unknown[]` with `MasterDriver[]` once the Driver schema becomes fully stable.

---

### Verified Claims

- **Claim 1**: All unit tests pass successfully.
  - *Method*: Ran `npx vitest run` in the `apps/repaper-route` directory.
  - *Result*: PASS (72/72 tests passed).
- **Claim 2**: TypeScript compilation and type-checking succeed.
  - *Method*: Ran `npm run type-check` (executes `tsc --noEmit`).
  - *Result*: PASS (No errors).
- **Claim 3**: `PeriodicJobImporter.ts` handles null `collection_days` and non-digit recurrence patterns.
  - *Method*: Inspected code and verified through `PeriodicJobImporter.test.ts`.
  - *Result*: PASS (Null values are safely bypassed; regex `\d+` correctly extracts week numbers from string patterns like `"第3月曜日"`).
- **Claim 4**: `nativeFetch.ts` avoids crashing on HTTP 204 and extracts tokens from storage.
  - *Method*: Checked fetch response handling for status 204 and localStorage query loop.
  - *Result*: PASS (Successfully returns `null` for 204 and handles token retrieval defensively).

---

### Coverage Gaps

- **IndexedDB / Offline Cache Recovery**: The fallback behavior of using IndexedDB cached credentials when Supabase is slow/offline is mock-verified but has not been stress-tested in a real-world network partition.
  - *Risk Level*: Low
  - *Recommendation*: Accept risk for this milestone; consider manual offline verification in future QA.

---

## 2. Adversarial Review Report

**Overall Risk Assessment**: LOW

The code changes are robustly guarded against adversarial inputs, empty states, and database discrepancies. Defensive checks are consistently applied.

### Challenges

#### [Medium] Challenge 1: LocalStorage Token Tampering
- **Assumption challenged**: The system assumes that the token extracted from `localStorage` is valid and well-formed.
- **Attack scenario**: An attacker or corrupted client script modifies the token in `localStorage` to be invalid JSON, or alters keys to crash JSON parsing.
- **Blast radius**: The parsing is wrapped in a try-catch block inside `nativeSupabaseFetch` (lines 17-47), logging a warning and falling back to `supabase.auth.getSession()`.
- **Mitigation**: The current code handles this perfectly; no further mitigation is needed.

#### [Low] Challenge 2: NaN and Mixed-Type Sorting
- **Assumption challenged**: Items sorted in the Master Data list always have uniform types and valid numeric values.
- **Attack scenario**: A user inserts `NaN` or mixes string and number representations in columns that undergo sorting.
- **Blast radius**: `universalSort` handles `NaN` stably by placing it at the end of the list. Mixed types fall back to natural Japanese-aware string comparison (`localeCompare` with `numeric: true`).
- **Mitigation**: Robustly mitigated by `sortUtils.ts`.

#### [Low] Challenge 3: AbortError on Fast Route Switching
- **Assumption challenged**: Auth resolution from Supabase sessions always returns before the component unmounts.
- **Attack scenario**: Rapid page reloads or swift logging in/out triggers parallel auth resolution calls.
- **Blast radius**: Solved by the mutex ref `isResolving` in `AuthProvider.tsx` and cancellation tokens in the adapter cache.
- **Mitigation**: The current implementation prevents concurrent fetch issues.

---

### Stress Test Results

- **Extreme Sorting Scenarios**:
  - `[{val: 10}, {val: NaN}, {val: 5}]` -> Sorted safely using `universalSort` -> PASS.
  - `[{val: 'banana'}, {val: 10}, {val: true}]` -> Sorted using localeCompare string fallback without crashes -> PASS.
- **Circular Reference Data Cleanse**:
  - Cleansing an object with cyclic references `obj.self = obj` -> Does not throw `RangeError: Maximum call stack size exceeded` -> PASS.
- **Empty / Null Input Serialization**:
  - Empty string for numeric properties is parsed into `null` -> PASS.
