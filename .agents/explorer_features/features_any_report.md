# Features `any` Type Scan Report

This report documents the occurrence of `any` types in TypeScript/TSX files within the `apps/repaper-route/src/features` directory.

- **Scan Target Directory**: `C:\Users\shiyo\開発中APP\RePaper Route\apps\repaper-route\src\features`
- **Total Files Scanned**: 10
- **Total `any` Occurrences Found**: 2 (in 1 file)

---

## 🔍 Detailed Scan Results

### 1. `apps/repaper-route/src/features/board/hooks/useDataSync.ts`
- **Total Occurrences**: 2
- **Details**:
  - **Line 70**:
    ```typescript
    status: j.status as any || 'planned',
    ```
    *Context*: The `status` property of the `BoardJob` object mapped from Supabase's `jobsData` is cast to `any` type.
  - **Line 76**:
    ```typescript
    } catch (err: any) {
    ```
    *Context*: The catch block parameter `err` is typed as `any` to allow accessing `.message` and other properties without type errors.

---

## 📁 Scanned Files with Zero Occurrences

The following files were scanned and verified to contain **no** instances of the `any` type:

1. `admin/MasterDriverList.tsx`
2. `admin/MasterItemList.tsx`
3. `admin/MasterPointList.tsx`
4. `admin/MasterVehicleList.tsx`
5. `board/BoardCanvas.tsx`
6. `board/utils/dateUtils.ts`
7. `board/utils/holidayUtils.test.ts`
8. `board/utils/holidayUtils.ts`
9. `settings/DeviceSettings.tsx`
