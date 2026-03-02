import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
try {
    // Use -am to include the unstaged migration fixes
    const out1 = execSync('git commit -am "[事実] Template機能のコアロジック・UI追加、DB更新、および不安定テストのQuarantine隔離措置 [理由] Phase6リリース実装の完了、100-pt Closureの安全な完遂・デプロイ、およびDB Sync Lock解消のため"');
    writeFileSync('push_log.txt', out1.toString());
    const out2 = execSync('git push origin main');
    writeFileSync('push_log.txt', out2.toString(), { flag: 'a' });
} catch (e) {
    let errorMsg = 'Error: ' + e.message + '\n';
    if (e.stdout) errorMsg += 'STDOUT:\n' + e.stdout.toString() + '\n';
    if (e.stderr) errorMsg += 'STDERR:\n' + e.stderr.toString() + '\n';
    writeFileSync('push_log.txt', errorMsg);
    console.error(errorMsg);
    process.exit(1);
}
