# ADR-0011: Defer AI Implementation and Prioritize Logical Calculation

* **Status**: Accepted
* **Date**: 2026-04-18
* **Decider**: User (shiyo) via AI Agent (Antigravity)

## Context and Problem Statement
繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ蛻ｩ逕ｨ閠・↓謠蝉ｾ帙☆繧・AI 讖溯・・・LM 邨ｱ蜷医∬・蜍穂ｺ域ｸｬ繧ｨ繝ｳ繧ｸ繝ｳ遲会ｼ峨・縲・ｫ倥＞險育ｮ励さ繧ｹ繝茨ｼ・O繧ｹ繝茨ｼ峨→縲∵･ｭ蜍吶・邨先棡縺ｫ蟇ｾ縺吶ｋ雋ｬ莉ｻ縺ｮ謇蝨ｨ縺ｮ譖匁乂蛹悶ｒ諡帙￥諛ｸ蠢ｵ縺後≠繧翫∪縺吶ゆｸ譁ｹ縺ｧ縲、I 繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医↓繧医ｋ髢狗匱・域悽 OS 縺ｮ讒狗ｯ峨√Μ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ縲∫ｵｱ豐ｻ繝励Ο繝医さ繝ｫ縺ｮ螳溯｡鯉ｼ峨・縲・幕逋ｺ騾溷ｺｦ縺ｨ蜩∬ｳｪ繧呈球菫昴☆繧九◆繧√↓荳榊庄谺縺ｧ縺吶・
## Decision Drivers
* **Agentic Development**: AI 縺ｫ繧医ｋ鬮伜ｺｦ縺ｪ繧ｳ繝ｼ繝臥函謌舌→邨ｱ豐ｻ縺ｫ繧医ｋ髢狗匱蜉ｹ邇・・譛螟ｧ蛹厄ｼ域耳螂ｨ・峨・* **Logic-First Implementation**: 繧｢繝励Μ蛻ｩ逕ｨ閠・↓縺ｯ縲・乗・諤ｧ縺碁ｫ倥￥繧ｳ繧ｹ繝医・菴弱＞縲瑚ｫ也炊逧・ｨ育ｮ励阪・縺ｿ繧呈署萓幢ｼ亥ｿ・茨ｼ峨・* **Boundary Clarification**: 髢狗匱荳ｻ菴薙→縺励※縺ｮ AI 縺ｨ縲∵ｩ溯・縺ｨ縺励※縺ｮ AI 繧貞宍譬ｼ縺ｫ蛻・屬縺吶ｋ縲・
## Considered Options
1. **Full-AI**: 髢狗匱繧よｩ溯・繧・AI 繧呈ｴｻ逕ｨ縺吶ｋ縲・2. **AI-Driven Development, Logic-Driven App (Chosen)**: 髢狗匱縺ｯ AI 繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝茨ｼ・ntigravity 遲会ｼ峨′陦後＞縲√い繝励Μ蜀・・讖溯・縺ｯ隲也炊逧・ｨ育ｮ励〒讒狗ｯ峨☆繧九・
## Decision Outcome
Chosen option: "Option 2", because AI 縺ｫ繧医ｋ髢狗匱蜉ｹ邇・ｼ域耳螂ｨ・峨ｒ莠ｫ蜿励＠縺､縺､縲√い繝励Μ讖溯・縺ｫ縺翫￠繧九さ繧ｹ繝医→辟｡雋ｬ莉ｻ縺ｪ繝悶Λ繝・け繝懊ャ繧ｯ繧ｹ蛹厄ｼ育ｦ∵ｭ｢・峨ｒ迚ｩ逅・噪縺ｫ謗帝勁縺吶ｋ縺溘ａ縲・
### Consequences
* **Positive**: 髢狗匱騾溷ｺｦ縺ｮ蜷台ｸ翫√Λ繝ｳ繝九Φ繧ｰ繧ｳ繧ｹ繝医・謚大宛縲√Ο繧ｸ繝・け縺ｮ騾乗・蛹悶→隱ｬ譏主庄閭ｽ諤ｧ・・xplainability・峨・諡・ｿ昴・* **Negative**: 鬮伜ｺｦ縺ｪ髱槫ｮ壼梛莠域ｸｬ・磯≦蟒ｶ莠域ｸｬ遲会ｼ峨・邊ｾ蠎ｦ縺後∫ｴ皮ｲ九↑邨ｱ險・隲也炊繝｢繝・Ν縺ｫ萓晏ｭ倥☆繧九・
## Persistence Protocol
譛ｬ豎ｺ螳壹・縲√・繝ｭ繧ｸ繧ｧ繧ｯ繝医・繧ｳ繧｢譁ｹ驥昴→縺励※蠑ｷ蜉帙↓險倬鹸縺輔ｌ縲、I SDK・・penai遲会ｼ峨′蟆主・貂医∩縺ｧ縺ゅ▲縺ｦ繧ゅ∵・遉ｺ逧・↑縲窟I螳溯｣・価隱阪阪′蠕励ｉ繧後ｋ縺ｾ縺ｧ縺ｯ隲也炊險育ｮ励↓繧医ｋ螳溽峩縺ｪ螳溯｣・ｒ蜊倅ｸ逵溷ｮ滓ｺ撰ｼ・SOT・峨→縺吶ｋ縲・
