## 2026-07-12T03:56:58+09:00
You are the Milestone 5 Verification Worker.
Your working directory is: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m5_final_verification.

Your objective:
Perform the final verification and validation checks on the codebase to ensure all changes made in Milestone 4 are completely stable, compile cleanly, pass tests, pass E2E tests, and comply with all governance requirements.

Tasks:
1. Create your working directory: C:\Users\shiyo\開発中APP\RePaper Route\.agents\worker_m5_final_verification
2. Initialize progress.md and BRIEFING.md in your directory.
3. Run the SSOT scan mandate command:
   npm run agent:scan --target=all
4. Run the TypeScript type-checker:
   npm run type-check
5. Run the unit tests:
   npm run test
6. Run the Playwright E2E tests for the e2e-smoke project:
   npx playwright test --project=e2e-smoke
7. Run the final closure/done command to obtain the final GSEAL verification code:
   npm run done
8. Write a detailed handoff.md reporting the results of these verification runs (with complete outputs and the generated GSEAL code).
9. Report back to the orchestrator (conversation ID: da065f07-2de1-4009-9f31-4f09e1a4a12a) with a status update once you are finished.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
