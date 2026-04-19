# SADA Testing Guide (Semantic-Aware Delta Assertion)

## 讎りｦ・(Overview)
**SADA (Semantic-Aware Delta Assertion) 繝・せ繝・* 縺ｯ縲、I縺ｫ繧医ｋDOM髢｢騾｣繝・せ繝医・縲後ヨ繝ｼ繧ｯ繝ｳ豸郁ｲｻ蜑頑ｸ帙阪→縲梧､懆ｨｼ蛻ｶ蠎ｦ縺ｮ蜷台ｸ翫阪ｒ荳｡遶九☆繧九◆繧√↓險ｭ險医＆繧後◆縲∵悽繝励Ο繧ｸ繧ｧ繧ｯ繝医↓縺翫￠繧・*譛蜆ｪ蜈医・繝・せ繝医い繝ｼ繧ｭ繝・け繝√Ε**縺ｧ縺吶・

繝・せ繝医せ繧ｯ繝ｪ繝励ヨ荳翫〒繧ｷ繝翫Μ繧ｪ・医い繧ｯ繧ｷ繝ｧ繝ｳ縺ｮ騾｣邯夲ｼ峨ｒ螳溯｡後＠縲√◎縺ｮ驕守ｨ九〒螟牙喧縺励◆縲梧э蜻ｳ縺ｮ縺ゅｋDOM蟾ｮ蛻・ｼ医そ繝槭Φ繝・ぅ繧ｯ繧ｹ・峨阪・縺ｿ繧呈歓蜃ｺ縺励、I縺ｫ荳諡ｬ縺励※讀懆ｨｼ・医い繧ｵ繝ｼ繧ｷ繝ｧ繝ｳ・峨＆縺帙ｋ繧｢繝励Ο繝ｼ繝√ｒ縺ｨ繧翫∪縺吶・

## 繧ｳ繧｢繧ｳ繝ｳ繝昴・繝阪Φ繝・(Core Components)

SADA繝・せ繝医・莉･荳九・3縺､縺ｮ繝｢繧ｸ繝･繝ｼ繝ｫ縺九ｉ讒区・縺輔ｌ縺ｾ縺呻ｼ・src/test/ai/` 驟堺ｸ具ｼ峨・

### 1. `SemanticExtractor`
`dom-accessibility-api` 繧偵Λ繝・・縺励．OM縺九ｉ縲窟I縺檎判髱｢繧堤炊隗｣縺吶ｋ縺溘ａ縺ｫ蠢・ｦ√↑諠・ｱ・・ole, Name, Value, State, Text Content・峨阪□縺代ｒ謚ｽ蜃ｺ縺励※JSON蛹悶☆繧九Δ繧ｸ繝･繝ｼ繝ｫ縺ｧ縺吶・
- **Merkle Tree Hash**: 蜷・ヮ繝ｼ繝峨・閾ｪ霄ｫ縺ｮ諠・ｱ縺ｨ縲悟ｭ仙ｭｫ繝弱・繝峨・繝上ャ繧ｷ繝･繝ｪ繧ｹ繝茨ｼ亥・迴ｾ鬆・ｼ峨阪°繧峨ワ繝・す繝･繧定ｨ育ｮ励＠縺ｾ縺吶ゅ％繧後↓繧医ｊ縲√Ν繝ｼ繝医ヮ繝ｼ繝峨・繝上ャ繧ｷ繝･繧呈ｯ碑ｼ・☆繧九□縺代〒縲．OM繝・Μ繝ｼ縺ｮ縺ｩ縺薙°縺ｫ螟牙喧縺後≠縺｣縺溘°繧・O(1) 縺ｧ蛻､螳壹〒縺阪∪縺吶・
- **Pruning**: 諢丞袖繧呈戟縺溘↑縺・Λ繝・ヱ繝ｼ隕∫ｴ・亥腰縺ｪ繧九せ繧ｿ繧､繝ｫ逕ｨ縺ｮ `<div>` 繧・`<span>`・峨・邨先棡縺九ｉ閾ｪ蜍慕噪縺ｫ譫晏・繧奇ｼ・rune・峨＆繧後√ヨ繝ｼ繧ｯ繝ｳ繧堤ｯ邏・＠縺ｾ縺吶・
- **謫ｬ莨ｼ隕∫ｴ縺ｮ蛻ｶ邏・*: `jsdom` 迺ｰ蠅・〒縺ｯ `::before` 遲峨・ CSS 逍台ｼｼ隕∫ｴ縺九ｉ蜀・ｮｹ繧貞叙蠕励〒縺阪∪縺帙ｓ縲ゅい繧､繧ｳ繝ｳ遲峨↓諢丞袖繧呈戟縺溘○縺ｦ縺・ｋ蝣ｴ蜷医・縲√さ繝ｳ繝昴・繝阪Φ繝亥・縺ｫ `aria-label` 繧剃ｻ倅ｸ弱＠縺ｦ謚ｽ蜃ｺ蜿ｯ閭ｽ縺ｫ縺吶ｋ蠢・ｦ√′縺ゅｊ縺ｾ縺吶・

### 2. `DeltaManager`
蜑榊屓蜿門ｾ励＠縺櫂OM繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ縺ｨ豈碑ｼ・＠縲・*螟画峩縺後≠縺｣縺滄Κ蛻・・繧ｵ繝悶ヤ繝ｪ繝ｼ縺縺・*繧貞・蜉帙☆繧九せ繝・・繝医ヵ繝ｫ縺ｪ繝輔ぅ繝ｫ繧ｿ繝ｼ縺ｧ縺吶・
- 螟画峩縺ｮ縺ｪ縺・ヮ繝ｼ繝峨・ `{ unchanged: true, tag, role, name }` 縺ｫ蝨ｧ邵ｮ縺輔ｌ繧九◆繧√√さ繝ｳ繝・く繧ｹ繝医ｒ邯ｭ謖√＠縺､縺､髟ｷ螟ｧ縺ｪJSON縺ｮ騾∽ｿ｡繧帝亟縺弱∪縺吶・
- **豕ｨ諢・*: 繝・せ繝医・荳ｦ蛻怜ｮ溯｡後↓繧医ｋ遶ｶ蜷医ｒ髦ｲ縺舌◆繧√～DeltaManager` 縺ｯ繧ｰ繝ｭ繝ｼ繝舌Ν縺ｫ謖√◆縺壹√ユ繧ｹ繝医す繝翫Μ繧ｪ繝ｻ繝舌ャ繝√＃縺ｨ縺ｫ繧､繝ｳ繧ｹ繧ｿ繝ｳ繧ｹ蛹悶＠縺ｦ菴ｿ逕ｨ縺励∪縺吶・

