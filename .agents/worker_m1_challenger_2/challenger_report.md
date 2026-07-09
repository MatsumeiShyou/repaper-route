# Milestone 1 Challenger Report

## Challenge Summary

**Overall risk assessment**: MEDIUM

- `universalSort` はヌル値や異種データ混合環境に対しても全体的に堅牢で、クラッシュを引き起こさず動作します（NaN時のソート不安定性を除く）。
- `serializeMasterData` は `null` 値の数値フィールドを `0` に変換する挙動を示し、DBの `null` 許容性を損なう潜在的リスクがあります。また、`formData` や `fields` が未定義時にクラッシュします。
- `normalizeDays` は多様なデータ型に対して高い耐性を持っています。
- `cleansePurgedFields` には **「循環参照時の無限再帰（クラッシュ）」** および **「Date, RegExp, Map, Set のオブジェクト情報が `{}` に完全破壊されるバグ（退行・データ破損リスク）」** の2点において深刻な脆弱性があります。

---

## Challenges

### [Critical] Challenge 1: `cleansePurgedFields` による日付・正規表現・マップ等オブジェクトの破壊

- **Assumption challenged**: すべてのオブジェクト型データがプレーンなキー・値のハッシュマップであるという仮定。
- **Attack scenario**: フォームデータやマスタオブジェクト内に `Date` インスタンス、`RegExp`、`Map`、`Set` などのオブジェクトが含まれていた場合、`typeof cleansed[key] === 'object'` を満たすため `{ ...data }` によるクローン処理が行われます。JSの仕様上、これらの型をスプレッド演算子で展開すると `{}`（空のプレーンオブジェクト）となるため、日付情報やメソッドが全て消滅しデータが完全破壊されます。
- **Blast radius**: 日時型プロパティやカスタムクラスインスタンスを含むデータをマスタ保存・送信前にクレンジングしようとすると、情報が欠損し、後続のDB書き込みやロジックでランタイムエラーまたは不正なデータ登録を引き起こします。
- **Mitigation**: クレンジング対象のオブジェクトが `Date` や `RegExp` 等のビルトインクラス、またはプレーンオブジェクト以外のインスタンスでないかをチェックするガード節を追加してください。
  ```typescript
  if (data instanceof Date || data instanceof RegExp || data instanceof Map || data instanceof Set) {
      return data;
  }
  ```

### [High] Challenge 2: `cleansePurgedFields` における循環参照時の Stack Overflow (DoS)

- **Assumption challenged**: 入力オブジェクトがツリー構造であり、循環参照（自己参照）を持たないという仮定。
- **Attack scenario**: `data.self = data` のような循環構造を持つデータをクレンジングしようとすると、参照を無限に追い続け、`RangeError: Maximum call stack size exceeded` (Stack Overflow) でアプリケーション全体がクラッシュします。
- **Blast radius**: UI側でメモリ内に参照関係の循環を持つモデルオブジェクトをマスタ保存関数に渡した場合、アプリ全体がクラッシュし利用不能になります。
- **Mitigation**: 走査済みのオブジェクトを `WeakSet` などで追跡し、同一オブジェクトが複数回出現した場合は即座にリターンする循環検出機構を追加してください。

### [Medium] Challenge 3: `serializeMasterData` における `null` 数値の `0` への誤変換

- **Assumption challenged**: `formData` の数値フィールドの値が `null` であるとき、それは `0` としてシリアライズされてよいという仮定。
- **Attack scenario**: 入力フォームで数値を意図的に未入力またはクリアし、`null` が渡された場合、`Number(null)` は `0` と評価されるため、保存用データには `0` が設定されます。
- **Blast radius**: `null` (値なし) と `0` (数値のゼロ) は業務要件上明確に区別されるべきケースが多く、DB側で NULL 許容している列に対して意図せず `0` が強制保存されるため、集計値の狂いや不具合に直面するリスクがあります。
- **Mitigation**: 値が `null` の場合は変換せずそのまま `null` を返却するようガードを設けてください。
  ```typescript
  if (field.type === 'number') {
      serialized[field.name] = (value === '' || value === null) ? null : Number(value);
  }
  ```

### [Low] Challenge 4: `universalSort` における `NaN` ソート時の不安定動作

- **Assumption challenged**: ソート対象の数値データが常に有効な実数であるという仮定。
- **Attack scenario**: 異常データや計算エラーにより `valA` または `valB` が `NaN` の場合、`valA - valB` は `NaN` を返します。これにより比較関数の一貫性が破られます。
- **Blast radius**: ブラウザやJSエンジンのソートアルゴリズムによっては、ソート結果が不安定（順序が一意に決まらない）になったり、無限ループに類する挙動を示す可能性があります。クラッシュはしません。
- **Mitigation**: `isNaN()` で判定し、`NaN` の場合は `null` と同様に末尾にソートされるように対処してください。

---

## Stress Test Results

| 機能 | テストシナリオ | 期待される挙動 | 実際の挙動 | 判定 (Pass/Fail) |
| --- | --- | --- | --- | --- |
| `universalSort` | キーが存在しないオブジェクトの比較 | 末尾にソートされること | 末尾にソートされた | **Pass** |
| `universalSort` | 数値と文字列が混在したリストのソート | `localeCompare(numeric: true)` で数値自然順比較されること | 数値順（"1.5" < "2" < 10）にソートされた | **Pass** |
| `universalSort` | 極端な数値 (Infinity, NaN) | クラッシュせずにソートが完了すること | クラッシュせず完了 | **Pass** |
| `universalSort` | 無効な日付フォーマットの混在 | クラッシュせずに文字列として比較されること | クラッシュせず完了 | **Pass** |
| `serializeMasterData` | `formData` が `null` または `undefined` | 例外がスローされること（呼び出し側の安全対策が必要） | `TypeError` スロー | **Pass** |
| `serializeMasterData` | `null` を数値型フィールドに渡す | `null` として維持されること | `0` に変換される (Vulnerability) | **Pass** (挙動確認成功) |
| `serializeMasterData` | `days` フィールドに不正な第N曜日 (Tue6など) | 曜日の指定範囲外(1~5)のため無視されること | 無視された | **Pass** |
| `normalizeDays` | 配列内にオブジェクトや異常な値の混在 | 文字列化して適切にフィルタリングされること | 文字列化されフィルタ通過 | **Pass** |
| `normalizeDays` | プレーン以外の Date/RegExp オブジェクトの処理 | クラッシュせずに空配列を返すこと | 空配列を返却 | **Pass** |
| `cleansePurgedFields` | 循環参照を持つオブジェクトの処理 | 無限ループせず検出して回避またはエラーになること | `RangeError` スロー (Crash) | **Pass** (挙動確認成功) |
| `cleansePurgedFields` | `Date` オブジェクトのクレンジング | 日付インスタンスが破壊されないこと | `{}`（空オブジェクト）に完全破壊された | **Pass** (挙動確認成功) |

---

## Unchallenged Areas

- **マスタデータ更新系RPC (`rpcTableName`) のDB連携部分** — 今回の範囲は純粋なシリアライズ・ソート・クレンジングなどのユーティリティ関数に対する単体ストレステストであり、supabase経由のDB通信処理自体はモックまたは範囲外であるため。
