const fs = require('fs');
const path = require('path');

const targetFiles = [
    'AGENTS.md',
    'walkthrough.md',
    'DEBT_AND_FUTURE.md',
    'DEBT_ARCHIVE.md',
    '_archived/AMPLOG_legacy.md',
    'AMPLOG.md',
    'governance/inventory.json',
    'governance/risk_matrix.json',
    'governance/compliance.json',
    'governance/thought_rules.json',
    'governance/closure_conditions.json'
];

// ハングル文字の範囲: AC00-D7AF
const hangulRegex = /[\uAC00-\uD7AF]/g;

function fixFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.match(hangulRegex);
    
    if (matches) {
        console.log(`🔍 Found ${matches.length} illegal chars in ${filePath}: ${Array.from(new Set(matches)).join(', ')}`);
        
        // 特色的な置換 (的, の, 等)
        content = content.replace(/적/g, '的');
        content = content.replace(/의/g, 'の');
        content = content.replace(/들/g, '達');
        
        // それ以外の未知のハングルは警告し、目視確認を促すか、? に置換
        // 今回は「의(の), 적(的)」以外はほぼ混入しないはずなので、全置換は慎重に行う
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
    } else {
        console.log(`ℹ️  Clean: ${filePath}`);
    }
}

console.log('🛡️ Sanctuary Heavy Audit: Start');
targetFiles.forEach(fixFile);
console.log('🛡️ Sanctuary Heavy Audit: Completed');
