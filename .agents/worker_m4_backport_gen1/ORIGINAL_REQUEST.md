## 2026-07-11T14:09:51Z
You are the teamwork_preview_worker (Milestone 4 Implementation Worker).
Your working directory is: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1
The main project directory is: C:\Users\shiyo\開発中APP\RePaper Route

Please perform the following tasks:

1. Fix `useDataSync.ts` in `apps/repaper-route/src/features/board/hooks/useDataSync.ts`:
   - Backport race-condition protection `activeDateRef` (using React `useRef`) and corrupt job skipping logic from the TBNY DXOS version of the file (`C:\Users\shiyo\開発中APP\TBNY DXOS\src\features\repaper-route\board\hooks\useDataSync.ts`).
   - Specifically:
     - Initialize `activeDateRef = useRef(dateKey);` and update it in a `useEffect` when `dateKey` changes.
     - Inside `fetchData`, check `if (dateKey !== activeDateRef.current) return;` at appropriate asynchronous resolution points to discard stale results.
     - Wrap mapping/processing in try-catch blocks and filter using `.filter(Boolean)` and `.filter((j): j is BoardJob => j !== null)` so corrupt/null entries from the database are skipped instead of crashing the hook.
     - Eliminate any `any` type casts or other issues.

2. Fix `useDataSync.test.tsx` in `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx`:
   - Fix the unused variable compiler error `col` on line 139 (change to `_col` or remove).
   - Adapt the corrupt database payload test case (`should crash or fail to load data when corrupt database payload contains null elements in jobs`) to verify the new self-healing (job skipping) behavior instead of asserting that the hook fails. The test should assert:
     - `result.current.error` is `null`
     - `result.current.data` is not `null`
     - `result.current.data.jobs` has length 1 (only the valid job is mapped, the null one is skipped).

3. Fix `MasterDataLayout.tsx` in `apps/repaper-route/src/components/MasterDataLayout.tsx`:
   - Run compilation checks (`npm run type-check`) to identify all TypeScript compiler errors in this file (there are about 25+ errors).
   - Resolve all type errors in this file. (Common errors include indexing warnings and dynamic keys; cast dynamic keys to React component safe keys like `as string | number`).

4. Verify your changes:
   - Run `npm run type-check` to confirm the entire project builds without TypeScript errors.
   - Run `npm run test` to confirm all unit and stress tests (including `useDataSync.test.tsx`) pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write your progress checkpoints in `C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\progress.md` and deliver your final findings and verification outputs in `C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\handoff.md`.
Once finished, send a message to the orchestrator (conversation ID: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb) reporting your completion.
