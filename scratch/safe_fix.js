const fs = require('fs');
const path = require('path');

const targetFiles = [
    'AGENTS.md',
    'walkthrough.md',
    'DEBT_AND_FUTURE.md',
    'DEBT_ARCHIVE.md',
    'governance/inventory.json',
    'AMPLOG.md'
];

function fixFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.length;
    
    //置換対象: 적 -> 的
    content = content.replace(/적/g, '的');
    
    if (content.length !== originalLength || content !== fs.readFileSync(fullPath, 'utf8')) {
        console.log(`✅ Fixed: ${filePath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
    } else {
        console.log(`ℹ️ No changes: ${filePath}`);
    }
}

targetFiles.forEach(fixFile);
console.log('--- Scan completed. ---');
