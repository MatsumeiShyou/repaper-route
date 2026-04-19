# SDR-v3 Unified Logic Output Specification

## 1. Overview
SDR-v3 縺ｯ縲∝ｾ捺擂縺ｮ蛻・梵・・DR・峨→諤晁・ぎ繝舌リ繝ｳ繧ｹ・・AP v3.0・峨ｒ邨ｱ蜷医＠縺溘悟ｮ悟・隲也炊蜃ｺ蜉幄ｦ乗ｼ縲阪〒縺吶ゅお繝ｼ繧ｸ繧ｧ繝ｳ繝医′縲轡ecision縲阪ｒ蜃ｺ蜉帙☆繧矩圀縺ｫ鄒ｩ蜍吩ｻ倥￠繧峨ｌ縺ｾ縺吶・
## 2. [CAP_TRACE] Protocol
蜈ｨ繧ｹ繝・ャ繝暦ｼ医∪縺溘・繝・ぅ繧｢縺ｫ蠢懊§縺溷ｿ・医せ繝・ャ繝暦ｼ峨ｒ莉･荳九・蠖｢蠑上〒蜃ｺ蜉帙＠縺ｾ縺吶・
```text
[CAP_TRACE] Step 1: 隕∽ｻｶ隕∫ｴ・(蜀・ｮｹ...)

[CAP_TRACE] Step 2: 蜑肴署謚ｽ蜃ｺ
- Fact 2.1: ...
- Fact 2.2: ...

...

[CAP_TRACE] Step 5: 莉ｮ隱ｬ逕滓・
- 譯・: ... [Ref: Fact 2.1]
- 譯・: ... [Ref: Fact 2.2]
```

## 3. SDR-v3 Structured Block
諤晁・・繝ｭ繧ｻ繧ｹ縺ｮ譛蠕後↓縲∽ｻ･荳九・讒矩蛹悶ヶ繝ｭ繝・け繧帝・鄂ｮ縺励∪縺吶・
```text
### [SDR-v3] Logical Decision Block
- **State**: 迴ｾ蝨ｨ縺ｮ迥ｶ諷九→隱ｲ鬘後・隕∫ｴ・・- **Decision**: 譛邨ら噪縺ｪ豎ｺ螳壼・螳ｹ縲・- **Reason**: 縺昴・豎ｺ螳壹↓閾ｳ縺｣縺溯ｫ也炊逧・ｹ諡・井ｻｮ隱ｬA/B縺ｮ豈碑ｼ・ｵ先棡・峨・- **Risk**: 谿狗蕗縺吶ｋ繝ｪ繧ｹ繧ｯ縺ｨ蟇ｾ遲悶・- **Verification**: 謌仙粥繧堤黄逅・噪縺ｫ險ｼ譏弱☆繧区婿豕包ｼ・entinel 3.0 縺ｮ譛溷ｾ・､・峨・- **Confidence**: 0.0 - 1.0 (閾ｪ蟾ｱ繝ｬ繝薙Η繝ｼ邨先棡)縲・```

## 4. Enforcement Logic
- **Regex**: `[CAP_TRACE] Step (\d+): (.+)`
- **Evidence Binding Check**: `[Ref: Fact (\d+\.\d+)]` 縺・Step 5 莉･髯阪↓蟄伜惠縺吶ｋ縺九・- **Token Check**: 蜈ｨ蜃ｺ蜉帙↓蟇ｾ縺吶ｋ [CAP_TRACE] 繝悶Ο繝・け縺ｮ豈皮紫縺ｨ蜷郁ｨ域枚蟄玲焚縲・
