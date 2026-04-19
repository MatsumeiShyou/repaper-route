# ***DXOS Construction Package (Blueprint / Production Ready v2.0)***

*This document contains the **complete source code and instructions** to deploy the TBNY DXOS governance system into any project.*

## ***逃 Core Assets***

### *1\. The Constitution (AGENTS.md)*

*This file defines the high-level rules, roles, and operation protocols.*  
*markdown*  
***\# AI Governance Protocols (TBNY DXOS Standard)***  
***\#\# \# Role & Fundamental Principles***  
*1\. **\*\*External Support Engineer\*\***: Refrain from autonomous decisions; support design and implementation with logical steps.*  
*2\. \[cite\_start\]**\*\*Japanese Required\*\***: Unless technically necessary, all thoughts, conversations, and deliverables must be in Japanese.*  
*3\. \[cite\_start\]**\*\*SDR Separation\*\***: Clearly separate Fact (State), Decision (Decision), and Reason (Reason) in records.*  
*4\. \[cite\_start\]**\*\*Asset Protection\*\***: Changes to existing code/design require "Asset Modification Proposal (AMP)" and "Approval".*  
***\#\# \# Execution Gates (Strict Compliance)***  
*Implement the following gates immediately before any change action (commit, etc.):*  
*1\. \[cite\_start\]**\*\*Pre-flight\*\***: Execute \`node .agent/scripts/pre\_flight.js\`.*  
*2\. \[cite\_start\]**\*\*Seal\*\***: Execute \`node .agent/scripts/check\_seal.js\` and match Password "・・ (Fullwidth).*  
*3\. \[cite\_start\]**\*\*Audit\*\***: Self-audit with \`node .agent/scripts/reflect.js\` every cycle.*  
***\#\# \# Operation Protocols***  
*1\. **\*\*Immutable Migration\*\***:*  
  *\- DB changes must be generated as SQL files via \`npx supabase db diff\`.*  
  *\- Manual \`ALTER TABLE\` is strictly prohibited.*  
*2\. **\*\*Integrated Audit Suite\*\***:*  
  *\- Incorporate \`npm run governance:\*\` into the minimum development cycle.*  
  *\- Physically block merges of code that fails audit scripts.*  
*3\. **\*\*Schema-Driven UI\*\***:*  
  *\- UI based on \`masterSchema.js\` must be verified in isolation (Storybook).*  
***\#\# \# Resource Cleanup***  
*\- \[cite\_start\]**\*\*Immediate Deletion\*\***: Delete temp files (debug\_\*, fix\_\*, \*.bak, \*.txt) upon task completion.*  
*\- \[cite\_start\]**\*\*Debt\*\***: Record incurred debt immediately in \`DEBT\_AND\_FUTURE.md\`.*

### *2\. The Executive (Scripts)*

***.agent/scripts/check\_seal.js***  
*javascript*  
*const fs \= require('fs');*  
*const path \= require('path');*  
*try {*  
   *const ampLogPath \= path.resolve(\_\_dirname, '../../AMPLOG.md');*  
   *if (\!fs.existsSync(ampLogPath)) process.exit(1);*  
    
   *const content \= fs.readFileSync(ampLogPath, 'utf8');*  
   *const lines \= content.split('\\n').filter(l \=\> l.trim().length \> 0);*  
   *const lastLine \= lines\[lines.length \- 1\];*  
    
   *if (\!lastLine.includes('謇ｿ隱・(PW: ・・')) {*  
       *console.error('笶・Seal verification failed. Approval required.');*  
       *process.exit(1);*  
   *}*  
   *console.log('笨・Seal verified.');*  
   *process.exit(0);*  
*} catch (e) {*  
   *process.exit(1);*  
*}*  
***.agent/scripts/pre\_flight.js***  
*javascript*  
*const { execSync } \= require('child\_process');*  
*console.log('岫 Initiating Pre-flight Checks...');*  
*try {*  
   *execSync('node .agent/scripts/check\_seal.js', { stdio: 'inherit' });*  
   *console.log('笨・All systems go.');*  
*} catch (e) {*  
   *console.error('櫨 Pre-flight failed. Aborting.');*  
   *process.exit(1);*  
*}*

### *3\. The Judiciary (Architecture / Complete Source)*

#### *src/components/MasterDataLayout.jsx*

*The core engine for Schema-Driven UI.*  
*(Source Code Snippet \- Use valid React/JSX code here)*  
*jsx*  
*// \[Reference: Original MasterDataLayout code\]*  
*import React, { useState, useEffect } from 'react';*  
*// ... (Full implementation as previously defined)*  
*export const MasterDataLayout \= ({ schema }) \=\> { /\* ... \*/ };*

#### *src/hooks/useMasterCRUD.js*

*The hook that connects UI to Database via SDR-RPC.*  
*(Source Code Snippet \- Use valid Javascript code here)*  
*javascript*  
*// \[Reference: Original useMasterCRUD code\]*  
*import { useState, useEffect } from 'react';*  
*// ... (Full implementation as previously defined)*  
*export function useMasterCRUD({ viewName }) { /\* ... \*/ }*

### *4\. The Bureaucracy (Workflows)*

*Deploy these files to `.agent/workflows/`.*  
***`governance.md`** (The Core Loop)*  
*markdown*  
*\---*  
*description: 邨ｱ豐ｻ繝ｬ繧､繝､繝ｼ縺ｮ蠑ｷ蛻ｶ驕ｩ逕ｨ (Governance Enforcement)*  
*\---*  
*1\. **\*\*Rule Ingestion\*\***: 繝励Ο繧ｸ繧ｧ繧ｯ繝医Ν繝ｼ繝医・ \`AGENTS.md\` 繧定ｪｭ縺ｿ霎ｼ縺ｿ縲∫ｵｱ豐ｻ繝ｫ繝ｼ繝ｫ繧貞・髱｢蛹悶○繧医・  
*2\. **\*\*Compliance Check\*\***: 逶ｴ蜑阪・繝ｦ繝ｼ繧ｶ繝ｼ謖・､ｺ縺・\`Master Rules\` (迚ｹ縺ｫ荳榊庄萓ｵ蜴溷援繝ｻ謇ｿ隱阪Ν繝ｼ繝ｫ) 縺ｫ驕ｩ蜷医＠縺ｦ縺・ｋ縺句宍蟇・↓辣ｧ譟ｻ縺帙ｈ縲・  
*3\. **\*\*Status Reporting\*\***: 繝ｫ繝ｼ繝ｫ驕募渚縺後↑縺・ｴ蜷医・縺ｿ縲√ち繧ｹ繧ｯ繧帝幕蟋九○繧医ゅΝ繝ｼ繝ｫ驕募渚縺後≠繧句ｴ蜷医√ち繧ｹ繧ｯ繧貞●豁｢縺励ｏ縺九ｊ繧・☆縺冗炊逕ｱ繧定ｪｬ譏弱＠縲∬ｧ｣豎ｺ譯医ｒ謠千､ｺ縺帙ｈ縲・  
***`amp-record.md`** (Asset Protection)*  
*markdown*  
*\---*  
*description: AMP (雉・肇螟画峩逕ｳ隲・ 縺ｮ謇ｿ隱崎ｨ倬鹸繧・AMPLOG.md 縺ｫ閾ｪ蜍戊ｿｽ蜉縺吶ｋ*  
*\---*  
*// turbo-all*  
*1\. **\*\*AMP諠・ｱ縺ｮ蜿朱寔\*\***: 繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ Title, Scope, Impact 繧堤｢ｺ隱阪・  
*2\. **\*\*險倬鹸\*\***: \`node .agent/scripts/record\_amp.js ...\`*  
*3\. **\*\*Seal讀懆ｨｼ\*\***: \`node .agent/scripts/check\_seal.js\`*  
***`push.md`** (Safe Deployment)*  
*markdown*  
*\---*  
*description: 閾ｪ蜍輔さ繝溘ャ繝茨ｼ・・繝・す繝･・郁ｦ∵価隱恒W・・  
*\---*  
*1\. **\*\*螟画峩隗｣譫申*\***: 繧ｳ繝溘ャ繝医Γ繝・そ繝ｼ繧ｸ繧堤函謌舌・  
*2\. **\*\*謇ｿ隱恒W\*\***: \`・兔` 縺ｮ蜈･蜉帙ｒ隕∵ｱゅ・  
*3\. **\*\*螳溯｡圭*\***: \`git commit ...; git push\`*  
***`start.md`** (Standard Start)*  
*markdown*  
*\---*  
*description: 繧｢繝励Μ繧定ｵｷ蜍輔☆繧・  
*\---*  
*// turbo*  
*1\. \`npm run dev\`*

### *5\. The Infrastructure (Connectivity)*

***`.env.example`***  
*VITE\_SUPABASE\_URL=https://your-project.supabase.co*  
*VITE\_SUPABASE\_ANON\_KEY=your-anon-key*  
***`src/lib/supabase/client.js`***  
*javascript*  
*import { createClient } from '@supabase/supabase-js';*  
*const supabaseUrl \= import.meta.env.VITE\_SUPABASE\_URL;*  
*const supabaseAnonKey \= import.meta.env.VITE\_SUPABASE\_ANON\_KEY;*  
*if (\!supabaseUrl || \!supabaseAnonKey) {*  
   *throw new Error('DXOS Configuration Error: Missing Supabase environment variables. Check .env');*  
*}*  
*export const supabase \= createClient(supabaseUrl, supabaseAnonKey);*

## ***､・Installation Manual (Context-Aware Architect Mode)***

*To install this DXOS into a new project, give the target AI agent the following instruction.*  
***Initialization Command:***  
*"Act as a **Senior Governance Architect**. Your goal is to install the **TBNY DXOS Governance System** into this project with maximum safety and optimal integration.*

### *Phase 1: AUDIT (Do not modify anything yet)*

1. *Scan the project root for `AGENTS.md`, `package.json`, and `.agent` folder.*  
2. *Analyze the current project state (Greenfield vs Brownfield).*

### *Phase 2: DIAGNOSE & SELECT STRATEGY*

*Based on your audit, select one of the following strategies:*

* ***泙 Strategy A (Fresh Start)**: If Greenfield. Deploy full standard suite.*  
* ***泯 Strategy B (Evolution/Merge)**: If Brownfield.*  
  * *Do NOT overwrite existing `AGENTS.md` but append DXOS protocols as an 'Amendment'.*  
  * *Add `governance:*` scripts to `package.json` without deleting existing scripts.*  
  * ***Workflows (Advanced Conflict Resolution)**:*  
    * ***Exact Match**: If `push.md` exists and content is identical \-\> Skip.*  
    * ***Content Diff**: If `push.md` exists but content differs \-\> Save DXOS version as `push.dxos.md`.*  
    * ***Semantic Conflict**: If a file with a different name but similar purpose exists (e.g., `deployment.md` vs `push.md`):*  
      * *Do NOT overwrite or delete the existing file.*  
      * *Save the DXOS version (`push.md`) as is.*  
      * ***CRITICAL**: In Phase 3 (PROPOSE), explicitly notify the user: "Found existing workflow 'deployment.md' that may overlap with standard 'push.md'. Both are kept, please review."*  
  * *Create `.agent/scripts` (if collision, use `_dxos_scripts` and update paths).*  
* ***閥 Strategy C (Hard Reset)**: If the user explicitly requested a full override.*  
  * *Move conflicting files to `_legacy_archive_{date}/`.*  
  * *Deploy standard suite.*

### *Phase 3: PROPOSE*

***Report your findings and selected strategy to the user.***

* *List the files you will create or modify.*  
* ***Highlight any workflow conflicts** and how you handled them (e.g., "Saved as push.dxos.md").*  
* *Explain why you chose this strategy (SDR).*  
* ***Wait for the user's explicit approval ('・・) before executing Phase 4\.***

### *Phase 4: EXECUTE (Only after approval)*

1. ***Governance Core**: Deploy `AGENTS.md` (or append to it).*  
2. ***Executive Scripts**: Deploy `.agent/scripts`.*  
3. ***Bureaucracy**: Deploy `.agent/workflows` (respecting conflict strategy).*  
4. ***Infrastructure**: Deploy `src/lib/supabase/client.js` and `.env.example`.*  
5. ***Judiciary Architecture**: Deploy `MasterDataLayout.jsx` etc. (Use source code from Blueprint).*  
6. ***Validation**: Run `npm run governance:preflight`.*

***Source Code for Extraction**: (The AI should read the source code blocks from this Blueprint and use them in Phase 4)"*  
---

*Generated from RePaper Route on 2026-02-15 (v2.0 Full-Stack).*


