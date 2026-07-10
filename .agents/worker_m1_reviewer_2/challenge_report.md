# Adversarial Challenge Report — Milestone 1 (Lib & Utils Refactoring)

## Challenge Summary

**Overall risk assessment**: HIGH

This report highlights potential failure modes, implicit assumptions, and boundary conditions in the Milestone 1 codebase. The primary high-risk area resides in database-dependent React components that assume foreign key constraints that do not exist in the schema.

---

## Challenges

### [High] Challenge 1: Postgrest Join Query in `PointAccessSection` assumes nonexistent DB relationships

- **Assumption challenged**: Assumes that `point_access_permissions` table has database foreign keys that allow Postgrest to implicitly join with `staffs` (view) and `vehicles` (view).
- **Attack scenario**: When a user opens the "拠点マスタ" (Point Master) modal and opens the "入場制限設定" (Point Access Permissions) panel, the application makes a GET request to `/rest/v1/point_access_permissions?select=*,profile:staffs(id,name),vehicle:vehicles(id,callsign,number)`. Because there is no foreign key referencing views or vehicles, Supabase returns a `400 Bad Request` error.
- **Blast radius**: The permission list fails to load, returning `null` or an empty list. The user is shown "制約なし（デフォルト）" (no restrictions) even if restriction rules exist, potentially causing dispatchers to allocate incorrect vehicles/drivers to restricted sites.
- **Mitigation**: Fetch `point_access_permissions` without joins, and perform the join operation in memory using the already fetched `drivers` and `vehicles` arrays on the client side.

### [Medium] Challenge 2: `cleansePurgedFields` breaks standard JS objects like `Date` or `RegExp`

- **Assumption challenged**: Assumes all nested objects in serialization are plain JSON-serializable key-value maps.
- **Attack scenario**: A React state or object payload containing a standard `Date` object (e.g. `created_at` or `scheduled_date` as a Javascript `Date` instance) is passed through `cleansePurgedFields`. The function executes `const cleansed = { ...data }`. Since `typeof dateInstance === 'object'` evaluates to `true`, it clones the `Date` object into an empty `{}` because it lacks enumerable keys.
- **Blast radius**: Date objects are completely destroyed and replaced with empty objects, causing subsequent code attempting to call Date methods (e.g., `.getTime()`, `.toISOString()`) to throw type errors and crash the UI.
- **Mitigation**: Add instance checks (`data instanceof Date`, `data instanceof RegExp`) to immediately return them without traversing or spreading.

### [Low] Challenge 3: `universalSort` date validation does not check for `Date` objects

- **Assumption challenged**: Assumes all date values in master tables are represented as strings.
- **Attack scenario**: If a database column contains JavaScript `Date` instances (e.g., local state dates), `isValidDate` returns `false` since it checks `typeof val !== 'string'`. The sorter then falls back to `localeCompare(String(valA), String(valB))` which compares the stringified Date string alphabetically, sorting `Fri Jul 10` before `Mon Jul 06`.
- **Blast radius**: Unpredictable and incorrect chronological sorting for any non-string Date columns.
- **Mitigation**: Extend `isValidDate` to handle `Date` instances by checking `val instanceof Date && !isNaN(val.getTime())`.

---

## Stress Test Results

- **Empty arrays/null in days normalization** → Normalized to `[]` successfully → **PASS**
- **Date string sort consistency** → ISO strings sort correctly alphabetically and chronologically → **PASS**
- **Null values in sorting** → Placed at the end in both `asc` and `desc` directions → **PASS**
- **Cleanse nested properties** → Purged keys are successfully deleted recursively → **PASS**
- **Unescaped characters in deep fetch** → Primary key with special characters causes query syntax error → **FAIL** (Requires URL encoding)

---

## Unchallenged Areas

- **Supabase Real Connection** — Reason not challenged: Operating in offline review environment (CODE_ONLY network mode). Static analysis of `types/supabase.ts` was used instead.
