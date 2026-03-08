# SSOT Patterns: 宣言的 UI における状態管理の正典

## 1. 原則: F-SSOT (Pure Derived State)
React 等の宣言的 UI フレームワークにおいて、**「他の状態から論理的に算出可能な値」**を `useState` に保持してはなりません。これは不整合（状態の幻覚）を引き起こす最大の原因です。

## 2. アンチパターン: 命令的同期 (Imperative Sync)
以下のコードは、`useState` を「影の状態」として使い、副作用（`useEffect`）で同期させようとしています。

### ❌ 悪い例 (Anti-pattern)
```typescript
const [currentDate, setCurrentDate] = useState(new Date());
const [isPastDate, setIsPastDate] = useState(false); // 影の状態

useEffect(() => {
  // currentDate が変わった後、このエフェクトが走るまで isPastDate は古いまま
  setIsPastDate(isPastDay(currentDate)); 
}, [currentDate]);

// 描画時、currentDate は最新だが isPastDate が古い「1フレームの不整合」が発生する
```

### 🚩 リスク
- **状態の幻覚（Ghost Mode）**: 通信待ちや処理の合間に、古い状態に基づいたボタンやバッジが表示される。
- **レースコンディション**: 非同期処理が重なった際、どの `set...` が最後に反映されるか保証されない。

## 3. 正典: 宣言的導出 (Declarative Derivation)
真実源（Source of Truth）から `useMemo` または純粋な変数定義で直接算出します。

### ✅ 良い例 (Best Practice)
```typescript
const [currentDate, setCurrentDate] = useState(new Date());

// 真実源から直接算出。遅延も不整合も物理的に発生しない。
const isPastDate = useMemo(() => isPastDay(currentDate), [currentDate]);
```

## 4. 実戦例: 配車盤カレンダーの「Ghost Mode」対策

### Before (バグ発生時)
```typescript
const [editMode, setEditMode] = useState(false);
const [isPastDate, setIsPastDate] = useState(false);

useEffect(() => {
  setIsPastDate(isPastDay(selectedDate));
  // 過去なら編集オフにするという「命令」が必要
  if (isPastDay(selectedDate)) setEditMode(false);
}, [selectedDate]);
```

### After (100pt Soundness)
```typescript
const isPastDate = useMemo(() => isPastDay(selectedDate), [selectedDate]);
const isLockedByMe = useMemo(() => lockedBy === currentUserId, [lockedBy]);

// 全ての文脈から「編集可能か」を自動導出
const editMode = useMemo(() => {
  return isLockedByMe && !isPastDate && hasPermission;
}, [isLockedByMe, isPastDate, hasPermission]);
```

## 5. 移行指針
1.  `useState` を追加する前に、**「既にある値から計算できないか？」**を自問する。
2.  `useEffect` の中で `setXXX` を呼んで他の State と同期させている箇所を見つけたら、それはリファクタリングのサインである。
3.  複雑な条件分岐は `useMemo` 内に閉じ込めることで、描画ロジックを純粋に保つ。
