import fs from 'fs';
import path from 'path';

const target = process.argv.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'all';

function scanPackages() {
    console.log('## 📦 Apps & Packages');
    const dirsToScan = ['apps', 'packages'];
    
    dirsToScan.forEach(dirName => {
        const dirPath = path.join(process.cwd(), dirName);
        if (!fs.existsSync(dirPath)) return;
        
        const subDirs = fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        subDirs.forEach(subDir => {
            const pkgPath = path.join(dirPath, subDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    const portMatch = pkg.scripts?.dev?.match(/--port\s+(\d+)/);
                    const portInfo = portMatch ? ` - Port: ${portMatch[1]}` : '';
                    console.log(`- **${pkg.name}** (${dirName}/${subDir})${portInfo}`);
                } catch (e) {
                    console.log(`- **${subDir}** (${dirName}/${subDir}) - Error parsing package.json`);
                }
            }
        });
    });
    console.log('');
}

function scanDatabase() {
    console.log('## 🗄️ Database Schemas & RPCs (Latest Migrations)');
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        console.log('- No migrations directory found.');
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => b.localeCompare(a)); // 降順（新しい順）

    // 最新の数ファイルだけをスキャンしてトークン節約
    const recentFiles = files.slice(0, 5);
    
    let foundItems = 0;
    
    recentFiles.forEach(file => {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // 関数シグネチャの抽出
        const rpcMatches = [...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_.]+)\s*\(([^)]*)\)/gi)];
        // テーブル名の抽出
        const tableMatches = [...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.]+)/gi)];

        if (rpcMatches.length > 0 || tableMatches.length > 0) {
            console.log(`\n### From \`${file}\``);
            
            tableMatches.forEach(match => {
                console.log(`- 📊 Table: \`${match[1]}\``);
                foundItems++;
            });
            
            rpcMatches.forEach(match => {
                const name = match[1];
                const args = match[2].replace(/\s+/g, ' ').trim();
                // 冗長な引数名は省略気味にする（50文字制限）
                const shortArgs = args.length > 50 ? args.substring(0, 47) + '...' : args;
                console.log(`- ⚡ RPC: \`${name}(${shortArgs})\``);
                foundItems++;
            });
        }
    });
    
    if (foundItems === 0) {
        console.log('- No recently modified tables or RPCs found in the last 5 migrations.');
    }
    console.log('');
}

function main() {
    console.log('# 🗺️ TBNY DXOS Agent SSOT Map\n');
    
    if (target === 'apps' || target === 'all') {
        scanPackages();
    }
    if (target === 'db' || target === 'all') {
        scanDatabase();
    }
    
    if (!['apps', 'db', 'all'].includes(target)) {
        console.log(`⚠️ Unknown target: ${target}. Use --target=apps, db, or all.`);
    }

    // --- 証跡の物理的発行 ---
    try {
        const lockPath = path.join(process.cwd(), '.agent', '.ssot_scanned');
        fs.writeFileSync(lockPath, Date.now().toString(), 'utf8');
        console.log('\n[AGENT SCAN] ✅ SSOT Scan token generated successfully.');
    } catch (e) {
        console.error('\n[AGENT SCAN] ❌ Error generating scan token:', e.message);
    }
}

main();
