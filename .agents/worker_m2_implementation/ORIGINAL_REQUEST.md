## 2026-07-10T01:36:45Z
You are the M2 Implementation Worker. Your working directory is C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m2_implementation.
Your task is to:
1. Address all Milestone 1 bugs and vulnerabilities identified in the following review and challenger reports:
   - C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m1_challenger_1\challenger_report.md
   - C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m1_reviewer_1\review_report.md
   - C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m1_reviewer_2\review_report.md

   Specifically:
   - PeriodicJobImporter.ts: Fix Nth weekday matching logic for both Object format (check both dayKey and `${dayKey}${nth}`) and Array format (exact match or `${dayKey}${nth}`).
   - nativeFetch.ts: Make localStorage key retrieval robust using length and key() iteration, falling back to Object.keys if needed.
   - serialization.ts:
     - serializeMasterData: If field.type === 'number', serialize as (value === '' || value === null) ? null : Number(value).
     - serializeMasterData: If field.type is boolean/switch, parse boolean from string (value === 'false' ? false : (value === 'true' ? true : !!value)).
     - normalizeDays: Make regex case-insensitive.
     - cleansePurgedFields: Skip cloning Date/RegExp/Map/Set objects, and add WeakSet recursion tracking to prevent stack overflows on circular references.
   - sortUtils.ts:
     - universalSort: Add null/undefined checks for elements a & b at the beginning, and handle NaN elements stably.
     - isValidDate: Support Date objects as val is string | Date.
   - MasterDataLayout.tsx:
     - In PointAccessSection, fetch raw permissions and perform client-side in-memory join mapping using local drivers and vehicles arrays (to resolve Postgrest join bad requests on views).
     - In handleEdit, wrap key parameters in encodeURIComponent.
   - MasterDataContext.tsx:
     - Check Array.isArray(dRes.data) before mapping.

2. Resolve E2E test infra issues:
   - Correct playwright.config.ts projects testDir.
   - Create mock stub apps/repaper-route/src/test/ai/VLMClient.ts.
   - Fix nativeFetch.test.ts localStorage mocking environment (by adding `// @vitest-environment jsdom` or vi.stubGlobal).

3. Refactor all 10 `any` types in Milestone 2 files:
   - src/contexts/AuthProvider.tsx: catch (err: unknown) with Error check.
   - src/contexts/MasterDataContext.tsx: drivers: unknown[], and parameter typing.
   - src/hooks/useMasterCRUD.ts: T extends Record<string, unknown>, and cast (supabase as unknown as { rpc: ... }).
   - src/os/auth/AuthAdapter.ts: new Promise<unknown> or specific type.
   - src/os/auth/types.ts: allowed_apps, details to unknown.

After implementing these changes, verify that the application compiles and passes all unit tests:
1. Run `npm run type-check` (tsc --noEmit) at the root.
2. Run `npm run test` (vitest) to verify all tests pass.
Include output of these commands in your handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Ensure you comply with all rules in AGENTS.md, including declaring the Self-Reflection Gate with risk tier T2, and maintaining progress.md.
