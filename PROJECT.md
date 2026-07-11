# Project: RePaper Route Strict Typing Refactoring

## Architecture
This project is a React and TypeScript single-page application (`repaper-route`) designed for paper route management, integrated with Supabase. 
The architecture relies on the following layers:
- **UI Components** (`src/components`): Reusable layouts and views (e.g. MasterDataLayout).
- **Features** (`src/features`): Independent feature modules (e.g. `board`, `admin`, `settings`).
- **Contexts & Hooks** (`src/contexts`, `src/hooks`): Global state providers and shared state query hooks.
- **OS Layer** (`src/os`): Native platform capabilities (e.g. auth store, adapters).
- **Libs & Utilities** (`src/lib`, `src/utils`): Supabase client/fetch configuration and serializing/sorting helpers.

## Code Layout
- `apps/repaper-route/src/components/`: Reusable layouts and components.
- `apps/repaper-route/src/config/`: App scheme definitions and configs.
- `apps/repaper-route/src/contexts/`: React context providers.
- `apps/repaper-route/src/features/`: Feature modules.
- `apps/repaper-route/src/hooks/`: React custom hooks.
- `apps/repaper-route/src/lib/`: supabase-js interface and local database.
- `apps/repaper-route/src/os/`: authentication adapters.
- `apps/repaper-route/src/types/`: TypeScript type declarations.
- `apps/repaper-route/src/utils/`: Serialization and sorting helpers.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Lib & Utils Refactoring | Refactor 14 `any` types in `src/lib` and `src/utils` | none | DONE | 75e8eb4b-c362-4f2c-8faf-b0f7ff90d186 |
| 2 | OS, Contexts & Hooks Refactoring | Refactor 10 `any` types in `src/os`, `src/contexts`, and `src/hooks` | Milestone 1 | DONE | 2213e73b-e80e-40a1-9e08-37a723126609 |
| 3 | Components Refactoring | Refactor 21 `any` types in `src/components/MasterDataLayout.tsx` | Milestone 2 | DONE | 10eb680e-1f74-4ab0-808d-1bd958a29ead |
| 4 | Features Refactoring | Refactor 2 `any` types in `src/features/board/hooks/useDataSync.ts` | Milestone 3 | IN_PROGRESS | |
| 5 | E2E & Final Verification | Run E2E tests, ensure full build succeeds, verify no regressions | Milestone 4, E2E | PLANNED | |

## Interface Contracts
### Supabase Native Fetch Contract
- Function: `nativeSupabaseFetch<T>(...)`
- Previous return/arguments used `any`. Refactored interfaces should use generics `T = unknown` or concrete shapes.
- Exception handling in `catch` blocks must type error objects strictly (e.g., using `unknown` and type guards).

### Master CRUD Hooks & Schema Contracts
- `useMasterCRUD<T extends Record<string, unknown>>`
- Ensures generic data models are type-safe key-value objects instead of `Record<string, any>`.
