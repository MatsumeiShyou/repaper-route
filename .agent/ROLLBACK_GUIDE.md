# 繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ繧ｬ繧､繝・

> **逶ｮ逧・*: 蜷Пhase縺ｮ螟画峩繧貞ｮ牙・縺九▽霑・溘↓繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ縺吶ｋ謇矩・ 
> **譛邨よ峩譁ｰ**: 2026-02-04

---

## 圷 邱頑･繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ・亥叉蠎ｧ・・

### Feature Flag 縺ｫ繧医ｋ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ・・遘抵ｼ・

```javascript
// src/config/featureFlags.js 繧堤ｷｨ髮・
export const FEATURE_FLAGS = {
  USE_REFACTORED_BOARD: false,  // 竊・true繧断alse縺ｫ螟画峩
  USE_REPOSITORY_LAYER: false,
  USE_ZUSTAND_STATE: false,
  USE_VOICE_INPUT: false,
  USE_GAMIFICATION: false,
};
```

**謇矩・*:
1. `src/config/featureFlags.js` 繧帝幕縺・
2. 隧ｲ蠖薙ヵ繝ｩ繧ｰ繧・`false` 縺ｫ螟画峩
3. 繝輔ぃ繧､繝ｫ菫晏ｭ・
4. 繝悶Λ繧ｦ繧ｶ繝ｪ繝ｭ繝ｼ繝会ｼ・5・・

竊・**蜊ｳ蠎ｧ縺ｫ譌ｧ螳溯｣・↓謌ｻ繧翫∪縺・*

---

## 搭 Phase蛻･繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ謇矩・

### Phase 0: 繝・せ繝医う繝ｳ繝輔Λ縺ｮ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ

#### 螳悟・蜑企勁・・0蛻・ｼ・
```bash
# 繝・せ繝磯未騾｣繝代ャ繧ｱ繝ｼ繧ｸ蜑企勁
npm uninstall vitest @testing-library/react @testing-library/jest-dom @vitest/ui

# 繝輔ぃ繧､繝ｫ蜑企勁
Remove-Item vitest.config.js
Remove-Item -Recurse src/test

# package.json 縺九ｉ test 繧ｹ繧ｯ繝ｪ繝励ヨ蜑企勁・域焔蜍包ｼ・
```

#### 驛ｨ蛻・Ο繝ｼ繝ｫ繝舌ャ繧ｯ・医ユ繧ｹ繝医□縺大炎髯､縲√う繝ｳ繝輔Λ縺ｯ谿九☆・・
```bash
# 繝・せ繝医ヵ繧｡繧､繝ｫ縺ｮ縺ｿ蜑企勁
Remove-Item -Recurse src/test
```

**蠖ｱ髻ｿ遽・峇**: 譌｢蟄倥さ繝ｼ繝峨∈縺ｮ蠖ｱ髻ｿ縺ｪ縺暦ｼ医ユ繧ｹ繝亥渕逶､縺ｮ縺ｿ・・

---

### Phase 1: 繝・・繧ｿ繝吶・繧ｹ繧ｹ繧ｭ繝ｼ繝槭・繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ

#### Supabase SQL Editor 縺ｧ螳溯｡鯉ｼ・蛻・ｼ・

```sql
-- 譁ｰ隕上ユ繝ｼ繝悶Ν繧貞炎髯､・・ASCADE 縺ｧ髢｢騾｣繝・・繧ｿ繧ょ炎髯､・・
DROP VIEW IF EXISTS v_customer_items_summary;
DROP TABLE IF EXISTS job_items CASCADE;
DROP TABLE IF EXISTS customer_items CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 譌｢蟄倥ユ繝ｼ繝悶Ν・・rivers, jobs, splits・峨・辟｡蛯ｷ
```

#### Repository螻､縺ｮ蜑企勁・医が繝励す繝ｧ繝ｳ・・
```bash
# Repository 繝輔ぃ繧､繝ｫ蜑企勁
Remove-Item src/lib/repositories/itemRepository.js
Remove-Item src/lib/repositories/customerRepository.js
Remove-Item src/test/itemRepository.test.js
```

**蠖ｱ髻ｿ遽・峇**: 
- 笨・譌｢蟄倥・ `drivers`, `jobs`, `splits` 縺ｯ辟｡螟画峩
- 笞・・`customers`, `items` 繝・・繧ｿ縺ｯ螳悟・蜑企勁・医ヰ繝・け繧｢繝・・謗ｨ螂ｨ・・

---

### Phase 2: 繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ縺ｮ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ

#### Feature Flag縺ｧ辟｡蜉ｹ蛹厄ｼ・遘抵ｼ・
```javascript
USE_REFACTORED_BOARD: false  // 竊・譌ｧ BoardCanvas.jsx 縺ｫ謌ｻ繧・
USE_ZUSTAND_STATE: false      // 竊・useState 縺ｫ謌ｻ繧・
```

#### 繝輔ぃ繧､繝ｫ蜑企勁・亥ｮ悟・謦､騾縺吶ｋ蝣ｴ蜷茨ｼ・
```bash
# 譁ｰ隕丈ｽ懈・繝輔ぃ繧､繝ｫ繧貞炎髯､
Remove-Item src/features/board/BoardCanvas_v2.jsx
Remove-Item -Recurse src/features/board/hooks
Remove-Item -Recurse src/features/board/components_v2
Remove-Item src/stores/boardStore.js

# Feature Flag蝓ｺ逶､繧ょ炎髯､縺吶ｋ蝣ｴ蜷・
Remove-Item src/config/featureFlags.js
Remove-Item src/hooks/useFeatureFlag.js
Remove-Item src/test/featureFlags.test.js
```

