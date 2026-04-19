# SSOT Patterns: 螳｣險逧・UI 縺ｫ縺翫￠繧狗憾諷狗ｮ｡逅・・豁｣蜈ｸ

## 1. 蜴溷援: F-SSOT (Pure Derived State)
React 遲峨・螳｣險逧・UI 繝輔Ξ繝ｼ繝繝ｯ繝ｼ繧ｯ縺ｫ縺翫＞縺ｦ縲・*縲御ｻ悶・迥ｶ諷九°繧芽ｫ也炊逧・↓邂怜・蜿ｯ閭ｽ縺ｪ蛟､縲・*繧・`useState` 縺ｫ菫晄戟縺励※縺ｯ縺ｪ繧翫∪縺帙ｓ縲ゅ％繧後・荳肴紛蜷茨ｼ育憾諷九・蟷ｻ隕夲ｼ峨ｒ蠑輔″襍ｷ縺薙☆譛螟ｧ縺ｮ蜴溷屏縺ｧ縺吶・

## 2. 繧｢繝ｳ繝√ヱ繧ｿ繝ｼ繝ｳ: 蜻ｽ莉､逧・酔譛・(Imperative Sync)
莉･荳九・繧ｳ繝ｼ繝峨・縲～useState` 繧偵悟ｽｱ縺ｮ迥ｶ諷九阪→縺励※菴ｿ縺・∝憶菴懃畑・・useEffect`・峨〒蜷梧悄縺輔○繧医≧縺ｨ縺励※縺・∪縺吶・

### 笶・謔ｪ縺・ｾ・(Anti-pattern)
```typescript
const [currentDate, setCurrentDate] = useState(new Date());
const [isPastDate, setIsPastDate] = useState(false); // 蠖ｱ縺ｮ迥ｶ諷・

useEffect(() => {
  // currentDate 縺悟､峨ｏ縺｣縺溷ｾ後√％縺ｮ繧ｨ繝輔ぉ繧ｯ繝医′襍ｰ繧九∪縺ｧ isPastDate 縺ｯ蜿､縺・∪縺ｾ
  setIsPastDate(isPastDay(currentDate)); 
}, [currentDate]);

// 謠冗判譎ゅ…urrentDate 縺ｯ譛譁ｰ縺縺・isPastDate 縺悟商縺・・繝輔Ξ繝ｼ繝縺ｮ荳肴紛蜷医阪′逋ｺ逕溘☆繧・
```

### 圸 繝ｪ繧ｹ繧ｯ
- **迥ｶ諷九・蟷ｻ隕夲ｼ・host Mode・・*: 騾壻ｿ｡蠕・■繧・・逅・・蜷磯俣縺ｫ縲∝商縺・憾諷九↓蝓ｺ縺･縺・◆繝懊ち繝ｳ繧・ヰ繝・ず縺瑚｡ｨ遉ｺ縺輔ｌ繧九・
- **繝ｬ繝ｼ繧ｹ繧ｳ繝ｳ繝・ぅ繧ｷ繝ｧ繝ｳ**: 髱槫酔譛溷・逅・′驥阪↑縺｣縺滄圀縲√←縺ｮ `set...` 縺梧怙蠕後↓蜿肴丐縺輔ｌ繧九°菫晁ｨｼ縺輔ｌ縺ｪ縺・・

## 3. 豁｣蜈ｸ: 螳｣險逧・ｰ主・ (Declarative Derivation)
逵溷ｮ滓ｺ撰ｼ・ource of Truth・峨°繧・`useMemo` 縺ｾ縺溘・邏皮ｲ九↑螟画焚螳夂ｾｩ縺ｧ逶ｴ謗･邂怜・縺励∪縺吶・

### 笨・濶ｯ縺・ｾ・(Best Practice)
```typescript
const [currentDate, setCurrentDate] = useState(new Date());

// 逵溷ｮ滓ｺ舌°繧臥峩謗･邂怜・縲る≦蟒ｶ繧ゆｸ肴紛蜷医ｂ迚ｩ逅・噪縺ｫ逋ｺ逕溘＠縺ｪ縺・・
const isPastDate = useMemo(() => isPastDay(currentDate), [currentDate]);
```

## 4. 螳滓姶萓・ 驟崎ｻ顔乢繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｮ縲隈host Mode縲榊ｯｾ遲・

### Before (繝舌げ逋ｺ逕滓凾)
```typescript
const [editMode, setEditMode] = useState(false);
const [isPastDate, setIsPastDate] = useState(false);

useEffect(() => {
  setIsPastDate(isPastDay(selectedDate));
  // 驕主悉縺ｪ繧臥ｷｨ髮・が繝輔↓縺吶ｋ縺ｨ縺・≧縲悟多莉､縲阪′蠢・ｦ・
  if (isPastDay(selectedDate)) setEditMode(false);
}, [selectedDate]);
```

### After (100pt Soundness)
```typescript
const isPastDate = useMemo(() => isPastDay(selectedDate), [selectedDate]);
const isLockedByMe = useMemo(() => lockedBy === currentUserId, [lockedBy]);

// 蜈ｨ縺ｦ縺ｮ譁・ц縺九ｉ縲檎ｷｨ髮・庄閭ｽ縺九阪ｒ閾ｪ蜍募ｰ主・
const editMode = useMemo(() => {
  return isLockedByMe && !isPastDate && hasPermission;
}, [isLockedByMe, isPastDate, hasPermission]);
```

## 5. 遘ｻ陦梧欠驥・
1.  `useState` 繧定ｿｽ蜉縺吶ｋ蜑阪↓縲・*縲梧里縺ｫ縺ゅｋ蛟､縺九ｉ險育ｮ励〒縺阪↑縺・°・溘・*繧定・蝠上☆繧九・
2.  `useEffect` 縺ｮ荳ｭ縺ｧ `setXXX` 繧貞他繧薙〒莉悶・ State 縺ｨ蜷梧悄縺輔○縺ｦ縺・ｋ邂・園繧定ｦ九▽縺代◆繧峨√◎繧後・繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ縺ｮ繧ｵ繧､繝ｳ縺ｧ縺ゅｋ縲・
3.  隍・尅縺ｪ譚｡莉ｶ蛻・ｲ舌・ `useMemo` 蜀・↓髢峨§霎ｼ繧√ｋ縺薙→縺ｧ縲∵緒逕ｻ繝ｭ繧ｸ繝・け繧堤ｴ皮ｲ九↓菫昴▽縲・

