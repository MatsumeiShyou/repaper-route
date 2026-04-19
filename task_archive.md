# RePaper Route - Task Archive (螳御ｺ・ち繧ｹ繧ｯ螻･豁ｴ)

縺薙・繝輔ぃ繧､繝ｫ縺ｯ螳御ｺ・＠縺溘ヵ繧ｧ繝ｼ繧ｺ繝ｻ繧ｿ繧ｹ繧ｯ繧剃ｿ晉ｮ｡縺吶ｋ豁ｴ蜿ｲ鬢ｨ縺ｧ縺吶・

---

## 繝輔ぉ繝ｼ繧ｺ 1: 閼ｱ繝ｻ莉ｮ蛻昴ａ (De-mocking) - 螳御ｺ・
- [x] **Core Auth**: `App.jsx` / `AdminDashboard.jsx` 縺ｮ繝｢繝・け隱崎ｨｼ繧呈彫蟒・＠縲∵ｭ｣隕上ヵ繝ｭ繝ｼ縺ｸ遘ｻ陦・+ profiles繝・・繝悶Ν菴懈・螳御ｺ・
- [x] **Board Data**: `BoardCanvas.jsx` 縺ｮ蛻晄悄繝・・繧ｿ繝ｭ繝ｼ繝峨ｒ豁｣隕上Μ繝昴ず繝医Μ邨檎罰縺ｫ螟画峩
- [x] **GAS Link**: `gasApi.js` 縺ｮ螳欟RL謗･邯夊ｨｭ螳壹→TODO豸亥喧

## 繝輔ぉ繝ｼ繧ｺ 1.5: 繧ｹ繧ｭ繝ｼ繝樊怙驕ｩ蛹・(Schema Optimization) - 螳御ｺ・
- [x] **Schema Unification**: 3縺､縺ｮSQL繝輔ぃ繧､繝ｫ繧堤ｵｱ蜷医＠縲∝ｮ溯｡碁・ｺ上ｒ譏守｢ｺ蛹・
- [x] **Verification Enhancement**: 讀懆ｨｼ繧ｹ繧ｯ繝ｪ繝励ヨ縺ｫ profiles 繝・・繝悶Ν遒ｺ隱阪ｒ霑ｽ蜉

## 繝輔ぉ繝ｼ繧ｺ 2.5: 螳滓ｧ矩蜿肴丐 (Actual Schema Reflection) - 螳御ｺ・
- [x] **Schema Investigation**: Supabase螳滓ｧ矩縺ｮ螳悟・隱ｿ譟ｻ(9繝・・繝悶Ν遒ｺ隱・
- [x] **Schema Creation**: supabase_schema_actual.sql 菴懈・(蜀ｪ遲画ｧ蟇ｾ蠢懊∫ｰ｡貎斐↑讒矩縲∝ｱ･豁ｴ繧ｳ繝｡繝ｳ繝井ｻ倥″)
- [x] **Routes Table Addition**: 驟崎ｻ願ｨ育判菫晏ｭ倡畑routes繝・・繝悶Ν霑ｽ蜉
- [x] **Verification Update**: supabase_schema_verification.sql 繧単hase 2.5蟇ｾ蠢懊↓譖ｴ譁ｰ
- [x] **Application Verification**: 繝悶Λ繧ｦ繧ｶ蜍穂ｽ懃｢ｺ隱榊ｮ御ｺ・迚ｩ逅・噪險ｼ諡:繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ)
- [x] **Project Cleanup**: 荳崎ｦ√ヵ繧｡繧､繝ｫ蜑企勁縲∬ｩｦ菴懷刀繧胆archived/prototypes/縺ｸ遘ｻ蜍・

