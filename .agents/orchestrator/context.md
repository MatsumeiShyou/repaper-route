# Context: RePaper Route Strict Typing Refactoring (Resume)

## Core Files to Modify
1. `apps/repaper-route/src/features/board/hooks/useDataSync.ts`
   - Goal: Add `activeDateRef` to prevent state update on stale date fetches. Use React `useRef`. Filter out null/undefined jobs.
2. `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx`
   - Goal: Fix the unused variable `col` on line 139.
3. `apps/repaper-route/src/components/MasterDataLayout.tsx`
   - Goal: Fix all TypeScript errors (25+ errors expected). Cast dynamic keys to safe types (e.g. `as string | number`) and clean up index signature warnings.

## Reference Source
- `c:\Users\shiyo\開発中APP\TBNY DXOS\src\features\repaper-route\board\hooks\useDataSync.ts`
  - Contains reference implementation for `activeDateRef` and job/pending job mapping/filtering code.

## Verification Requirements
- `npm run type-check` (TypeScript type check across the workspaces)
- `npm run test` (Unit tests)
- `npm run done` (GSEAL verification)
