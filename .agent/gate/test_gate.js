import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StateManager from './state_manager.js';
import InputGate from './input_gate.js';
import OutputGate from './output_gate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Gate / Runtime Control Layer Test ---');

// テスト用の一時退避
const identityPath = path.join(__dirname, '.identity');
// 元の状態を保持（今回はANALYZER前提なのでそのまま進めるが復元用にバックアップ）
const originalIdentity = fs.readFileSync(identityPath, 'utf8').trim();

try {
    // Test 1.1: Input Gate Injection (Declarative)
    console.log('\n[Test 1.1] Input Gate Injection (Declarative)');
    StateManager.setActiveIdentity('ANALYZER');
    const declarativePrompt = 'Decision: これをテストします。';
    const injectedDecl = InputGate.inject(declarativePrompt);
    console.log('Result:', injectedDecl.startsWith('Decision:') && injectedDecl.includes('active_identity = "ANALYZER"') ? '✅ OK' : '❌ FAILED');

    // Test 1.2: Input Gate Injection (Non-Declarative)
    console.log('\n[Test 1.2] Input Gate Injection (Non-Declarative)');
    const nonDeclarativePrompt = 'これをテストしてください。';
    const injectedNonDecl = InputGate.inject(nonDeclarativePrompt);
    console.log('Result:', injectedNonDecl.includes('Intent:\nこれをテストしてください。') && injectedNonDecl.includes('active_identity = "ANALYZER"') ? '✅ OK' : `❌ FAILED\nOutput:\n${injectedNonDecl}`);

    // Test 2: Output Gate - ANALYZER mode (Valid Output)
    console.log('\n[Test 2] Output Gate - ANALYZER Valid');
    const validAnalyzerOutput = '現状のシステムはSDRに基づいて正しく動作しています。これ以上の提案はありません。';
    const resultValid = OutputGate.audit(validAnalyzerOutput);
    console.log('Result:', resultValid === validAnalyzerOutput ? '✅ OK' : '❌ FAILED');

    // Test 3: Output Gate - ANALYZER mode (Invalid Code Generation)
    console.log('\n[Test 3] Output Gate - ANALYZER Invalid (Code Generation)');
    const invalidAnalyzerOutput = '以下のように実装します。\n```javascript\nconsole.log("hello");\n```\n手順は以下の通りです。';
    const resultInvalidCode = OutputGate.audit(invalidAnalyzerOutput);
    console.log('Result:', resultInvalidCode.includes('[REASON]') ? '✅ OK (Blocked)' : '❌ FAILED (Passed: ' + resultInvalidCode + ')');

    // Test 4: Output Gate - Self Declaration
    console.log('\n[Test 4] Output Gate - Self Declaration');
    const selfDeclOutput = '私はANALYZERです。';
    const resultSelfDecl = OutputGate.audit(selfDeclOutput);
    console.log('Result:', resultSelfDecl.includes('[REASON]') ? '✅ OK (Blocked)' : '❌ FAILED');

    // Test 5: Output Gate - EXECUTOR mode (Invalid Analyzer Behavior)
    console.log('\n[Test 5] Output Gate - EXECUTOR Invalid (Analyzer Behavior)');
    StateManager.setActiveIdentity('EXECUTOR');
    const invalidExecutorOutput = '分析のみで停止します。承認をお待ちしています。';
    const resultInvalidExec = OutputGate.audit(invalidExecutorOutput);
    console.log('Result:', resultInvalidExec.includes('[REASON]') ? '✅ OK (Blocked)' : '❌ FAILED');

    // Test 6: Output Gate - EXECUTOR Valid
    console.log('\n[Test 6] Output Gate - EXECUTOR Valid');
    const validExecutorOutput = '指示に従い、実装を行います。';
    const resultValidExec = OutputGate.audit(validExecutorOutput);
    console.log('Result:', resultValidExec === validExecutorOutput ? '✅ OK' : '❌ FAILED');

    console.log('\nAll tests completed.');
} catch (e) {
    console.error('\n❌ Test Error:', e);
} finally {
    // 状態を復元（通常はANALYZER）
    StateManager.setActiveIdentity(originalIdentity);
    console.log('\nState restored to:', originalIdentity);
}