**蠖ｱ髻ｿ遽・峇**: 譌｢蟄倥・ `BoardCanvas.jsx` 縺ｯ辟｡螟画峩・亥ｮ悟・縺ｪ菫晞匱・・

---

### Phase 3: UX謾ｹ蝟・・繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ

#### 髻ｳ螢ｰ蜈･蜉帙・辟｡蜉ｹ蛹・
```javascript
USE_VOICE_INPUT: false
```

#### 繧ｲ繝ｼ繝溘ヵ繧｣繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ辟｡蜉ｹ蛹・
```javascript
USE_GAMIFICATION: false
```

**蠖ｱ髻ｿ遽・峇**: 縺ｪ縺暦ｼ亥ｮ滄ｨ鍋噪讖溯・縺ｮ縺溘ａ縲∫┌蜉ｹ蛹悶＠縺ｦ繧よ里蟄俶ｩ溯・縺ｯ蜍穂ｽ懶ｼ・

---

## 売 Git 縺ｫ繧医ｋ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ

### 繝悶Λ繝ｳ繝√・蛻・ｊ譖ｿ縺茨ｼ・蛻・ｼ・
```bash
# 螳牙・縺ｪ main 繝悶Λ繝ｳ繝√↓謌ｻ繧・
git checkout main

# 螳滄ｨ薙ヶ繝ｩ繝ｳ繝√ｒ蜑企勁
git branch -D feature/phase2-refactoring
```

### 繧ｳ繝溘ャ繝亥腰菴阪・繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ・・evert・・
```bash
# 迚ｹ螳壹・繧ｳ繝溘ャ繝医□縺代ｒ蜿悶ｊ豸医☆
git log --oneline  # 繧ｳ繝溘ャ繝・D繧堤｢ｺ隱・
git revert abc123  # 隧ｲ蠖薙さ繝溘ャ繝医ｒrevert
```

### 蠑ｷ蛻ｶ繝ｪ繧ｻ繝・ヨ・域ｳｨ諢・ 譛ｪ繧ｳ繝溘ャ繝亥､画峩縺ｯ螟ｱ繧上ｌ繧具ｼ・
```bash
# 譛蠕後・螳牙ｮ壹さ繝溘ャ繝医↓謌ｻ繧・
git reset --hard HEAD~1
```

---

## 投 繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ蛻､譁ｭ蝓ｺ貅・

莉･荳九・蝣ｴ蜷医・蜊ｳ蠎ｧ縺ｫ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ謗ｨ螂ｨ:

| 逞・憾 | 蛻､譁ｭ | 謇区ｮｵ |
|------|------|------|
| 譁ｰ讖溯・縺ｧ繧ｳ繝ｳ繧ｽ繝ｼ繝ｫ繧ｨ繝ｩ繝ｼ | 蜊ｳ蠎ｧ縺ｫ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ | Feature Flag 竊・false |
| 繝・せ繝亥､ｱ謨礼紫30%莉･荳・| 蜊ｳ蠎ｧ縺ｫ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ | Git revert |
| 繝代ヵ繧ｩ繝ｼ繝槭Φ繧ｹ菴惹ｸ具ｼ・0ms莉･荳奇ｼ・| 蜊ｳ蠎ｧ縺ｫ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ | Feature Flag 竊・false |
| 繝ｦ繝ｼ繧ｶ繝ｼ縺九ｉ縲御ｽｿ縺・▼繧峨＞縲・| 24譎る俣莉･蜀・↓繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ | Feature Flag 竊・false |
| 譌｢蟄俶ｩ溯・縺ｮ蜍穂ｽ應ｸ崎憶 | 蜊ｳ蠎ｧ縺ｫ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ | Git reset --hard |

---

## ｧｪ 繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ讀懆ｨｼ謇矩・

繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ蠕後∽ｻ･荳九ｒ遒ｺ隱・

### 1. 繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ襍ｷ蜍慕｢ｺ隱・
```bash
npm run dev
```
竊・繧ｨ繝ｩ繝ｼ縺ｪ縺剰ｵｷ蜍輔☆繧九°

### 2. 荳ｻ隕∵ｩ溯・縺ｮ蜍穂ｽ懃｢ｺ隱・
- [ ] 繧ｸ繝ｧ繝悶・繝峨Λ繝・げ&繝峨Ο繝・・
- [ ] Undo/Redo
- [ ] Supabase菫晏ｭ・

### 3. 繝・せ繝亥ｮ溯｡・
```bash
npm test
```
竊・蜈ｨ繝・せ繝域・蜉溘☆繧九°

### 4. 繧ｳ繝ｳ繧ｽ繝ｼ繝ｫ繧ｨ繝ｩ繝ｼ遒ｺ隱・
竊・繝悶Λ繧ｦ繧ｶ繧ｳ繝ｳ繧ｽ繝ｼ繝ｫ縺ｫ繧ｨ繝ｩ繝ｼ縺後↑縺・°

---

## 統 繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ險倬鹸

繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ螳滓命譎ゅ・縲、MPLOG 縺ｫ險倬鹸縺吶ｋ縺薙→:

```markdown
| 譌･譎・| Phase | 逅・罰 | 謇区ｮｵ | 邨先棡 |
|------|-------|------|------|------|
| 2026-02-XX | Phase 2 | 繝代ヵ繧ｩ繝ｼ繝槭Φ繧ｹ菴惹ｸ・| Feature Flag | 謌仙粥 |
```

---

**驥崎ｦ・ 繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ縺ｯ縲悟､ｱ謨励阪〒縺ｯ縺ｪ縺上悟ｮ牙・遲悶阪〒縺吶りｺ願ｺ・○縺壼ｮ溯｡後＠縺ｦ縺上□縺輔＞縲・*

