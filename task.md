# リスクティア：T3 垂直統合タスクリスト (Phase 3 - v3.1)

## Phase 2: Auth 基盤の核心刷新 (完了)
- [x] 2.1 `AuthAdapter.ts` 拡張
- [x] 2.2 `authStore.ts` 物理パージ強化
- [x] 2.3 `AuthProvider.tsx` 刷新 (State Machine)
- [x] 2.4 UI ガードレール転換 (Permission-First)
- [x] 2.5 `AuthErrorBoundary.tsx` 新規作成

## Phase 3: スキーマ統合と最終物理封印 (v3.1)
- [x] 3.1 データベース層：`staffs` スキーマ拡張
    - [x] 3.1.1 マイグレーション SQL 生成 (`device_mode`, `vehicle_info`, `can_edit_board`)
    - [x] 3.1.2 データ移行 SQL の実行（型キャスト修正を含む）
    - [x] 3.1.3 RLS ポリシーの物理移植
    - [x] 3.1.4 `npm run gen:types` による型定義の再構成
- [x] 3.2 認証・ストレージ層：市民属性の取り込み
    - [x] 3.2.1 `src/os/auth/types.ts` での `Staff` 型更新
    - [x] 3.2.2 `AuthAdapter.ts` での属性取得ロジック追加
    - [x] 3.2.3 `authStore.clear()` によるキャッシュ整合性の強制確保
- [x] 3.3 アプリケーション層：`profiles` 依存の物理パージ
    - [x] 3.3.1 `InteractionContext.tsx` の staffs 移行
    - [x] 3.3.2 `useBoardData.ts` の staffs 移行（AppUser → Staff）
    - [x] 3.3.3 `masterSchema.ts` の driverSchema を `staffs` テーブルへ変更
    - [x] 3.3.4 `JobDetailPanel.tsx` の AppUser → Staff 置換
    - [x] 3.3.5 `ProfilePortal.tsx` を Supabase Email Auth に刷新
- [x] 3.4 最終検証と封印
    - [x] 3.4.1 `MasterSchema` 型定義の拡張（MasterColumn, viewName, rpcTableName 等）
    - [x] 3.4.2 `npm run build` による全域型検証（exit 0 確認）
    - [x] 3.4.3 垂直統合「Gate」の物理封印宣言（`npm run done`）

---
**現在のモード**: 標準モード
**リスクスコア**: 合計 6 [2/2/2]
**次のアクション**: `npm run done` による物理封印
