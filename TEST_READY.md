# RePaper Route E2E Testing Ready Guide (TEST_READY.md)

This document provides step-by-step instructions on how to execute the E2E test suite and outlines the features inventory mapped across risk levels (Tiers 1–4).

---

## 1. Features Inventory & Mapping

The application capabilities are cataloged and mapped to specific testing tiers to ensure full regression coverage:

| Feature Area | Tier 1 (Feature Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature Combinations) | Tier 4 (Real-World Scenario) |
|---|---|---|---|---|
| **Authentication & Portal** | Verify page loads, checks `#root` rendering. | Verify redirect to OS portal when unauthenticated. | N/A | Full dispatcher/driver daily session cycles. |
| **Dispatch Board** | Date display, next/prev navigation, empty course status. | Navigation limits (empty dates, extreme bounds). | Drag job card across columns (verifying layout update). | Dispatcher plans a daily route with multiple courses. |
| **Master Driver List** | Grid renders, search/filter drivers. | Input boundaries, deleting assigned driver. | Assign updated driver name to board course. | Dispatcher modifies driver master list before dispatching. |
| **Master Vehicle List** | Grid renders, search vehicles. | Deleting active vehicles. | Verify vehicle status update on BoardCanvas. | Full asset management flow before daily routing. |
| **Master Point List** | Grid renders, search customer points. | Geographic coordinate edge cases. | Update location and check job duration changes. | Route mapping and schedule sequencing. |
| **Master Item List** | Grid renders, search items. | Duplicate items check. | Add custom items to a spot job on Board. | Delivery item selection during spot orders. |
| **PWA & Offline** | Service worker mounts and caches assets. | Run app in mock offline mode. | Modify local board card, restore network, sync to Supabase. | Driver performs offline delivery runs in the field. |

---

## 2. Test Execution Instructions

### Prerequisites
1. Ensure all workspace dependencies are installed:
   ```bash
   npm install
   ```
2. For local E2E tests, build and run the development server:
   ```bash
   npm run dev
   ```

---

### Command Guide

#### 1. Logic and Unit Tests (Vitest)
To run the logic tests:
```bash
npm run test
```
*Note: If the `nativeFetch.test.ts` failure persists, run logic tests selectively:*
```bash
npx vitest run apps/repaper-route/src/utils/serialization.test.ts apps/repaper-route/src/lib/PeriodicJobImporter.test.ts apps/repaper-route/src/utils/sortUtils.test.ts
```

#### 2. E2E Smoke Tests (Playwright)
To execute the smoke tests against the default staging URL (`https://repaper-route.pages.dev`):
```bash
npx playwright test --config=.agents/sub_orch_e2e/playwright.custom.config.ts --project=e2e-smoke
```

To run against a custom local or staging URL, set the `STAGING_URL` environment variable:
```bash
# Windows PowerShell
$env:STAGING_URL="http://localhost:5173"; npx playwright test --config=.agents/sub_orch_e2e/playwright.custom.config.ts --project=e2e-smoke
```

#### 3. Visual VLM Drag Tests (Playwright)
*Note: Visual E2E tests will fail until `VLMClient` is implemented. Once the proposed stub or client is in place, execute with:*
```bash
npx playwright test --config=.agents/sub_orch_e2e/playwright.custom.config.ts --project=vlm
```