### 3. `AITestBatcher`
繧ｷ繝翫Μ繧ｪ蜈ｨ菴薙・繧｢繧ｯ繧ｷ繝ｧ繝ｳ・域桃菴懊Ο繧ｰ・峨→ Delta 繧定ｨ倬鹸縺励∝柑邇・噪縺ｫAI繝励Ο繝ｳ繝励ヨ繧堤函謌舌☆繧九◆繧√・繝輔Ο繝ｼ蛻ｶ蠕｡繧ｯ繝ｩ繧ｹ縺ｧ縺吶・

---

## 菴ｿ縺・婿 (How to Write SADA Test)

AI繧堤畑縺・◆繧ｳ繝ｳ繝昴・繝阪Φ繝医ユ繧ｹ繝茨ｼ域ｩ溯・讀懆ｨｼ・峨ｒ陦後≧蝣ｴ蜷医・縲∽ｻ･荳九・繝代ち繝ｼ繝ｳ縺ｫ蠕薙▲縺ｦ險倩ｿｰ縺励※縺上□縺輔＞縲・

```typescript
import { render, fireEvent } from '@testing-library/react';
import { AITestBatcher, PromptData } from '../../test/ai/AITestBatcher';
import { MyComponent } from './MyComponent';

describe('MyComponent SADA Test (Scenario Example)', () => {
    it('generates prompt data for complex user flow', async () => {
        // 1. 繝舌ャ繝√Ε繝ｼ縺ｮ繧､繝ｳ繧ｹ繧ｿ繝ｳ繧ｹ蛹・
        const batcher = new AITestBatcher();

        // 2. 繧ｳ繝ｳ繝昴・繝阪Φ繝医・繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ
        const { container, getByRole } = render(<MyComponent />);

        // 3. 蛻晄悄迥ｶ諷九・繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ險倬鹸・亥ｿ・茨ｼ・
        batcher.start(container);

        // --- 繧ｷ繝翫Μ繧ｪ螳溯｡・---
        
        // 繧｢繧ｯ繧ｷ繝ｧ繝ｳ 1: 繝ｦ繝ｼ繧ｶ繝ｼ謫堺ｽ・
        fireEvent.change(getByRole('textbox', { name: 'Search' }), { target: { value: 'query' } });
        // 繝舌ャ繝√Ε繝ｼ縺ｫ螟画峩蜀・ｮｹ縺ｨ縺昴・邨先棡縺ｮ蟾ｮ蛻・ｒ險倬鹸
        batcher.recordAction(container, 'Searched for "query"', 'searchInput');

        // 繧｢繧ｯ繧ｷ繝ｧ繝ｳ 2: 繝懊ち繝ｳ繧ｯ繝ｪ繝・け
        fireEvent.click(getByRole('button', { name: 'Submit' }));
        batcher.recordAction(container, 'Clicked submit button', 'submitBtn');

        // --- AI 繝励Ο繝ｳ繝励ヨ逕滓・ ---
        
        // 逶ｮ讓吶→縺吶ｋ讀懆ｨｼ蜀・ｮｹ繧呈枚蟄怜・縺ｨ縺励※貂｡縺励√・繝ｭ繝ｳ繝励ヨ繝・・繧ｿ繧堤函謌舌☆繧・
        const promptData: PromptData = batcher.generatePromptData(
            'Verify that searching for "query" and submitting displays the loading skeleton, then the results.'
        );

        // --- (縺薙・蠕後｝romptData 繧剃ｽｿ縺｣縺ｦ AI (LLM) 繧ｨ繝ｳ繝峨・繧､繝ｳ繝医∈謚輔￡繧九°縲√さ繝ｳ繧ｽ繝ｼ繝ｫ縺ｫ蜃ｺ蜉帙＠縺ｦ逶ｮ隕也｢ｺ隱阪☆繧・ ---
        
        // 繝励Ο繝医ち繧､繝礼｢ｺ隱咲畑縺ｧ縺ゅｌ縺ｰ莉･荳九・繧医≧縺ｫ繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ縺ｫ縺励※縺翫￥縺薙→繧よ怏蜉ｹ縺ｧ縺吶・
        // expect(promptData).toMatchSnapshot();
    });
});
```

