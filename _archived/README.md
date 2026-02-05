# アーカイブ済みスキーマファイル

このディレクトリには、統合前・統合後の旧スキーマファイルが保管されています。

## ファイル一覧

### Phase 0-1.5 個別ファイル（2026-02-05 午前）

- **supabase_schema.sql** - 基本テーブル（drivers, jobs, splits）
- **supabase_schema_v2.sql** - 拡張テーブル（items, customers, customer_items, job_items）
- **supabase_profiles_schema.sql** - 認証テーブル（profiles）

### Phase 2 統合（2026-02-05 午後）

- **supabase_schema_unified_v1.sql** - 初回統合版（実構造と不整合あり）

### Phase 2.5 クリーンアップ（2026-02-05 夜）

#### スキーマファイル（src/から移動）
- **schema_jobs.sql** - Phase 0時代の古いjobsテーブル定義（11カラム版）
- **schema_jobs_reset.sql** - Phase 0時代のjobsリセット用（DROP TABLE含む、危険）

#### 試作品（ルートから prototypes/ へ移動）
- **prototypes/ドライバー試作.html** - Phase 0以前のHTML試作品（UI参考用）
- **prototypes/回収アプリソースコード.jsx** - Phase 0以前の初期コード（コンセプト参考用）

**注意**: 試作品は原点回帰・参考用として保管。詳細は [prototypes/README.md](file:///c:/Users/shiyo/開発中APP/RePaper%20Route/_archived/prototypes/README.md) 参照。

---

## 現在の構成（Phase 2.5）

現在は以下のファイルが最新です：

- **supabase_schema_actual.sql** - 実際のSupabase構造を反映した統合スキーマ（9テーブル、冪等性対応）

## Phase 2.5での主な変更

- `routes` テーブル追加（配車計画保存用）
- テーブル名修正（customer_items → customer_item_defaults、job_items → job_contents）
- ID型修正（items, job_contents: text → UUID）
- jobs テーブルを20カラム版に修正
- 冪等性対応（IF NOT EXISTS, ON CONFLICT DO NOTHING）

## アーカイブ日

- Phase 0-1.5: 2026-02-05 午前
- Phase 2: 2026-02-05 午後
