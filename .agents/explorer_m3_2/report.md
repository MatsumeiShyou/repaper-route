# マスタデータ関連コンポーネントおよび各種不具合調査報告書 (Milestone 3)

## 概要
本報告書は、`apps/repaper-route/src/components/MasterDataLayout.tsx` に存在する `any` 型（計22箇所）の全箇所特定と、その厳密な型安全リファクタリング戦略についてまとめたものです。
また、Milestone 2 においてチャレンジャーから報告された3件の指摘事項に対する、具体的かつ安全な実装修正方針についても併せて提示します。

---

## ティア判定と適用ルール
- **ティア分類**: **T1 (低リスク調査フェーズ)**
  - 理由: 本タスクは読み取り専用のコード解析および改善レポートの作成であり、実コードの書き換えおよび本番マージを行わないため。
- **適用条項**:
  - `[No Guessing]`（推測を排除し、実際のソースコードを走査・検証）
  - `[SDR Protocol]`（事実-判断-理由の明確化）
  - `[Cleanup & Type-Check]`（型整合性とインポートの整理）

---

## Part 1: `MasterDataLayout.tsx` における `any` 型の解析とリファクタリング戦略

`MasterDataLayout.tsx` 内には、合計22箇所の `any` 使用が確認されました。これらに対する厳密な型定義への移行プランを以下に示します。

### 1. `Record<string, any>` の `Record<string, unknown>` への置換（11箇所）
本コンポーネントはジェネリックなマスタデータ表示を目的としており、マスタごとにレコードスキーマが異なります。そのため、完全に具体的な単一型を割り当てることはできませんが、`any` を使用せず `Record<string, unknown>` を用いることで、型安全性を高めることができます。

- **対象箇所**:
  1. **L40**: `useMasterCRUD<Record<string, any>>(schema);`
     - 改善案: `useMasterCRUD<Record<string, unknown>>(schema);`
  2. **L45**: `const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);`
     - 改善案: `const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);`
  3. **L120**: `const matchesInitial = (item: Record<string, any>) => {`
     - 改善案: `const matchesInitial = (item: Record<string, unknown>) => {`
  4. **L172**: `const handleEdit = async (item: Record<string, any>) => {`
     - 改善案: `const handleEdit = async (item: Record<string, unknown>) => {`
  5. **L204**: `const handleSave = async (formData: Record<string, any>) => {`
     - 改善案: `const handleSave = async (formData: Record<string, unknown>) => {`
  6. **L450**: `function renderCell(item: Record<string, any>, col: MasterColumn)`
     - 改善案: `function renderCell(item: Record<string, unknown>, col: MasterColumn)`
  7. **L641**: `initialData: Record<string, any> | null,`
     - 改善案: `initialData: Record<string, unknown> | null,`
  8. **L642**: `onSave: (data: Record<string, any>) => Promise<void>,`
     - 改善案: `onSave: (data: Record<string, unknown>) => Promise<void>,`
  9. **L647**: `const [formData, setFormData] = useState<Record<string, any>>(...)`
     - 改善案: `const [formData, setFormData] = useState<Record<string, unknown>>(...)`
  10. **L662**: `const { data: allItems } = useMasterCRUD<Record<string, any>>(MASTER_SCHEMAS.items);`
      - 改善案: `const { data: allItems } = useMasterCRUD<Record<string, unknown>>(MASTER_SCHEMAS.items);`
  11. **L961**: `options.map((opt: any) => ...)`
      - 改善案: `options.map((opt: Record<string, unknown>) => ...)` または型推論に委ねる

- **リファクタリングに伴う留意点**:
  `Record<string, unknown>` の値は、型アサーションや明示的なキャスト（`String(item[field])` など）なしではReact要素のプロパティや他の型に直接渡せません。本コンポーネント内ではすでに `String(item[field] || '')` のように安全なキャスト処理が多く用いられているため、スムーズに移行可能です。

