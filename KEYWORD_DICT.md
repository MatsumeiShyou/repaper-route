# KEYWORD_DICT.md — プロジェクト公式キーワード辞書

> **目的**: `check_debt.js` がタスク開始時に関連する過去エラーパターンを照合・注入するための語彙統制ファイル。  
> **管理者**: AI（自動追加） / 変更履歴は本ファイル末尾の `## Changelog` に記録すること。  
> **参照元**: `DEBT_AND_FUTURE.md` の `#trigger` タグはこの辞書に登録済みの語のみ使用可。

---

## 表記統制ルール（MUST）

| ルール | 内容 |
|---|---|
| ケース | ケバブケース優先（`aria-label` / `drag-and-drop`） |
| ファイル名 | そのまま記載（`SemanticExtractor` / `AGENTS.md`） |
| 言語 | 英語のみ（日本語キーワード禁止 — 照合スクリプトの複雑化を防ぐ） |
| 略語 | 禁止（正式名称のみ登録。`SA` → `SemanticExtractor` が既存なら `SA` は追加不可） |
| 表記揺れ | 禁止（`ariaLabel` / `aria_label` は `aria-label` が既存なら追加不可） |

---

## 辞書本体

### sada（SADAテスト関連）

```
sada
├── core
│   ├── SemanticExtractor
│   ├── DeltaManager
│   └── AITestBatcher
├── aria
│   ├── aria-label
│   ├── aria-labelledby
│   ├── aria-grabbed
│   ├── aria-dropeffect
│   ├── aria-expanded
│   ├── aria-selected
│   ├── aria-disabled
│   ├── role
│   └── accname
└── hash
    ├── merkle
    ├── simpleHash
    ├── isMeaningful
    └── snapshot
```

### ui（UIコンポーネント関連）

```
ui
├── component
│   ├── BoardCanvas
│   ├── JobCard
│   ├── AdminDashboard
│   └── MasterDataLayout
└── interaction
    ├── drag-and-drop
    ├── modal
    └── toast
```

### db（DB・バックエンド関連）

```
db
├── schema
│   ├── drivers
│   ├── routes
│   ├── profiles
│   └── supabase
└── rpc
    └── rpc_execute_master_update
```

### infra（インフラ・環境関連）

```
infra
├── env
│   ├── PowerShell
│   ├── UTF-8
│   ├── UTF-16
│   ├── jsdom
│   └── vitest
└── governance
    ├── check_debt
    ├── pre_flight
    ├── check_seal
    └── Husky
```

### governance（ガバナンス・憲法関連）

```
governance
├── protocol
│   ├── DXOS
│   ├── AGENTS.md
│   ├── AMPLOG
│   └── Debt-Protocol
└── lifecycle
    ├── DEBT_ARCHIVE
    ├── seal
    └── AMP
```

---

## AIによる自動追加ルール

### 追加トリガー条件（全て満たす場合のみ追加）

1. 既存キーワードに完全一致・部分一致・表記揺れが存在しない
2. `DEBT_AND_FUTURE.md` の `#trigger` として **2回以上** 使用された実績がある
3. 特定のドメイン（`sada` / `ui` / `db` / `infra` / `governance`）に明確に帰属できる

### 追加禁止パターン

- 英語/日本語の表記揺れ（既存語と同義）
- 略語（正式名称が既存の場合）
- 一般語（`error` / `fix` / `update` / `state` 等、固有名詞でないもの）
- ドメインをまたぐ曖昧語

### 追加時の記載フォーマット（必須）

辞書本体の該当箇所にキーワードを追記した上で、本ファイル末尾の `## Changelog` に以下を記録する。

```
| YYYY-MM-DD | 追加 | {キーワード} | {domain}/{subcategory} | DEBT#{エントリID}で2回使用 |
```

---

## check_debt.js との照合仕様

タスク開始時、`check_debt.js` は以下のロジックでキーワードを照合する。

```javascript
// タスク記述からキーワードを抽出
const taskKeywords = extractKeywords(taskDescription);

// 関連エントリを照合（#triggerとtaskKeywordsの積集合）
const relevant = debts.filter(debt =>
  debt.trigger.some(t => taskKeywords.includes(t)) &&
  debt.severity !== 'low' &&
  isWithinRetention(debt.date, debt.severity)
);

// criticalは常時注入（条件なし）
const critical = debts.filter(d => d.severity === 'critical');

// 重複排除して注入
const injected = deduplicate([...critical, ...relevant]);
```

### 保持期間ルール

| severity | 注入条件 |
|---|---|
| critical | 常時注入・上限なし |
| medium | 登録日から90日以内のみ |
| low | 注入しない（記録のみ） |

### severityの機械的判定基準（AIの裁量なし）

| 条件 | severity |
|---|---|
| 本番データ・認証・スキーマに影響する | critical |
| テストが落ちる / AIが同種の誤判断を繰り返す | medium |
| 将来の拡張に影響する・現時点では動作する | low |

---

## Changelog

| 日付 | 操作 | キーワード | 配置先 | 理由 |
|---|---|---|---|---|
| 2026-02-22 | 初期登録 | （全エントリ） | 全ドメイン | 辞書新規作成 |
