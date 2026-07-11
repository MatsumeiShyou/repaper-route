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
- [TBD]

## Artifact Index
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\progress.md — Progress tracking
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_backport_gen1\handoff.md — Final handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: Implement changes and run type-checks

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None yet

## Loaded Skills
- None
