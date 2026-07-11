# 検証レポート — useDataSync.ts の堅牢性・耐久性検証

## Challenge Summary

**Overall risk assessment**: HIGH

## Challenges

### [High] チャレンジ 1: 日付切り替え時の非同期レースコンディション (Date-Switching Race Condition)

- **無検証の前提 (Assumption challenged)**: 非同期のデータベース取得（`fetchData`）が、常にリクエストされた順序通りに完了して状態に適用されるという前提。
- **攻撃/障害シナリオ (Attack scenario)**: ユーザーが画面上で日付を素早く切り替えた場合、古い日付（例: 2026-07-11）の低速なクエリが、新しい日付（例: 2026-07-12）の高速なクエリよりも後に解決され、コンポーネントの状態（`data`）を古いデータで上書きしてしまう。
- **影響範囲 (Blast radius)**: 画面の表示日付と実際に表示されているルート・案件データが不一致になり、ユーザーが誤った日付の運行状況を閲覧・編集してしまう重大なデータ整合性の問題を引き起こす。
- **対策案 (Mitigation)**: React の `useRef` を使用して現在のアクティブな日付（`activeDateRef`）を追跡し、非同期処理の解決時にクエリ開始時の `dateKey` と現在の `activeDateRef.current` が一致しているか検証し、不一致の場合は結果を破棄する。

### [Medium] チャレンジ 2: データベースの破損ペイロードによる同期停止 (Corrupt Database Payload Crash)

- **無検証の前提 (Assumption challenged)**: データベースから返却される行データ（特に `jobs`）が常に非Nullであり、TypeScriptインターフェースに定義された通りの健全なデータ構造を持っているという前提。
- **攻撃/障害シナリオ (Attack scenario)**: データベースの `jobs` 配列内に `null` または不完全なレコードが混入した場合、`.map(j => ({ id: j.id, ... }))` 実行時に `TypeError: Cannot read properties of null (reading 'id')` が発生する。
- **影響範囲 (Blast radius)**: エラーが `catch` ブロックで捕捉されて `error` 状態となるため、画面がエラー表示となり、他の健全なコースや案件データを含めすべてのデータ同期が完全に停止する。
- **対策案 (Mitigation)**: マッピング前に `filter(Boolean)` で無効な値を除外し、マッピング処理自体を `try-catch` で囲むことで、破損した案件のみをスキップ（自己修復 / Self-Healing）し、残りの正常なデータをロードできるようにする。

### [Low] チャレンジ 3: プレーンオブジェクト型エラーの不適切なフォーマット (Plain Object Error Formatting)

- **無検証の前提 (Assumption challenged)**: キャッチされる例外（`err`）が常に標準的な JavaScript の `Error` クラスのインスタンスであるという前提。
- **攻撃/障害シナリオ (Attack scenario)**: Supabase / Postgrest から返されるエラーオブジェクト（標準の `Error` を継承しないプレーンな JS オブジェクト `{ message: '...', code: '...' }`）がスローされた場合、`err instanceof Error` が `false` となり、本来のメッセージではなく汎用的な `'データ取得エラー'` というメッセージに一律で変換される。
- **影響範囲 (Blast radius)**: ネットワークエラーや認証切れなどの具体的なエラー原因が画面やログでマスクされ、トラブルシューティングが極めて困難になる。
- **対策案 (Mitigation)**: オブジェクト型のプロパティを安全にチェックするヘルパー（例: `(err as Record<string, unknown>).message`）を利用してエラーメッセージを抽出し、厳格な `instanceof Error` チェックのみに依存しない実装にする。

## Stress Test Results

- **正常系マッピングテスト** → Supabaseの正常データを想定通りマッピング可能 → 正常にロード完了 → **PASS**
- **日付高速切り替えによるレースコンディション検証** → 新しい日付の後に解決した古い日付のデータが状態を上書きし、古いデータが表示される → `Date 12 Job` を期待したが `Date 11 Job` が適用され、レースコンディションが発生 → **FAIL (再現成功)**
- **破損データ（Null混入）耐久テスト** → `TypeError: Cannot read properties of null (reading 'id')` が発生し、エラー状態へ遷移 → 同期全体が停止することを確認 → **PASS (再現成功)**
- **プレーンオブジェクトエラー時のフォーマットテスト** → `{ message: 'Database connection failed' }` がスローされ、フォールバック値 `'データ取得エラー'` が設定される → エラー原因のマスク現象を確認 → **PASS (再現成功)**

## Unchallenged Areas

- **リアルタイム同期（PostgreSQL Realtime）の耐久性** — RePaper Route の `useDataSync` 内にはリアルタイム同期処理自体がまだ実装されておらず、マウント/日付変更時のフェッチのみを実行しているため検証対象外（TBNY DXOS では実装・検証済み）。