## 繝輔ぉ繝ｼ繧ｺ 2: 讖溯・蠑ｷ蛹・(Enhancement) - 螳御ｺ・
- [x] **Concurrency**: 驟崎ｻ顔乢縺ｮ邱ｨ髮・ｫｶ蜷磯亟豁｢繝ｭ繧ｸ繝・け螳溯｣・
  - [x] Project hygiene: .gitignore譛驕ｩ蛹悶√Ο繧ｰ繝輔ぃ繧､繝ｫ蜑企勁
  - [x] Implementation plan菴懈・: Optimistic Locking險ｭ險・
  - [x] BoardCanvas.jsx: localUpdatedAt State霑ｽ蜉
  - [x] BoardCanvas.jsx: 蛻晄悄蛹匁凾繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝苓ｨ倬鹸
  - [x] BoardCanvas.jsx: Real-time雉ｼ隱ｭ縺ｮ遶ｶ蜷域､懃衍繝ｭ繧ｸ繝・け
  - [x] BoardCanvas.jsx: 菫晏ｭ俶凾縺ｮ遶ｶ蜷域､懷・繝ｻ繝ｪ繝ｭ繝ｼ繝牙・逅・
  - [x] Manual verification: 3繧ｷ繝翫Μ繧ｪ讀懆ｨｼ

## 繝輔ぉ繝ｼ繧ｺ 2.2: 謗剃ｻ也噪邱ｨ髮・Ο繝・け (Exclusive Edit Lock - Option E) - 螳御ｺ・
- [x] **Edit Lock Mechanism**: 邱ｨ髮・ｨｩ繝医・繧ｯ繝ｳ + 15蛻・ち繧､繝繧｢繧ｦ繝亥ｮ溯｣・
  - [x] Schema: routes繝・・繝悶Ν縺ｫ3繧ｫ繝ｩ繝霑ｽ蜉 (edit_locked_by, edit_locked_at, last_activity_at)
  - [x] SCHEMA_HISTORY.md譖ｴ譁ｰ
  - [x] Migration SQL繝輔ぃ繧､繝ｫ菴懈・
  - [x] Supabase migration螳溯｡・
  - [x] BoardCanvas: 繝ｭ繝・け蜿門ｾ励Ο繧ｸ繝・け螳溯｣・
  - [x] BoardCanvas: 繧ｿ繧､繝繧｢繧ｦ繝亥愛螳・15蛻・
  - [x] BoardCanvas: 繝上・繝医ン繝ｼ繝・1蛻・＃縺ｨ縺ｮ繧｢繧ｯ繝・ぅ繝薙ユ繧｣譖ｴ譁ｰ)
  - [x] BoardCanvas: 繝ｭ繝・け隗｣謾ｾ繝ｭ繧ｸ繝・け
  - [x] Real-time: 繝ｭ繝・け迥ｶ諷九・雉ｼ隱ｭ繝ｻ騾夂衍
  - [x] UI: 邱ｨ髮・Δ繝ｼ繝・髢ｲ隕ｧ繝｢繝ｼ繝牙・譖ｿ
  - [x] UI: 邱ｨ髮・ｸｭ繝ｦ繝ｼ繧ｶ繝ｼ陦ｨ遉ｺ
  - [x] Manual verification: 邱頑･螟画峩繧ｷ繝翫Μ繧ｪ讀懆ｨｼ