### 2. ライブラリ呼び出し時の `any`（2箇所）
- **対象箇所**:
  12. **L177**: `await nativeSupabaseFetch<any[]>(...)`
      - 改善案: `await nativeSupabaseFetch<Record<string, unknown>[]>(...)`
  13. **L214**: `} catch (err: any) {`
      - 改善案: `} catch (err) {`（TypeScript 4.x/5.x ではデフォルトで `unknown` として扱われます）。エラー情報の抽出は `err instanceof Error` 等の型ガードを使用して安全に行います。
        ```typescript
        const errorMsg = err instanceof Error ? err.message : '不明なエラー';
        const errObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
        const diagnosticInfo = [errObj.code, errObj.hint, errObj.details].filter(Boolean).join(' | ');
        ```

### 3. Schema定義型（`MasterField`）の適用（1箇所）
- **対象箇所**:
  14. **L945**: `field: any, // MasterField from schema` (LookupSelect 引数)
      - 改善案: `MasterField` 型をインポートし、`field: MasterField` とする。また `field.lookup` はオプショナルなため、事前に `if (!field.lookup) return null;` とガードした上で `field.lookup.schemaKey` などのメンバにアクセスします。

### 4. `PointAccessSection` における状態とデータの明示的型定義（8箇所）
入場制限セクション（`PointAccessSection`）において、ローカルステートやAPI戻り値に `any` が多用されています。
- **対象箇所**:
  15. **L976**: `const [permissions, setPermissions] = useState<any[]>([]);`
  16. **L977**: `const [drivers, setDrivers] = useState<any[]>([]);`
  17. **L978**: `const [vehicles, setVehicles] = useState<any[]>([]);`
  18. **L992**: `(data || []).map((d: any) => ...)`
  19. **L1003**: `await (supabase.from('point_access_permissions') as any).upsert(...)`
  20. **L1009**: `await (supabase.from('point_access_permissions') as any).select(...)`
  21. **L1017**: `await (supabase.from('point_access_permissions') as any).update(...)`
  22. **L1055**: `permissions.map((p: any) => {`

- **型安全化の具体的なアプローチ**:
  - `Database` 型をベースにしたインターフェースの定義：
    ```typescript
    interface PointAccessPermission {
        id: string;
        point_id: string;
        driver_id: string;
        vehicle_id: string;
        is_active: boolean | null;
        created_at: string | null;
        note: string | null;
    }

    interface DriverAccessOption {
        id: string;
        name: string;
    }

    interface VehicleAccessOption {
        id: string;
        number: string;
        callsign: string | null;
    }
    ```
  - ステートへの適用：
    - `useState<PointAccessPermission[]>([]);`
    - `useState<DriverAccessOption[]>([]);`
    - `useState<VehicleAccessOption[]>([]);`
  - supabase クライアント呼び出し時のキャスト排除：
    - supabase client は `Database` 型で初期化されているため、`as any` は一切不要です。
    - ただし、`upsert` の `onConflict` オプションが複合ユニークキー `'point_id,driver_id'` を文字列リテラルとして期待しない場合があるため、そのパラメータのみ `as any` または `as unknown as 'id'` で逃がすのが適切です。
      ```typescript
      await supabase.from('point_access_permissions').upsert(
          { point_id: pointId, driver_id: newDriverId, vehicle_id: newVehicleId, is_active: true },
          { onConflict: 'point_id,driver_id' as any }
      );
      ```

---

## Part 2: Milestone 2 チャレンジャー指摘の3つの対応方針

### 1. `useMasterCRUD.ts` における `PostgrestError` の文字列表現改善
- **事実 (State)**:
  rpc呼び出しから返る `error` オブジェクトを catch ブロックで `new Error(String(err))` とすると、プレーンオブジェクトであるため `"[object Object]"` になってしまう。
- **判断 (Decision) & 理由 (Reason)**:
  `PostgrestError` (もしくはオブジェクト) のプロパティ (`message`, `code`, `details`, `hint`) を安全に抽出し、文字列整形して Error オブジェクト化する専用ヘルパー `toError` を導入する。

- **提案コード実装案**:
  ```typescript
  // useMasterCRUD.ts の上部に定義
  function toError(err: unknown): Error {
      if (err instanceof Error) return err;
      if (err && typeof err === 'object') {
          const obj = err as Record<string, unknown>;
          if (typeof obj.message === 'string') {
              const msg = obj.message;
              const extra = [obj.code, obj.details, obj.hint].filter(Boolean).join(' | ');
              return new Error(extra ? `${msg} (${extra})` : msg);
          }
      }
      return new Error(String(err));
  }
  ```
  これを用いて、全 catch ブロックの `setError(toError(err))` に置き換える。

