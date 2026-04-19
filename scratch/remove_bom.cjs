const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                getFiles(name, fileList);
            }
        } else {
            if (/\.(json|js|md|ts|tsx)$/.test(name)) {
                fileList.push(name);
            }
        }
    });
    return fileList;
}

const files = getFiles(process.cwd());
files.push(path.join(process.cwd(), 'AGENTS.md'));

files.forEach(file => {
    let content = fs.readFileSync(file);
    // Check for UTF-8 BOM (0xEF, 0xBB, 0xBF)
    if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
        console.log(`🧹 Removing BOM from: ${file}`);
        content = content.slice(3);
        fs.writeFileSync(file, content);
    }
});

console.log('✨ BOM Purification Completed.');
