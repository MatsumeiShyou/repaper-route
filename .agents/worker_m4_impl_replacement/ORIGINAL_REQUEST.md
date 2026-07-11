## 2026-07-11T08:56:34Z
You are the M4 Implementation Worker. Your working directory is C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_impl_replacement.
Your task is to refactor 2 occurrences of `any` types in apps/repaper-route/src/features/board/hooks/useDataSync.ts:
1. Cast status properly as `BoardJob['status']` instead of `as any`.
2. Catch block: catch `err: unknown` and safely extract error message using `err instanceof Error`.

After implementing these changes, verify that the application compiles and passes all unit tests:
1. Run `npm run type-check` (tsc --noEmit) at the root to check for any errors.
2. Run `npm run test` (vitest) to confirm all tests pass successfully.
Include command output in your handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Ensure you comply with all rules in AGENTS.md, including declaring the Self-Reflection Gate with risk tier T2, and maintaining progress.md.
