## 2026-07-11T14:15:43Z
You are the teamwork_preview_worker (Milestone 4 Fix Worker).
Your working directory is: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_fix_gen1
The main project directory is: C:\Users\shiyo\開発中APP\RePaper Route

Please fix the following issues reported by Reviewers:

1. Remove ALL `any` types in `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx`:
   - Replace variables like `mockCoursesResult`, `mockAssignmentsResult`, `mockJobsResult`, `query`, `onfulfilled`, and resolver variables typed as `any` with specific shapes, e.g., `unknown[]`, `Record<string, unknown>`, or proper interfaces.
   - For mock functions, ensure that parameter types and return promises are typed cleanly (avoid `Promise<any>` and `(onfulfilled: any)`).
   - Verify the test compiles and executes properly.

2. Fix the Japanese Syllabary Filter regex bug in `apps/repaper-route/src/components/MasterDataLayout.tsx`:
   - Expand the regex groups in the `groups` object inside `matchesInitial` (lines 132-141) to include dakuten (voiced) and handakuten (semi-voiced) variations:
     - `'か': /^[かきくけこがぎぐげごカキクケコガギグゲゴｶｷｸｹｺ]/`
     - `'さ': /^[さしすせそざじずぜぞサシスセソザジズゼゾｻｼｽｾｿ]/`
     - `'た': /^[たちつてとだぢづでどタチツテトダヂヅデドﾀﾁﾂﾃﾄ]/`
     - `'は': /^[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポﾊﾋﾌﾍﾎ]/`

3. Verify your fixes:
   - Run type-check (`npm run type-check`) to confirm the entire project compiles cleanly without errors.
   - Run unit tests (`npm run test`) to confirm all 95 tests pass successfully.
   - Run `npm run done` to confirm Legislative and Seal compliance and generate the final GSEAL code.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write your progress checkpoints in `C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_fix_gen1\progress.md` and deliver your final findings and verification outputs in `C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m4_fix_gen1\handoff.md`.
Once finished, send a message to the orchestrator (conversation ID: 87f3b00d-e1ca-48e0-bf7f-37edf340b5bb) reporting your completion.
