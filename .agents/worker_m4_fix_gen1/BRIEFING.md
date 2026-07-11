# BRIEFING — 2026-07-11T23:15:43+09:00

## Mission
Fix the reported issues in `useDataSync.test.tsx` (remove any) and `MasterDataLayout.tsx` (Japanese Syllabary Filter regex bug) and verify the workspace compiles and tests pass cleanly.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_fix_gen1
- Original parent: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb
- Milestone: Milestone 4 Fixes

## 🔒 Key Constraints
- Remove all `any` types in `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx`.
- Fix Japanese Syllabary Filter regex in `apps/repaper-route/src/components/MasterDataLayout.tsx`.
- Verify with `npm run type-check`, `npm run test` and `npm run done`.
- Windows environment (PowerShell v5.1, no `&&`).
- No guessing, use minimal changes, run verification.

## Current Parent
- Conversation ID: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb
- Updated: 2026-07-11T23:15:43+09:00

## Task Summary
- **What to build**: Fix type errors and regex bug in components and tests.
- **Success criteria**: All types are clean (no `any` in specified test file), regex handles dakuten/handakuten, all 95 tests pass, type-check passes, `npm run done` succeeds.
- **Interface contracts**: C:\Users\shiyo\開発中APP\RePaper Route\AGENTS.md
- **Code layout**: apps/repaper-route/src/...

## Key Decisions Made
- Initial setup and configuration validation.

## Artifact Index
- C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_fix_gen1\ORIGINAL_REQUEST.md — Original task details.
