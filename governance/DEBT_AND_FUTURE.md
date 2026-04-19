# Technical Debt & Future Roadmap (RePaper Route)

## 1. Technical Debt (謚陦鍋噪雋蛯ｵ)
*隗｣豎ｺ縺吶∋縺肴橿陦鍋噪隱ｲ鬘後√Μ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ蟇ｾ雎｡*

- [x] **[Path Fragility] 邨ｱ豐ｻ繝・・繝ｫ縺ｮ繝代せ隗｣豎ｺ**: `gov_loader.js` 縺ｮ蠑ｷ蛹悶→蜷・せ繧ｯ繝ｪ繝励ヨ縺ｧ縺ｮ `PROJECT_ROOT` SSOT蛹悶↓繧医ｊ隗｣豎ｺ縲・- [ ] **[Supabase Sync] 繧､繝ｳ繝輔Λ邨ｱ諡ｬ**: 繝ｫ繝ｼ繝医→ `apps/repaper-route` 縺ｮ `supabase/` 繝輔か繝ｫ繝縺ｮ螳悟・縺ｪ荳譛ｬ蛹悶→迺ｰ蠅・､画焚縺ｮ蜷梧悄縲・- [ ] **[AuthAdapter Integration] 蜈ｨ遉ｾ讓呎ｺ・Staff 繧ｹ繧ｭ繝ｼ繝樊ｺ匁侠**: `AuthAdapter.ts` 繧剃ｿｮ豁｣縺励∵立 profile 蠖｢蠑上°繧・Staff 繧ｹ繧ｭ繝ｼ繝槭∈螳悟・遘ｻ陦後ゅ％繧後ｒ繧ゅ▲縺ｦ蜈ｨ遉ｾ讓呎ｺ悶∈縺ｮ貅匁侠繧貞ｮ御ｺ・→縺吶ｋ縲・- [ ] **[Git Hooks Sync]**: `husky` 縺後Δ繝弱Ξ繝晄ｧ矩繧呈ｭ｣縺励￥隱崎ｭ倥＠縲∝・繝ｯ繝ｼ繧ｯ繧ｹ繝壹・繧ｹ縺ｮ `lint-staged` 繧偵ヨ繝ｪ繧ｬ繝ｼ縺ｧ縺阪※縺・ｋ縺九・讀懆ｨｼ縲・
## 2. Future Roadmap (蟆・擂讒区Φ)
*譛ｪ螳溯｣・・讖溯・縲∝ｰ・擂逧・↑諡｡蠑ｵ險育判*

### Phase 6: Logic-Driven Efficiency (逶ｴ霑代・蜆ｪ蜈井ｺ矩・
> [!IMPORTANT]
> **縲植I髢狗匱 笨・隲也炊螳溯｣・大次蜑・(ADR-0011)**
> AI繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝茨ｼ・ntigravity遲会ｼ峨↓繧医ｋ鬮伜ｺｦ縺ｪ繧ｳ繝ｼ繝画ｧ狗ｯ峨・險ｭ險医・蠑ｷ蜉帙↓謗ｨ螂ｨ縺吶ｋ縲ゆｸ譁ｹ縺ｧ縲√い繝励Μ蜀・〒縺ｮ螳溯｡後Ο繧ｸ繝・け縺ｯ縲瑚ｫ也炊逧・ｨ育ｮ暦ｼ医い繝ｫ繧ｴ繝ｪ繧ｺ繝・峨阪↓髯仙ｮ壹☆繧九・
- [ ] **DeltaManager (Logic Edition)**: AI繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医′險ｭ險医☆繧九・・霆翫・蟾ｮ蛻・・譫舌♀繧医・螟画峩繧､繝ｳ繝代け繝医・隲也炊險育ｮ励お繝ｳ繧ｸ繝ｳ縺ｮ讒狗ｯ峨・- [ ] **Structural Validation**: AI繧剃ｽｿ繧上★縲∫黄逅・宛邏・ｼ・0kg蛻ｶ邏・∝霧讌ｭ譎る俣縲∝・險ｱ隕∽ｻｶ・峨↓蝓ｺ縺･縺丞宍譬ｼ縺ｪ繝舌Μ繝・・繧ｷ繝ｧ繝ｳ縺ｮ螳溯｣・・
### Phase 7: TBNY DXOS Standard Integration
- [ ] **Audit Trail v2**: 螟画峩螻･豁ｴ縺ｮ蛻・淵蝙句床蟶ｳ・・SONL + DB・峨∈縺ｮ莠碁㍾險倬鹸縲・- [ ] **OAuth2 Transition**: Staff隱崎ｨｼ蝓ｺ逶､縺ｮ讓呎ｺ・OAuth2 繝励Ο繝医さ繝ｫ縺ｸ縺ｮ遘ｻ陦後・
### Appendix: AI-Enhanced Intelligence (謌ｦ逡･逧・ｿ晉蕗)
*繧ｳ繧ｹ繝亥ｯｾ蜉ｹ譫懊ｒ蜀崎ｩ穂ｾ｡縺励ヾDR繝・・繧ｿ縺悟香蛻・↓闢・ｩ阪＆繧後◆谿ｵ髫弱〒蜀埼幕繧呈､懆ｨ弱☆繧・

- [ ] **SemanticExtractor**: 讌ｭ蜍吶ラ繧ｭ繝･繝｡繝ｳ繝医°繧峨・諢丞袖謚ｽ蜃ｺ・・LM豢ｻ逕ｨ・峨・- [ ] **VLM-Based Visual Check**: 隕冶ｦ夊ｨ隱槭Δ繝・Ν繧堤畑縺・◆繝懊・繝峨・謨ｴ蜷域ｧ遒ｺ隱阪・
---
> [!IMPORTANT]
> 譛ｬ譖ｸ縺ｯ `governance/` 驟堺ｸ九・ SSOT・亥腰荳逵溷ｮ滓ｺ撰ｼ峨→縺励※邂｡逅・＆繧後∪縺吶・
