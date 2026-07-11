# Handoff Report — explorer_m3_1

## 1. Observation
I directly observed the following code components and file details:
- **`MasterDataLayout.tsx` (`apps/repaper-route/src/components/MasterDataLayout.tsx`)**: Contains 22 total occurrences of the word `any` (excluding comments, there are 21 occurrences of `any`, `any[]`, or `as any` type expressions). Key examples include:
  - Line 40: `useMasterCRUD<Record<string, any>>(schema);`
  - Line 177: `const { data: results, error: fetchErr } = await nativeSupabaseFetch<any[]>(`
  - Line 214: `} catch (err: any) {`
  - Line 976: `const [permissions, setPermissions] = useState<any[]>([]);`
  - Line 1003: `(supabase.from('point_access_permissions') as any).upsert(...)`
- **`useMasterCRUD.ts` (`apps/repaper-route/src/hooks/useMasterCRUD.ts`)**: Catch blocks convert unknown error objects using:
  - Line 29: `setError(err instanceof Error ? err : new Error(String(err)));`
- **`MasterDataContext.tsx` (`apps/repaper-route/src/contexts/MasterDataContext.tsx`)**: Master tables fallback handling of payload arrays uses non-guarded assignments for all but drivers:
  - Line 50: `vehicles: (vRes.data || []) as unknown as MasterVehicle[],`
- **`AuthAdapter.ts` (`apps/repaper-route/src/os/auth/AuthAdapter.ts`)**: The database fetch timeout is handled inside `fetchStaff()` as:
  - Lines 134-138:
    ```typescript
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_DB_FETCH')), 15000);
    });
    const { data: staff, error } = await Promise.race([queryPromise, timeoutPromise]);
    ```

## 2. Logic Chain
- **For `MasterDataLayout.tsx`**: Changing variables and hook parameters typed as `any` to `unknown` or concrete types (e.g., `Record<string, unknown>`, `PointAccessPermission[]`, `DriverOption[]`, `MasterVehicle[]`) forces type-safe property access. It eliminates compiler bypasses and improves code readability and editor autocomplete.
- **For `useMasterCRUD.ts`**: Since `PostgrestError` objects returned by Supabase are plain JavaScript objects and do not inherit from `Error`, the expression `err instanceof Error` is false. They fall back to `new Error(String(err))`, which stringifies to `[object Object]`. Creating a type guard (e.g. checking `typeof err === 'object' && 'message' in err`) and applying a custom error formatter prevents this behavior and preserves the detailed database message.
- **For `MasterDataContext.tsx`**: If network operations return non-array objects (such as error maps or empty JSON objects `{}`), `vRes.data || []` will evaluate to the non-array object instead of `[]`. Replacing this with `Array.isArray(vRes.data) ? vRes.data : []` guarantees that only valid arrays are assigned, preventing downstream crashes when calling array operations like `.map` or `.filter`.
- **For `AuthAdapter.ts`**: When a query finishes quickly, `Promise.race` resolves, but the `setTimeout` function continues in the background. Once the timer reaches 15 seconds, the callback is executed, calling `reject()`. This rejection goes unhandled, producing `Unhandled Promise Rejection` warnings. Keeping track of the timer ID and invoking `clearTimeout()` immediately after the race settles completely prevents this leak.

## 3. Caveats
- No actual source code was modified during this investigation, as this is a read-only investigation task.
- We assumed that `nativeSupabaseFetch` returns standardized payload objects containing `{ data, error }` (which was verified in the implementation).

## 4. Conclusion
Safe, strict-typing refactoring can be successfully applied to all target files without breaking existing business logic. Implementing the proposed type guards, `clearTimeout` timer cleanup, and `unknown` type annotations will resolve all 21 `any` types and eliminate unhandled promise rejections and `[object Object]` error messages.

## 5. Verification Method
1. **Type Checking**: Run `npm run type-check` (runs `tsc --noEmit`) to verify that the refactored code compiles without errors or warnings.
2. **Error Stringification Test**: Mock a mock database error and verify that the formatted error correctly outputs the Supabase error message rather than `[object Object]`.
3. **Promise Leak Test**: Execute `fetchStaff` and verify that no unhandled rejection warnings appear in console/logs after 15 seconds.