### 2. `MasterDataContext.tsx` における `Array.isArray` フォールバックガードの適用
- **事実 (State)**:
  APIのエラーレスポンスや個別レコード返却時などに `vRes.data` などが配列でなくなるリスクがあり、`as unknown as MasterVehicle[]` などのキャストだけでは実行時の `TypeError` (e.g. `map is not a function`) を防げない。
- **判断 (Decision) & 理由 (Reason)**:
  すべてのマスタテーブル取得結果に対して、厳密に `Array.isArray` によるチェックを行い、配列でない場合は空配列 `[]` にフォールバックさせる。

- **提案コード実装案**:
  ```typescript
  setData({
      drivers: Array.isArray(processedDrivers) ? processedDrivers : [],
      vehicles: Array.isArray(vRes.data) ? (vRes.data as unknown as MasterVehicle[]) : [],
      customers: Array.isArray(cRes.data) ? (cRes.data as MasterCustomer[]) : [],
      items: Array.isArray(iRes.data) ? (iRes.data as MasterItem[]) : [],
      customerItemDefaults: Array.isArray(cidRes.data) ? (cidRes.data as unknown as CustomerItemDefault[]) : []
  });
  ```

### 3. `AuthAdapter.ts` におけるタイムアウトPromiseリーク/未解決Rejectionの防止
- **事実 (State)**:
  `Promise.race([queryPromise, timeoutPromise])` において、`queryPromise` が先に解決された後も `timeoutPromise` 内部の `setTimeout` が走り続け、15秒後に `reject(new Error('TIMEOUT_DB_FETCH'))` が発火する。この reject に対応するハンドラがないため、Unhandled Promise Rejection の警告が発生する。
- **判断 (Decision) & 理由 (Reason)**:
  `setTimeout` のタイマーIDを保持し、`Promise.race` が正常終了（解決または別原因での却下）した際に `finally` 節で `clearTimeout` を確実に実行してタイマーをキャンセルする。これにより未解決の reject 発火そのものを抑止する。

- **提案コード実装案**:
  ```typescript
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('TIMEOUT_DB_FETCH')), 15000);
  });
  
  try {
    const { data: staff, error } = await Promise.race([queryPromise, timeoutPromise]);
    
    if (error || !staff) {
      console.warn('[AuthAdapter] Staff record not found by auth_uid. Error:', error);
      const cached = await this.recoverFromCache(session.user.id);
      if (cached) return cached;
      throw new StaffNotFoundError();
    }
    
    // ... 中略（staff 変換処理など） ...
    
    return resolvedStaff;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
  ```

---

## Part 3: 独立した検証手法 (Verification Method)

型リファクタリングおよび修正案が正しく適用されているかを実環境で検証する手順です。

1. **静的型チェックの実行**:
   TypeScriptのコンパイルが正常に通るか、コマンドを実行して検証する。
   ```bash
   npm run type-check
   ```
   エラーログ `tsc_error.log` 等が発生しないことを確認する。

2. **タイムアウト時の挙動テスト (AuthAdapter)**:
   `AuthAdapter.ts` のモックテスト、または実ネットワークを遮断させた状態でログイン処理を走り込ませ、15秒後に期待通り `TIMEOUT_DB_FETCH` のエラーがコンソールに出力され、アプリケーションがクラッシュ（無限ハング）せずにIndexedDBキャッシュの復旧ルートに進むかを確認する。
   また、通常ログイン成功時に15秒経過後、未処理Rejectionの警告（Unhandled Promise Rejection）が出ないことを確認する。

3. **不正データインジェクションの確認 (MasterDataContext)**:
   `nativeSupabaseFetch` の戻り値をモックし、`vRes.data` に `{ error: "some error" }` などのオブジェクトを返却させた際に、フロントエンドがクラッシュせず空の配列として認識されるかをユニットテスト等で担保する。
