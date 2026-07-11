# Plan: RePaper Route Strict Typing Refactoring (Resume)

## Objective
Refactor the remaining `any` types in `useDataSync.ts` (Milestone 4), resolve unused variable and type check errors in `useDataSync.test.tsx` and `MasterDataLayout.tsx`, verify the global build succeeds, and complete final acceptance testing (Milestone 5).

## Milestones

### Milestone 4: Features Refactoring & Fix Backporting (Active)
- **Scope**:
  - `apps/repaper-route/src/features/board/hooks/useDataSync.ts`:
    - Port `activeDateRef` race-condition protection (using React `useRef`).
    - Filter out corrupt/null jobs using `.filter(Boolean)` mapping.
  - `apps/repaper-route/src/features/board/hooks/useDataSync.test.tsx`:
    - Fix unused variable warning/error `col` on line 139 (change to `_col` or remove).
  - `apps/repaper-route/src/components/MasterDataLayout.tsx`:
    - Fix 25+ TS errors.
    - Cast dynamic keys to safe types (`as string | number`) and resolve index signature warnings.
- **Verification Gates**:
  - TS Compiler check (`npm run type-check`) passes cleanly.
  - Unit tests (`npm run test`) pass.
  - Forensic audit verdict is CLEAN.

### Milestone 5: E2E & Final Verification (Pending)
- **Scope**:
  - Run all E2E test suites via `npm run test:e2e` (if defined) or verified runner scripts.
  - Run final validation and security checks.
  - Produce final GSEAL code via `npm run done`.

## Action Steps
1. **Initialize & Setup**: Notify Sentinel of resumption and initialization.
2. **Worker Dispatch**: Spawn `teamwork_preview_worker` to apply the backporting and compilation fixes.
3. **Review & Challenge**:
   - Spawn `teamwork_preview_reviewer` to check type correctness and design consistency.
   - Spawn `teamwork_preview_challenger` to run unit tests and verify liveness.
4. **Forensic Audit**: Spawn `teamwork_preview_auditor` to check for implementation authenticity (no cheating, no hardcoded results).
5. **Milestone Transition**: Mark Milestone 4 DONE, move to Milestone 5, run final global validation, and obtain the GSEAL code.
