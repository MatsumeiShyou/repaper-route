# Milestone 4 Verification & Stress Test Report

## 1. Observation (観測事実)

検証対象のソースコードおよびテストコードにおいて、以下の実装と挙動を観測しました。

### A. `useDataSync.ts`
- **レースコンディション防止処理**:
  - 40-43行目: `activeDateRef` を用いて現在の `dateKey` を追跡。
    ```typescript
    const activeDateRef = useRef(dateKey);
    useEffect(() => {
        activeDateRef.current = dateKey;
    }, [dateKey]);
    ```
  - 140-143行目: ローカルスコープの `dateKey` が最新の `activeDateRef.current` と不一致の場合、古い取得結果を破棄。
    ```typescript
    if (dateKey !== activeDateRef.current) {
        console.log(`[useDataSync] Discarding stale fetch result for date: ${dateKey}`);
        return;
    }
    ```
- **データベース破損/データ汚染対策**:
  - 69-94行目 (`courses` のマッピング時) および 109-136行目 (`jobs` のマッピング時) にて、個別レコードのマッピング処理を `try-catch` で囲み、異常なレコード（`null` や型違いなど）を検知した場合は警告を出力して `null` を返し、`.filter(Boolean)` で除外する設計。
- **データベース接続エラーの堅牢性**:
  - 12-33行目: `getErrorMessage` 関数により、データベース接続エラーや `Failed to fetch` などのメッセージを検知し、ユーザーフレンドリーな `"データ取得エラー"` に統一してフォールバックする実装。

### B. `useDataSync.test.tsx`
- **テストケース構成**:
  - 124-230行目: レースコンディション検証テスト `should trigger race condition when dateKey changes rapidly without cleanup`
  - 232-254行目: 破損データ検証テスト `should crash or fail to load data when corrupt database payload contains null elements in jobs`
  - 256-275行目: プレーンオブジェクトエラー検証テスト `should format error using fallback string when Supabase returns a plain object error without inheriting from Error`

### C. `MasterDataLayout.tsx`
- **Deep Fetchの実装**:
  - 173-201行目: `handleEdit` 内でビューと実テーブルが異なる場合に `nativeSupabaseFetch` を用いて最新データを同期取得（Deep Fetch）する設計。
  - 200行目: 非同期フェッチ完了後に `setIsModalOpen(true)` を実行。

### D. コマンド実行結果
- `npm run type-check`: コンパイルエラーなしで正常終了。
- `npm run test -- --run`: 全95テストケース（`useDataSync.test.tsx` を含む）が正常にパス。

---

## 2. Logic Chain (論理展開)

観測された事実に基づき、以下の論理でMilestone 4修正箇所の正確性と潜在的リスクを評価します。

1. **レースコンディション防止の妥当性**:
   - 急激な日付切り替え時、複数の非同期フェッチが並行して走りますが、`activeDateRef.current` が常に最新の `dateKey` を保持するため、過去のリクエスト完了時に `dateKey !== activeDateRef.current` で早期リターンします (Observation A)。
   - この挙動は `useDataSync.test.tsx` のレースコンディションテストにより物理的にシミュレートされ、検証に合格しているため (Observation B, D)、極めて堅牢であると判断できます。

2. **データベース破損時のエラー耐性**:
   - `coursesData` や `jobsData` の中に一部破損したデータ（例: `null` 要素）が混入していても、ループ全体がクラッシュせず、正常なレコードのみをフィルタリングして読み込めます (Observation A)。
   - これもテストケース `should crash or fail to load data when corrupt database payload contains null elements in jobs` の通過により検証済みです (Observation B, D)。

3. **【潜在的リスク】`MasterDataLayout.tsx` の Deep Fetch における競合状態**:
   - `handleEdit` 内で Deep Fetch を行う際、モーダルを開く処理 (`setIsModalOpen(true)`) が非同期処理（`nativeSupabaseFetch`）の完了後に配置されています (Observation C)。
   - Fetch実行中、テーブル行に対して `pointer-events: none` などの制限やクリック防止（Disabled）の制御が行われていません。
   - そのため、遅延が発生している間にユーザーが「行A」をクリックした直後に「行B」を連打した場合、並行してDeep Fetchが走り、先に完了した方のモーダルが開いた後、遅れて完了した方のデータにモーダルの表示内容が勝手に切り替わってしまう（あるいは異なる行のフォームが開く）競合状態が発生する可能性があります。

---

## 3. Caveats (警告・未調査事項)

- 本テストは Vitest + JSDOM によるシミュレーション環境での検証であり、実際の Supabase サーバー上のネットワーク遅延や Supabase Realtime 同期との完全な統合環境下での検証は行っていません。
- `useDataSync.ts` は3つのクエリ（`courses`, `course_assignments`, `jobs`）をシーケンシャルに `await` 実行しています。超高負荷環境下では、これを `Promise.all` に並列化しない場合、合計レイテンシが増大し、結果として不要なデータベース負荷とレスポンスの遅延を引き起こす懸念があります。

---

## 4. Conclusion (結論)

- **`useDataSync.ts` およびそのテストコード**:
  - レースコンディション、破損データのフィルタリング、および接続エラー時のエラーハンドリングについて、想定通りの仕様で堅牢に実装されており、ストレステストもパスしています。よって、**完全に合格**と判定します。
- **`MasterDataLayout.tsx`**:
  - ビュー制限を回避するための Deep Fetch 機構は仕様通り動作しますが、非同期ロード中の再クリックに対する保護がなく、**UIレベルでの競合状態 (Race Condition) および遅延時のクリック反応の悪さ**が残存しています。
  - **改善推奨案**: `handleEdit` 開始時に直ちに `isModalOpen(true)` にしてモーダルを立ち上げ、モーダル内部で `isDeepFetching` 中のスピナーを表示する、もしくはロード中にテーブル全体のクリックを無効化する処理の追加を推奨します。

---

## 5. Verification Method (再現・検証手順)

以下の手順で、本レポートの検証内容を再現できます。

1. **型チェックの実行**:
   ```bash
   npm run type-check
   ```
   コンパイルエラーが出ないことを確認します。

2. **テストコードの実行**:
   ```bash
   npm run test -- --run
   ```
   `useDataSync.test.tsx` を含むすべてのテストが正常にパスすることを確認します。

3. **競合状態の確認 (コードインスペクション)**:
   - `apps/repaper-route/src/components/MasterDataLayout.tsx` の 173-201行目を確認し、`setIsModalOpen(true)` が `await` の後に呼ばれており、実行中にクリックをガードする処理がないことを確認します。
