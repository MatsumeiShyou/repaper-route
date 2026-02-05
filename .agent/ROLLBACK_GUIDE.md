# ロールバックガイド

> **目的**: 各Phaseの変更を安全かつ迅速にロールバックする手順  
> **最終更新**: 2026-02-04

---

## 🚨 緊急ロールバック（即座）

### Feature Flag によるロールバック（1秒）

```javascript
// src/config/featureFlags.js を編集
export const FEATURE_FLAGS = {
  USE_REFACTORED_BOARD: false,  // ← trueをfalseに変更
  USE_REPOSITORY_LAYER: false,
  USE_ZUSTAND_STATE: false,
  USE_VOICE_INPUT: false,
  USE_GAMIFICATION: false,
};
```

**手順**:
1. `src/config/featureFlags.js` を開く
2. 該当フラグを `false` に変更
3. ファイル保存
4. ブラウザリロード（F5）

→ **即座に旧実装に戻ります**

---

## 📋 Phase別ロールバック手順

### Phase 0: テストインフラのロールバック

#### 完全削除（10分）
```bash
# テスト関連パッケージ削除
npm uninstall vitest @testing-library/react @testing-library/jest-dom @vitest/ui

# ファイル削除
Remove-Item vitest.config.js
Remove-Item -Recurse src/test

# package.json から test スクリプト削除（手動）
```

#### 部分ロールバック（テストだけ削除、インフラは残す）
```bash
# テストファイルのみ削除
Remove-Item -Recurse src/test
```

**影響範囲**: 既存コードへの影響なし（テスト基盤のみ）

---

### Phase 1: データベーススキーマのロールバック

#### Supabase SQL Editor で実行（5分）

```sql
-- 新規テーブルを削除（CASCADE で関連データも削除）
DROP VIEW IF EXISTS v_customer_items_summary;
DROP TABLE IF EXISTS job_items CASCADE;
DROP TABLE IF EXISTS customer_items CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 既存テーブル（drivers, jobs, splits）は無傷
```

#### Repository層の削除（オプション）
```bash
# Repository ファイル削除
Remove-Item src/lib/repositories/itemRepository.js
Remove-Item src/lib/repositories/customerRepository.js
Remove-Item src/test/itemRepository.test.js
```

**影響範囲**: 
- ✅ 既存の `drivers`, `jobs`, `splits` は無変更
- ⚠️ `customers`, `items` データは完全削除（バックアップ推奨）

---

### Phase 2: リファクタリングのロールバック

#### Feature Flagで無効化（1秒）
```javascript
USE_REFACTORED_BOARD: false  // ← 旧 BoardCanvas.jsx に戻る
USE_ZUSTAND_STATE: false      // ← useState に戻る
```

#### ファイル削除（完全撤退する場合）
```bash
# 新規作成ファイルを削除
Remove-Item src/features/board/BoardCanvas_v2.jsx
Remove-Item -Recurse src/features/board/hooks
Remove-Item -Recurse src/features/board/components_v2
Remove-Item src/stores/boardStore.js

# Feature Flag基盤も削除する場合
Remove-Item src/config/featureFlags.js
Remove-Item src/hooks/useFeatureFlag.js
Remove-Item src/test/featureFlags.test.js
```

**影響範囲**: 既存の `BoardCanvas.jsx` は無変更（完全な保険）

---

### Phase 3: UX改善のロールバック

#### 音声入力の無効化
```javascript
USE_VOICE_INPUT: false
```

#### ゲーミフィケーションの無効化
```javascript
USE_GAMIFICATION: false
```

**影響範囲**: なし（実験的機能のため、無効化しても既存機能は動作）

---

## 🔄 Git によるロールバック

### ブランチの切り替え（1分）
```bash
# 安全な main ブランチに戻る
git checkout main

# 実験ブランチを削除
git branch -D feature/phase2-refactoring
```

### コミット単位のロールバック（revert）
```bash
# 特定のコミットだけを取り消す
git log --oneline  # コミットIDを確認
git revert abc123  # 該当コミットをrevert
```

### 強制リセット（注意: 未コミット変更は失われる）
```bash
# 最後の安定コミットに戻る
git reset --hard HEAD~1
```

---

## 📊 ロールバック判断基準

以下の場合は即座にロールバック推奨:

| 症状 | 判断 | 手段 |
|------|------|------|
| 新機能でコンソールエラー | 即座にロールバック | Feature Flag → false |
| テスト失敗率30%以上 | 即座にロールバック | Git revert |
| パフォーマンス低下（50ms以上） | 即座にロールバック | Feature Flag → false |
| ユーザーから「使いづらい」 | 24時間以内にロールバック | Feature Flag → false |
| 既存機能の動作不良 | 即座にロールバック | Git reset --hard |

---

## 🧪 ロールバック検証手順

ロールバック後、以下を確認:

### 1. アプリケーション起動確認
```bash
npm run dev
```
→ エラーなく起動するか

### 2. 主要機能の動作確認
- [ ] ジョブのドラッグ&ドロップ
- [ ] Undo/Redo
- [ ] Supabase保存

### 3. テスト実行
```bash
npm test
```
→ 全テスト成功するか

### 4. コンソールエラー確認
→ ブラウザコンソールにエラーがないか

---

## 📝 ロールバック記録

ロールバック実施時は、AMPLOG に記録すること:

```markdown
| 日時 | Phase | 理由 | 手段 | 結果 |
|------|-------|------|------|------|
| 2026-02-XX | Phase 2 | パフォーマンス低下 | Feature Flag | 成功 |
```

---

**重要: ロールバックは「失敗」ではなく「安全策」です。躊躇せず実行してください。**