## 繝輔ぉ繝ｼ繧ｺ 2.3: 邱ｨ髮・ｨｩ髯仙宛蠕｡ (Edit Permission Control - RBAC) - 螳御ｺ・
- [x] **Permission Management**: 迚ｹ螳壹Θ繝ｼ繧ｶ繝ｼ縺ｮ縺ｿ邱ｨ髮・庄閭ｽ縺ｫ縺吶ｋ讓ｩ髯仙宛蠕｡
  - [x] Implementation plan菴懈・
  - [x] Schema: profiles繝・・繝悶Ν縺ｫcan_edit_board繧ｫ繝ｩ繝霑ｽ蜉
  - [x] Migration SQL繝輔ぃ繧､繝ｫ菴懈・ (supabase_migration_phase2.3.sql)
  - [x] Supabase migration螳溯｡・
  - [x] BoardCanvas: canEditBoard State霑ｽ蜉
  - [x] BoardCanvas: 蛻晄悄蛹匁凾縺ｫ讓ｩ髯仙叙蠕・
  - [x] BoardCanvas: requestEditLock蜀・〒讓ｩ髯舌メ繧ｧ繝・け
  - [x] UI: 讓ｩ髯舌↑縺励Θ繝ｼ繧ｶ繝ｼ蜷代￠陦ｨ遉ｺ(髢ｲ隕ｧ蟆ら畑繝舌ャ繧ｸ)
  - [x] User matching fix: currentUserId菫ｮ豁｣ (admin1縺ｫ螟画峩)
  - [x] Query fix: .eq('id')縺ｫ螟画峩
  - [x] Manual verification: 讓ｩ髯舌≠繧・縺ｪ縺励Θ繝ｼ繧ｶ繝ｼ繝・せ繝・

