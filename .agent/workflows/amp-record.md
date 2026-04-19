---
description: AMP (雉・肇螟画峩逕ｳ隲・ 縺ｮ謇ｿ隱崎ｨ倬鹸繧・AMPLOG.jsonl 縺ｫ閾ｪ蜍戊ｿｽ蜉縺吶ｋ・・3 螟画峩譎ゅ・縺ｿ・・---

> [!IMPORTANT]
> 譛ｬ繝ｯ繝ｼ繧ｯ繝輔Ο繝ｼ縺ｯ **T3・磯ｫ倥Μ繧ｹ繧ｯ・牙､画峩譎ゅ・縺ｿ菴ｿ逕ｨ** 縺吶ｋ縲・> T1/T2 縺ｧ縺ｯ繧ｳ繝溘ャ繝医Γ繝・そ繝ｼ繧ｸ隕冗ｴ・ｼ・[T1]`/`[T2]` 繝励Ξ繝輔ぅ繝・け繧ｹ・峨〒莉｣譖ｿ縺吶ｋ縲・
// turbo-all

1. **AMP諠・ｱ縺ｮ蜿朱寔**
   - 繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ莉･荳九・諠・ｱ繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞:
     - **Title**: 螟画峩蜷咲ｧｰ (萓・ "Feature Implementation")
     - **Scope**: 螟画峩蟇ｾ雎｡遽・峇 (萓・ "Add new API endpoint")
     - **Impact**: 譛溷ｾ・＆繧後ｋ蜉ｹ譫・(萓・ "Improved performance")
   - 繝ｦ繝ｼ繧ｶ繝ｼ縺梧ュ蝣ｱ繧堤怐逡･縺励◆蝣ｴ蜷医∫峩蜑阪・繧ｳ繝ｳ繝・く繧ｹ繝医°繧芽・蠕狗噪縺ｫ謗ｨ螳壹＠縺ｦ縺上□縺輔＞縲・
2. **髱槫ｯｾ隧ｱ繝｢繝ｼ繝峨〒險倬鹸**
   ```powershell
   node .agent/scripts/record_amp.js --title "<Title>" --scope "<Scope>" --impact "<Impact>"
   ```

3. **Seal讀懆ｨｼ**
   ```powershell
   node .agent/scripts/check_seal.js
   ```
   - `[SUCCESS]` 繧堤｢ｺ隱阪＠縺溘ｉ螳御ｺ・ｒ蝣ｱ蜻翫＠縺ｦ縺上□縺輔＞縲・   - 繧ｨ繝ｩ繝ｼ縺ｮ蝣ｴ蜷医・ Stop Protocol 繧堤匱蜍輔＠縺ｦ縺上□縺輔＞縲・
