# BRIEFING — 2026-07-11T08:59:30Z

## Mission
Refactor 2 occurrences of `any` types in useDataSync.ts and fix Challenger 1's reported issues in TBNY DXOS.

## 🔒 My Identity
- Archetype: M4 Implementation Worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_impl_replacement
- Original parent: 2f164ee6-1a6a-4582-8dd4-03480cd60cc9
- Milestone: M4 Refactoring

## 🔒 Key Constraints
- Cast status properly as `BoardJob['status']` instead of `as any`.
- Catch block: catch `err: unknown` and safely extract error message using `err instanceof Error`.
- [TBNY DXOS] Fix plain error object stringification using `getErrorMessage`.
- [TBNY DXOS] Skip corrupt jobs in localData and savedData.
- Verify with `npm run type-check` and `npm run test` in both projects.
- Risk tier T2.

## Current Parent
- Conversation ID: 2f164ee6-1a6a-4582-8dd4-03480cd60cc9
- Updated: not yet

## Task Summary
- **What to build**: Refactor any types in useDataSync.ts (RePaper Route and TBNY DXOS) and fix corrupt job skipping.
- **Success criteria**:
  - `status` properly cast as `BoardJob['status']`.
  - `err` caught as `unknown` and error message extracted via `err instanceof Error`.
  - [TBNY DXOS] Fix plain error object stringification and skip corrupt jobs.
  - Type-checking passes.
  - Tests pass.
- **Interface contracts**: [TBD]
- **Code layout**:
  - apps/repaper-route/src/features/board/hooks/useDataSync.ts
  - src/features/repaper-route/board/hooks/useDataSync.ts

## Key Decisions Made
- Use T2 risk level.
- Fix bugs in both RePaper Route (as requested originally) and TBNY DXOS (as reported by Challenger 1).

## Artifact Index
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_impl_replacement\ORIGINAL_REQUEST.md — Original request log.

## Change Tracker
- **Files modified**:
  - apps/repaper-route/src/features/board/hooks/useDataSync.ts
  - src/features/repaper-route/board/hooks/useDataSync.ts
  - src/features/repaper-route/board/__tests__/useDataSync.test.tsx
- **Build status**: Pass
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (type-check passes, tests pass)
- **Lint status**: Pass
- **Tests added/modified**: Modified `useDataSync.test.tsx` assertions to match correct error mapping and corruption handling.

## Loaded Skills
- [None]
