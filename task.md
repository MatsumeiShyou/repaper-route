# Task Checklist - Workflow Protection & Governance Cleanup

- [x] Restore lost workflow files (`git restore`)
- [x] Populate global workflows directory (`C:\Users\shiyo\.gemini\antigravity\global_workflows`)
- [x] Update `compliance.json` to protect workflow directories
- [x] Update `denylist.json` to warn about workflow file deletion
- [x] Register missing scripts in `inventory.json`
- [x] Fix `pre_flight.js` ReferenceError (validateDebt crash)
- [x] Zero-Residue Purification
    - [x] 1.1 Identify all untracked files in the workspace
    - [x] 1.2 Purge temporary items via `reflect.js --purge`
    - [x] 1.3 Verify "Clean State" for T3 gating
- [x] Atomic Governance Commit
    - [x] 2.1 Record AMP entry with `design_ref`
    - [x] 2.2 Stage final governance assets
    - [x] 2.3 Execute T3 commit and validate success (Route B)
- [x] Physical Push & Closure
    - [x] 3.1 Perform `npm run done` or `/push`
    - [x] 3.2 Verify workflow visibility and protection rules
    - [x] 3.3 Create `walkthrough.md` and declare `**[TASK_CLOSED]**`
