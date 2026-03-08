import fs from 'fs';

try {
    const data = fs.readFileSync('lint_errors.json', 'utf8');
    const results = JSON.parse(data);
    const summary = results.flatMap(r => r.messages.map(m => ({
        file: r.filePath.replace(process.cwd(), ''),
        ruleId: m.ruleId,
        message: m.message,
        line: m.line
    })));

    console.log('Total Errors:', summary.length);
    summary.forEach(e => console.log(`${e.file}:${e.line} [${e.ruleId}] ${e.message}`));
} catch (e) {
    console.error('Error parsing lint report:', e);
}