## 繝輔ぉ繝ｼ繧ｺ 3.1: 譛ｪ驟崎ｻ翫Μ繧ｹ繝医ヰ繧ｱ繝・ヨ謾ｹ濶ｯ - 螳御ｺ・
- [x] **Pending Jobs Bucket Improvement**: 螳壽悄/繧ｹ繝昴ャ繝域・遒ｺ蛹・
  - [x] BoardCanvas: 繝輔ぅ繝ｫ繧ｿ繝ｼ繧ｿ繝門､画峩 (縺吶∋縺ｦ/螳壽悄/繧ｹ繝昴ャ繝・
  - [x] BoardCanvas: 繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ繝ｭ繧ｸ繝・け菫ｮ豁｣
  - [x] Manual verification: 繝舌こ繝・ヨ陦ｨ遉ｺ遒ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 3.2: 繝舌こ繝・ヨ繧ｷ繧ｹ繝・Β蜀崎ｨｭ險・(Blueprint v2.1) - 螳御ｺ・
- [x] **4-Bucket System**: 蛻ｶ邏・・繝ｼ繧ｹ縺ｮ蛻・｡槭す繧ｹ繝・Β
  - [x] BoardCanvas: 繧ｿ繝門､画峩 (蜈ｨ縺ｦ/繧ｹ繝昴ャ繝・譎る俣謖・ｮ・迚ｹ谿頑｡井ｻｶ)
  - [x] BoardCanvas: 繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ繝ｭ繧ｸ繝・け譖ｴ譁ｰ
  - [x] 繝・・繧ｿ繝｢繝・Ν: is_spot, time_constraint, task_type 繧ｫ繝ｩ繝霑ｽ蜉
  - [x] Migration SQL菴懈・
  - [x] Migration SQL螳溯｡・(User Manual)
  - [x] Manual verification: 4繝舌こ繝・ヨ陦ｨ遉ｺ遒ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 3.3: 蛻ｶ邏・､懆ｨｼ繝ｭ繧ｸ繝・け (Yellow Warning) - 螳御ｺ・
- [x] **Constraint Logic**: 譎る俣蛻ｶ邏・＆蜿阪・讀懃衍縺ｨ隴ｦ蜻・
  - [x] BoardCanvas: `validateTimeConstraint` 螳溯｣・
  - [x] BoardCanvas: 繝峨Ο繝・・譎ゅ↓讀懆ｨｼ螳溯｡・& 隴ｦ蜻願｡ｨ遉ｺ
  - [x] UI: Warning Notification (鮟・牡繝医・繧ｹ繝・ 蟇ｾ蠢・
  - [x] Manual verification: 驕募渚譎ゅ・隴ｦ蜻雁虚菴懃｢ｺ隱・
  - [x] Manual verification: 驕募渚譎ゅ・繝悶Ο繝・け遒ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 3.5: 蛻ｶ邏・､懆ｨｼ繝ｭ繧ｸ繝・け (Reason Input) - 螳御ｺ・
- [x] **Reason Input UI**: 隴ｦ蜻頑凾縺ｮ逅・罰蜈･蜉帙ム繧､繧｢繝ｭ繧ｰ
  - [x] UI: `ReasonModal` 繧ｳ繝ｳ繝昴・繝阪Φ繝亥ｮ溯｣・
  - [x] BoardCanvas: Yellow Warning譎ゅ↓繝｢繝ｼ繝繝ｫ陦ｨ遉ｺ
  - [x] Logic: 逅・罰莉倥″縺ｧ驟咲ｽｮ繧貞ｮ溯｡後☆繧句・逅・
  - [x] Manual verification: 逅・罰蜈･蜉帙ヵ繝ｭ繝ｼ縺ｮ遒ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 3.X: 繝槭せ繧ｿ繝・・繧ｿ豁｣隕丞喧 (Master Data Normalization - Simple) - 螳御ｺ・
- [x] **Schema Definition**: `customers`, `vehicles` 繝・・繝悶Ν菴懈・
- [x] **Data Migration**: 蛻晄悄繝・・繧ｿ謚募・
- [x] **Code Refactoring**: `BoardCanvas.jsx` 遲峨・繝槭せ繧ｿ蜿ら・繧奪B邨檎罰縺ｫ螟画峩
- [x] **Manual verification**: 繝槭せ繧ｿ繝・・繧ｿ縺梧ｭ｣縺励￥隱ｭ縺ｿ霎ｼ縺ｾ繧後ｋ縺狗｢ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 4.0: SDR繧｢繝ｼ繧ｭ繝・け繝√Ε遘ｻ陦・(SDR Migration) - 螳御ｺ・
- [x] **SDR Schema Implementation**: `manual_sdr_migration_full.sql` 菴懈・螳御ｺ・(荳譎ょ●豁｢: CLI險ｭ螳壹∈遘ｻ陦・
- [x] **Master Data Migration**: `customers` -> `master_collection_points` 遘ｻ陦・(Remote譌｢蟄倡｢ｺ隱肴ｸ医∩)
- [x] **Application Adapter**: `useMasterData` 繧担DR蟇ｾ蠢懃沿縺ｸ譖ｴ譁ｰ
- [x] **Proposal Flow**: 繧ｳ繝ｼ繝牙ｮ溯｣・ｮ御ｺ・(DB繝・・繝悶Ν菴懈・貂医∩縲，LI迺ｰ蠅・紛蛯吝ｮ御ｺ・

## 繝輔ぉ繝ｼ繧ｺ 4.1: CLI迺ｰ蠅・ｧ狗ｯ・(CLI Configuration) - 螳御ｺ・
- [x] **CLI Authentication**: Supabase縺ｸ繝ｭ繧ｰ繧､繝ｳ
- [x] **Project Link**: 繝ｪ繝｢繝ｼ繝医・繝ｭ繧ｸ繧ｧ繧ｯ繝医→繝ｪ繝ｳ繧ｯ (`mjaoolcjjlxwstlpdgrg`)
- [x] **Migration Execution**: CLI邨檎罰縺ｧSDR繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ繧帝←逕ｨ (PGRST205隗｣豸・

## 繝輔ぉ繝ｼ繧ｺ 4.2: 謇ｿ隱阪ヵ繝ｭ繝ｼUI螳溯｣・(Approval Flow UI) - 螳御ｺ・
- [x] **SDR Dashboard**: 謠先｡医・豎ｺ螳壹Ο繧ｰ繧帝夢隕ｧ縺ｧ縺阪ｋ邂｡逅・判髱｢縺ｮ螳溯｣・
  - [x] UI: `SDRDashboard.jsx` 菴懈・ (Proposals & Decisions Tabs)
  - [x] Logic: `useSDR.js` 繝輔ャ繧ｯ菴懈・ (Fetch & Supabase Subscription)
  - [x] Action: 謇句虚謇ｿ隱・蜊ｴ荳九・繧ｿ繝ｳ縺ｮ螳溯｣・(Pending謠先｡育畑)
- [x] **Integration**: 邂｡逅・Γ繝九Η繝ｼ縺ｸ縺ｮ繝ｪ繝ｳ繧ｯ霑ｽ蜉
- [x] **Environment Fix**: CLI縺ｨ繧｢繝励Μ縺ｮ繝励Ο繧ｸ繧ｧ繧ｯ繝井ｸ肴紛蜷医ｒ隗｣豸医＠縲～mjaool...` 縺ｧ邨ｱ荳縲・

## 繝輔ぉ繝ｼ繧ｺ 4.3: UI譌･譛ｬ隱槫喧 (Localization) - 螳御ｺ・
- [x] **SDR Dashboard**: 謠先｡医・豎ｺ螳壹Ο繧ｰ逕ｻ髱｢縺ｮ譌･譛ｬ隱槫喧
  - [x] Labels: 繝・・繝悶Ν繝倥ャ繝繝ｼ縲√・繧ｿ繝ｳ縲√せ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ縺ｮ譌･譛ｬ隱槫喧
  - [x] Messages: 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ縲√お繝ｩ繝ｼ縲∫ｩｺ迥ｶ諷九Γ繝・そ繝ｼ繧ｸ縺ｮ譌･譛ｬ隱槫喧
  - [x] Date Format: 譌･譎り｡ｨ遉ｺ縺ｮJST/繝ｭ繧ｱ繝ｼ繝ｫ蟇ｾ蠢・(`toLocaleString('ja-JP')`)

## 繝輔ぉ繝ｼ繧ｺ 5.5: 讒矩謾ｹ髱ｩ (Architecture Refactoring) - 螳御ｺ・
- [x] **Component Split**: `BoardCanvas.jsx` (1600陦・ 縺ｮ蛻・牡
  - [x] Logic Extraction: `useBoardData` 繝輔ャ繧ｯ縺ｮ菴懈・ (Supabase/Local Sync)
  - [x] UI Extraction: `DriverColumn`, `TimeGrid`, `JobCard` 繧ｳ繝ｳ繝昴・繝阪Φ繝亥喧
  - [x] Drag Logic: `useBoardDragDrop` 繝輔ャ繧ｯ縺ｸ縺ｮ蛻・屬
- [x] **Type Definition**: 荳ｻ隕√ョ繝ｼ繧ｿ蝙・(Job, Driver, Split) 縺ｮJSDoc/TypeScript螳夂ｾｩ謨ｴ蛯・

## 繝輔ぉ繝ｼ繧ｺ 6: 隍・焚蜩∫岼邂｡逅・(Multi-Item Management) - 螳御ｺ・
- [x] **Data Modeling**: 讎ょｿｵ繝・・繧ｿ繝｢繝・Ν險ｭ險・(ER蝗ｳ)
  - [x] Plan Formulation: `implementation_plan.md` 譖ｴ譁ｰ
  - [x] Schema Design: `master_items`, `customer_item_defaults` 繝・・繝悶Ν險ｭ險・
  - [x] Migration: SQL繝輔ぃ繧､繝ｫ菴懈・
- [x] **UI Prototyping**: 隍・焚蜩∫岼蜈･蜉帙・陦ｨ遉ｺUI縺ｮ繝｢繝・け繧｢繝・・菴懈・
  - [x] Logic Update: `useMasterData` hook 諡｡蠑ｵ
  - [x] Logic Update: `useBoardData` / `proposalLogic` 諡｡蠑ｵ
  - [x] UI Update: `BoardModals.jsx` (Job Edit) 縺ｫ蜩∫岼邂｡逅・ｩ溯・霑ｽ蜉
- [x] **DB Implementation**: `job_items` (JSONB) 邨ｱ蜷医→繝・・繧ｿ豌ｸ邯壼喧

## 繝輔ぉ繝ｼ繧ｺ 6.5: 繝・・繧ｿ遘ｻ陦・(Data Migration) - 螳御ｺ・
- [x] **CSV Import**: 譌｢蟄倥・繧ｹ繧ｿ繝・・繧ｿ縺ｮ蜿悶ｊ霎ｼ縺ｿ
  - [x] Scripting: 螟画鋤繧ｹ繧ｯ繝ｪ繝励ヨ菴懈・ (`generate_import_sql.js`)
  - [x] SQL Generation: 繧､繝ｳ繝昴・繝育畑SQL逕滓・
  - [x] Schema Correction: 譛ｪ螳夂ｾｩ繝・・繝悶Ν菴懈・縺ｨFK菫ｮ豁｣ (114000, 114500)
  - [x] Execution: Supabase縺ｸ縺ｮ驕ｩ逕ｨ (121000)
  - [x] Verification: 繝・・繧ｿ莉ｶ謨ｰ遒ｺ隱榊ｮ御ｺ・(`verify_import.js`)
  - [x] Vehicles Seed: 霆贋ｸ｡繝槭せ繧ｿ5莉ｶ謚募・ (`122000`)
  - [x] Drivers Seed: 繝峨Λ繧､繝舌・繝槭せ繧ｿ11莉ｶ謚募・ (`160000`)

## 繝輔ぉ繝ｼ繧ｺ 7: 繧ｳ繝ｼ繧ｹ蛻･驟崎ｻ顔ｮ｡逅・(Course-Based Dispatch) - 螳御ｺ・
- [x] **Course Column Model**: 繧ｳ繝ｼ繧ｹ荳ｻ菴薙き繝ｩ繝縺ｸ縺ｮ繝｢繝・Ν遘ｻ陦・
  - [x] Logic: `useBoardData.js` 蛻晄悄蛹悶Ο繧ｸ繝・け螟画峩 (Default A-E Courses)
  - [x] UI: `DriverHeader.jsx` 繧ｳ繝ｼ繧ｹ蜷榊ｼｷ隱ｿ繝ｻ諡・ｽ楢・牡蠖楢｡ｨ遉ｺ縺ｸ縺ｮ螟画峩
  - [x] UI: `BoardModals.jsx` 繝倥ャ繝繝ｼ邱ｨ髮・Δ繝ｼ繝繝ｫ縺ｮDriver/Vehicle驕ｸ謚朸I蛹・
  - [x] Feature: 繧ｳ繝ｼ繧ｹ霑ｽ蜉繝ｻ蜑企勁讖溯・縺ｮ螳溯｣・

## 繝輔ぉ繝ｼ繧ｺ 8: UI蝓ｺ譛ｬ蜍穂ｽ懊・豢礼ｷｴ (UI Refinement) - 螳御ｺ・
- [x] **Job Creation Hook**: 逶､荳翫ム繝悶Ν繧ｯ繝ｪ繝・け縺ｧ縲梧｡井ｻｶ霑ｽ蜉縲阪Δ繝ｼ繝繝ｫ繧帝幕縺・
- [x] **Phase 6 Verification Support**: 繝｢繝ｼ繝繝ｫ縺ｫ鬘ｧ螳｢驕ｸ謚槭ｒ霑ｽ蜉縺励√ョ繝輔か繝ｫ繝亥刀逶ｮ繧定・蜍募・蜉・
- [x] **Drag & Drop Tuning**: 蛻鈴俣遘ｻ蜍輔・繝ｭ繧ｸ繝・け讀懆ｨｼ螳御ｺ・(Unit Tests Pass)
- [x] **Automated Verification**: Headless邨ｱ蜷医ユ繧ｹ繝医↓繧医ｋ蜍穂ｽ應ｿ晁ｨｼ (Vitest)

## 繝輔ぉ繝ｼ繧ｺ 9: Business OS邨ｱ荳隕乗ｼ縺ｸ縺ｮ螳悟・遘ｻ陦・(Strict Compliance) - 螳御ｺ・
- [x] **SDR Schema Implementation**: `migration_report.md` 縺ｫ蝓ｺ縺･縺上ユ繝ｼ繝悶Ν繝ｻRPC菴懈・
- [x] **RLS Enforcement**: `routes` 繝・・繝悶Ν縺ｸ縺ｮ逶ｴ謗･譖ｸ縺崎ｾｼ縺ｿ遖∵ｭ｢險ｭ螳・
- [x] **Frontend Migration**: `useBoardData.js` 縺ｮ菫晏ｭ伜・逅・ｒRPC邨檎罰縺ｫ螟画峩
- [x] **Verification**: Driver讓ｩ髯舌〒逶ｴ謗･譖ｸ縺崎ｾｼ縺ｿ縺悟､ｱ謨励＠縲ヽPC邨檎罰縺ｮ縺ｿ謌仙粥縺吶ｋ縺薙→繧堤｢ｺ隱・

## 繝輔ぉ繝ｼ繧ｺ 10: UI謾ｹ蝟・& 隱崎ｨｼ雋蛯ｵ縺ｮ隗｣豸・(UI & Auth Polish) - 螳御ｺ・
- [x] **Pending Job Sidebar Redesign**: 譛ｪ驟崎ｻ翫Μ繧ｹ繝医ｒ蜿ｳ蛛ｴ繧ｪ繝ｼ繝舌・繝ｬ繧､蛹悶＠縲√Ξ繧､繧｢繧ｦ繝亥ｴｩ繧碁亟豁｢縺ｨ謫堺ｽ懈ｧ繧貞髄荳・
- [x] **Auth Refactor**: `AuthContext` 蟆主・縺ｫ繧医ｊ縲√ワ繝ｼ繝峨さ繝ｼ繝峨＆繧後◆ID繧呈賜髯､縺励∫屮譟ｻ繝ｭ繧ｰ縺ｮ謨ｴ蜷域ｧ繧堤｢ｺ菫・
  - [x] `AuthContext` / `useAuth` 螳溯｣・
  - [x] `App.jsx`, `BoardCanvas.jsx`, `AdminDashboard.jsx` 縺ｮ謾ｹ菫ｮ
  - [x] 蜍穂ｽ懈､懆ｨｼ螳御ｺ・

## 繝輔ぉ繝ｼ繧ｺ 11: 螳牙ｮ壼喧縺ｨ繝舌げ菫ｮ豁｣ (Stabilization & Bug Fixes) - 螳御ｺ・
- [x] **Data Visibility Diagnosis**: `debug_app_query.cjs` 繧貞ｮ溯｡後ゅョ繝ｼ繧ｿ縺ｯ蟄伜惠縺吶ｋ縺後～drivers` 繧ｯ繧ｨ繝ｪ螟ｱ謨・(400) 縺ｫ繧医ｊ逕ｻ髱｢縺梧ｩ溯・荳榊・縺ｨ蛻､譏弱・
- [x] **Drivers Fix**: `drivers` 繝・・繝悶Ν縺ｫ `display_order` 繧ｫ繝ｩ繝繧定ｿｽ蜉 (Manual SQL) 縺励～useMasterData.js` 縺ｮ豁｣隕上た繝ｼ繝医ｒ蠕ｩ蜈・
- [x] **Assignment Functionality Test**: 譛ｪ驟崎ｻ翫Μ繧ｹ繝医°繧蛾・霆顔乢縺ｸ縺ｮ蜑ｲ繧雁ｽ薙※蜍穂ｽ懃｢ｺ隱・(Verified via Browser Subagent)
- [x] **Save Button Implementation**: 繝倥ャ繝繝ｼ縺ｫ菫晏ｭ倥・繧ｿ繝ｳ繧定ｿｽ蜉縺励√ョ繝ｼ繧ｿ豌ｸ邯壼喧繧貞庄閭ｽ縺ｫ縺吶ｋ

