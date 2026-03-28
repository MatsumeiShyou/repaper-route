# ***DXOS Construction Package (Blueprint / Production Ready v2.0)***

*This document contains the **complete source code and instructions** to deploy the TBNY DXOS governance system into any project.*

## ***📦 Core Assets***

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
*2\. \[cite\_start\]**\*\*Seal\*\***: Execute \`node .agent/scripts/check\_seal.js\` and match Password "ｙ" (Fullwidth).*  
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
    
   *if (\!lastLine.includes('承認 (PW: ｙ)')) {*  
       *console.error('❌ Seal verification failed. Approval required.');*  
       *process.exit(1);*  
   *}*  
   *console.log('✅ Seal verified.');*  
   *process.exit(0);*  
*} catch (e) {*  
   *process.exit(1);*  
*}*  
***.agent/scripts/pre\_flight.js***  
*javascript*  
*const { execSync } \= require('child\_process');*  
*console.log('🛫 Initiating Pre-flight Checks...');*  
*try {*  
   *execSync('node .agent/scripts/check\_seal.js', { stdio: 'inherit' });*  
   *console.log('✅ All systems go.');*  
*} catch (e) {*  
   *console.error('🔥 Pre-flight failed. Aborting.');*  
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
*description: 統治レイヤーの強制適用 (Governance Enforcement)*  
*\---*  
*1\. **\*\*Rule Ingestion\*\***: プロジェクトルートの \`AGENTS.md\` を読み込み、統治ルールを内面化せよ。*  
*2\. **\*\*Compliance Check\*\***: 直前のユーザー指示が \`Master Rules\` (特に不可侵原則・承認ルール) に適合しているか厳密に照査せよ。*  
*3\. **\*\*Status Reporting\*\***: ルール違反がない場合のみ、タスクを開始せよ。ルール違反がある場合、タスクを停止しわかりやすく理由を説明し、解決案を提示せよ。*  
***`amp-record.md`** (Asset Protection)*  
*markdown*  
*\---*  
*description: AMP (資産変更申請) の承認記録を AMPLOG.md に自動追加する*  
*\---*  
*// turbo-all*  
*1\. **\*\*AMP情報の収集\*\***: ユーザーに Title, Scope, Impact を確認。*  
*2\. **\*\*記録\*\***: \`node .agent/scripts/record\_amp.js ...\`*  
*3\. **\*\*Seal検証\*\***: \`node .agent/scripts/check\_seal.js\`*  
***`push.md`** (Safe Deployment)*  
*markdown*  
*\---*  
*description: 自動コミット＆プッシュ（要承認PW）*  
*\---*  
*1\. **\*\*変更解析\*\***: コミットメッセージを生成。*  
*2\. **\*\*承認PW\*\***: \`ｙ\` の入力を要求。*  
*3\. **\*\*実行\*\***: \`git commit ...; git push\`*  
***`start.md`** (Standard Start)*  
*markdown*  
*\---*  
*description: アプリを起動する*  
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

## ***🤖 Installation Manual (Context-Aware Architect Mode)***

*To install this DXOS into a new project, give the target AI agent the following instruction.*  
***Initialization Command:***  
*"Act as a **Senior Governance Architect**. Your goal is to install the **TBNY DXOS Governance System** into this project with maximum safety and optimal integration.*

### *Phase 1: AUDIT (Do not modify anything yet)*

1. *Scan the project root for `AGENTS.md`, `package.json`, and `.agent` folder.*  
2. *Analyze the current project state (Greenfield vs Brownfield).*

### *Phase 2: DIAGNOSE & SELECT STRATEGY*

*Based on your audit, select one of the following strategies:*

* ***🟢 Strategy A (Fresh Start)**: If Greenfield. Deploy full standard suite.*  
* ***🟡 Strategy B (Evolution/Merge)**: If Brownfield.*  
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
* ***🔴 Strategy C (Hard Reset)**: If the user explicitly requested a full override.*  
  * *Move conflicting files to `_legacy_archive_{date}/`.*  
  * *Deploy standard suite.*

### *Phase 3: PROPOSE*

***Report your findings and selected strategy to the user.***

* *List the files you will create or modify.*  
* ***Highlight any workflow conflicts** and how you handled them (e.g., "Saved as push.dxos.md").*  
* *Explain why you chose this strategy (SDR).*  
* ***Wait for the user's explicit approval ('ｙ') before executing Phase 4\.***

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

