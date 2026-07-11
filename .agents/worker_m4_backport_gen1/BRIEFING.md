# BRIEFING — 2026-07-11T23:09:51+09:00

## Mission
Backport hook changes for race-condition and data corruption protection, fix unused variables and corrupt data test in useDataSync, and resolve all TypeScript compilation errors in MasterDataLayout.tsx.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1
- Original parent: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb
- Milestone: Milestone 4 Implementation Worker

## 🔒 Key Constraints
- CODE_ONLY network mode (No external HTTP/HTTPS connections).
- Windows environment (PowerShell v5.1 — no `&&`, use `;` or separate commands).
- Avoid guessing. Use physical verification (CAVR) and C-E-V (Cause-and-Effect) protocol.

## Current Parent
- Conversation ID: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb
- Updated: not yet

## Task Summary
- **What to build**: Backport `activeDateRef` race-condition protection and database corrupt job skipping logic to `useDataSync.ts` from TBNY DXOS, fix compiler error in `useDataSync.test.tsx`, adapt tests to verify self-healing, and resolve ~25 TypeScript compiler errors in `MasterDataLayout.tsx`.
- **Success criteria**:
  - `npm run type-check` compiles without any TypeScript errors.
  - `npm run test` passes all tests (including adjusted `useDataSync.test.tsx`).
- **Interface contracts**: C:\Users\shiyo\開発中APP\RePaper Route\AGENTS.md
- **Code layout**: apps/repaper-route/src/

## Key Decisions Made
- Added race-condition protection via `activeDateRef` check after each supabase fetch call in `useDataSync.ts`.
- Mapped and wrapped `coursesData` in try-catch to discard corrupt database rows just like jobs.
- Renamed and adapted the corrupt database payload test case to verify the new self-healing behavior in `useDataSync.test.tsx`.
- Safely handled test case's intermediate mock resolvers so they do not crash when early-return race-condition protection gets triggered.

## Artifact Index
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\progress.md — Progress tracking
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\handoff.md — Final handoff report

## Change Tracker
- **Files modified**:
  - `apps/repaper-route/src/features/board/hooks/useDataSync.ts` — Implemented race-condition activeDateRef checks and robust mappings.
  - `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx` — Adjusted test case for self-healing and resolved unused variable warnings.
- **Build status**: Pass
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (95 tests passed, 0 errors)
- **Lint status**: Pass (0 errors, 82 warnings - all expected warnings in tests/mock code)
- **Tests added/modified**: Adapted `should crash or fail to load data when corrupt database payload contains null elements in jobs`

## Loaded Skills
- None