## 繧ｨ繝ｩ繝ｼ繝ｪ繧ｫ繝舌Μ (Error Diagnostics)
`getByRole` 遲峨〒隕∫ｴ縺瑚ｦ九▽縺九ｉ縺壹√ユ繧ｹ繝郁・菴薙′繧ｯ繝ｩ繝・す繝･縺励◆蝣ｴ蜷医√◎縺薙∪縺ｧ縺ｮ縲梧桃菴懊Ο繧ｰ縲阪→縲後け繝ｩ繝・す繝･逶ｴ蜑阪・迥ｶ諷九阪ｒAI縺ｫ貂｡縺励※蜴溷屏繧貞・譫舌＆縺帙ｋ縺薙→縺後〒縺阪∪縺吶・

```typescript
try {
    // 謫堺ｽ・..
    fireEvent.click(getByRole('button', { name: 'Not exists' }));
} catch (error) {
    // 縺ｩ縺薙∪縺ｧ螳溯｡後〒縺阪※縲．OM縺後←縺・↑縺｣縺ｦ縺・◆縺九ｒ險ｺ譁ｭ逕ｨ繝・・繧ｿ縺ｨ縺励※謚ｽ蜃ｺ
    const diagnostic = batcher.generateErrorDiagnostic(error as Error, container);
    // 縺薙ｌ繧但I縺ｫ謚輔￡縺ｦ菫ｮ豁｣譯医ｒ謗ｨ隲悶＆縺帙ｋ
    console.error("Diagnostic Data for AI:", JSON.stringify(diagnostic, null, 2));
    throw error;
}
```

## 蛻ｶ邏・→繝吶せ繝医・繝ｩ繧ｯ繝・ぅ繧ｹ
- **Deterministic First**: 縲後・繧ｿ繝ｳ縺悟ｭ伜惠縺吶ｋ縺九阪後ユ繧ｭ繧ｹ繝医′荳閾ｴ縺吶ｋ縺九阪↑縺ｩ縺ｮ遒ｺ螳夂噪縺ｪ・域ｩ滓｢ｰ逧・↓蛻､螳壼庄閭ｽ縺ｪ・画､懆ｨｼ縺ｯ縲∝ｾ捺擂騾壹ｊ `expect(...).toBe(...)` 縺ｮ繧｢繧ｵ繝ｼ繧ｷ繝ｧ繝ｳ繧剃ｽｿ逕ｨ縺励※縺上□縺輔＞縲４ADA・・I・峨↓莉ｻ縺帙ｋ縺ｮ縺ｯ縲後％縺ｮ荳騾｣縺ｮDOM縺ｮ螟牙喧縺ｯ縲√Θ繝ｼ繧ｶ繝ｼ繧ｷ繝翫Μ繧ｪ縺ｨ縺励※遐ｴ邯ｻ縺励※縺・↑縺・°繝ｻ隕∽ｻｶ繧呈ｺ縺溘＠縺ｦ縺・ｋ縺九阪→縺・≧**譖匁乂縺輔ｒ蜷ｫ繧邱丞粋逧・愛譁ｭ**縺ｮ縺ｿ縺ｫ髯仙ｮ壹＠縺ｾ縺吶・
- **繧ｭ繝｣繝・す繝･縺ｮ繝ｩ繧､繝輔し繧､繧ｯ繝ｫ**: `AITestBatcher` 縺ｯ `start()` 縺悟他縺ｰ繧後ｋ縺溘・縺ｫ蜀・Κ縺ｮ蟾ｮ蛻・く繝｣繝・す繝･・・DeltaManager`・峨ｒ繝ｪ繧ｻ繝・ヨ縺励∪縺吶ょ推繝・せ繝医こ繝ｼ繧ｹ (`it`) 縺ｾ縺溘・繝・せ繝医せ繧､繝ｼ繝医＃縺ｨ縺ｪ縺ｩ縲・←蛻・↑繧ｿ繧､繝溘Φ繧ｰ縺ｧ `start()` 繧貞他繧薙〒蛻晄悄蛹悶＠縺ｦ縺上□縺輔＞縲・

