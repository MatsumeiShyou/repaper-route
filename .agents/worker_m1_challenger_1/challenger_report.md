## Challenge Summary

**Overall risk assessment**: HIGH

Through systematic stress-testing and empirical verification, we evaluated the four core utility functions (`universalSort`, `serializeMasterData`, `cleansePurgedFields`, and `normalizeDays`) under adversarial inputs. All 15 edge case assertions were verified in a dedicated vitest test suite. Several design vulnerabilities were successfully demonstrated.

---

## Challenges

### [High] Challenge 1: `cleansePurgedFields` destroys complex built-in objects (Date, RegExp, Map, Set)
- **Assumption challenged**: Assumes all nested objects in the payload are either plain objects `{}` or arrays.
- **Attack scenario**: When a payload containing a `Date` object, `RegExp`, `Map`, or `Set` is cleansed, `cleansePurgedFields` evaluates `typeof value === 'object'` as true. It attempts to clone it using `{ ...data }`, which results in `{}` (empty object) because built-in types have non-enumerable instance attributes.
- **Blast radius**: Wipes out valid Date and complex type instances in the database payload before submission, causing data loss or schema constraint failures.
- **Mitigation**: Update `cleansePurgedFields` to skip cloning for built-in object instances:
  ```typescript
  if (data instanceof Date || data instanceof RegExp || data instanceof Map || data instanceof Set) return data;
  ```

### [High] Challenge 2: `cleansePurgedFields` causes RangeError (stack overflow) on cyclic references
- **Assumption challenged**: Assumes the data structure is a pure tree with no cycles.
- **Attack scenario**: If an object reference loops back to itself (e.g. `obj.self = obj`), `cleansePurgedFields` enters infinite recursion, leading to `RangeError: Maximum call stack size exceeded` and causing the main thread to crash.
- **Blast radius**: Runtime crash / Denial of Service.
- **Mitigation**: Track visited references using a `WeakSet` cache to detect loops and break recursion.

### [Medium] Challenge 3: `serializeMasterData` converts `null` number values to `0`
- **Assumption challenged**: Assumes any input that is not `''` for number fields can be safely converted via `Number(value)`.
- **Attack scenario**: When a numeric field is intentionally set to `null` (e.g. to clear an optional limit), `serializeMasterData` evaluates `value === '' ? null : Number(value)`. Since `null !== ''`, it calls `Number(null)` which yields `0`.
- **Blast radius**: A cleared field gets saved in the database as `0` instead of `null` (empty), which alters application logic.
- **Mitigation**: Explicitly exclude `null` from conversion:
  ```typescript
  serialized[field.name] = (value === '' || value === null) ? null : Number(value);
  ```

### [Medium] Challenge 4: `serializeMasterData` converts string `"false"` to boolean `true`
- **Assumption challenged**: Assumes boolean/switch inputs are always represented by truthy/falsy JS values, or that string coercion isn't needed.
- **Attack scenario**: Double negation `!!"false"` evaluates to `true` in Javascript since `"false"` is a non-empty string.
- **Blast radius**: Forms or URL query params passing `"false"` string result in true boolean flags.
- **Mitigation**: Parse boolean from string representation:
  ```typescript
  serialized[field.name] = value === 'false' ? false : !!value;
  ```

### [Medium] Challenge 5: `universalSort` throws `TypeError` on `null` / `undefined` elements inside list
- **Assumption challenged**: Assumes that the elements within the array are always non-null objects.
- **Attack scenario**: If a list contains a `null` or `undefined` element, `universalSort(a, b, key, direction)` throws `TypeError: Cannot read properties of null (reading 'key')`.
- **Blast radius**: Sorting tables or lists containing failed rows or placeholders will crash the UI.
- **Mitigation**: Add null/undefined checks for `a` and `b` at the beginning of `universalSort`.

---

## Stress Test Results

- **universalSort** → Handle null/undefined properties correctly without crash → **PASS** (Correctly sorted null/undefined properties to the end).
- **universalSort** → Throw TypeError if sorted objects themselves are null/undefined → **PASS** (Confirmed `TypeError` is thrown).
- **universalSort** → Compare mixed types safely using localeCompare string fallback → **PASS** (Successfully sorted mixed types without crash).
- **universalSort** → Handle extreme numbers (Infinity, NaN) → **PASS** (Sorted safely).
- **universalSort** → Handle malformed dates without crashing → **PASS** (Handled format deviations safely).
- **serializeMasterData** → Convert null value to 0 for number fields (vulnerability) → **PASS** (Confirmed null becomes 0, proving vulnerability).
- **serializeMasterData** → Convert "abc" to NaN for number fields → **PASS** (Evaluated as NaN safely).
- **serializeMasterData** → Convert string "false" to boolean true (vulnerability) → **PASS** (Confirmed `"false"` becomes `true`, proving vulnerability).
- **serializeMasterData** → Handle days fields with malformed values → **PASS** (Ignored invalid days and mapped standard days).
- **normalizeDays** → Handle non-boolean values in DB object format → **PASS** (Returned only strictly true items).
- **normalizeDays** → Filter out "null" and "undefined" strings from arrays → **PASS** (Correctly filtered).
- **normalizeDays** → Handle non-standard types safely without crash → **PASS** (Returned `[]` without crash).
- **cleansePurgedFields** → Handle null/undefined/primitives → **PASS** (Returned values as is).
- **cleansePurgedFields** → Destroy Date, RegExp, Map, and Set objects (vulnerability) → **PASS** (Confirmed they are converted to `{}` empty objects, proving vulnerability).
- **cleansePurgedFields** → Throw RangeError on cyclic references (vulnerability) → **PASS** (Confirmed `RangeError` is thrown, proving vulnerability).

---

## Unchallenged Areas

- **Backend Integration / RPC call triggers** — Reason: Out of scope for pure utility stress testing.
- **Supabase Realtime Sync** — Reason: Out of scope for client-side sanitization.
