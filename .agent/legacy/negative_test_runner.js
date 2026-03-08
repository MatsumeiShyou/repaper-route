#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DENYLIST_PATH = path.join(process.cwd(), 'governance', 'preventions', 'denylist.json');

function runNegativeTest(ruleId, testContent) {
    if (!fs.existsSync(DENYLIST_PATH)) {
        console.error('Error: denylist.json not found.');
        process.exit(1);
    }

    try {
        const { rules } = JSON.parse(fs.readFileSync(DENYLIST_PATH, 'utf8'));
        const rule = rules.find(r => r.id === ruleId);

        if (!rule) {
            console.error(`Error: Rule ID "${ruleId}" not found in denylist.json.`);
            process.exit(1);
        }

        console.log(`\n🧪 Testing Rule [${rule.name}] against provided code...`);
        const patternRegex = new RegExp(rule.pattern, 'g');
        const isDetected = patternRegex.test(testContent);

        if (isDetected) {
            console.log('✅ Rule Successfully Detected the Violation.');
            process.exit(0);
        } else {
            console.error('❌ FAILURE: Rule did NOT detect the violation in the test content.');
            console.error(`   Pattern: ${rule.pattern}`);
            process.exit(1);
        }
    } catch (e) {
        console.error(`Error running negative test: ${e.message}`);
        process.exit(1);
    }
}

// CLI usage (internal for agent)
const [, , ruleId, testFilePath] = process.argv;
if (ruleId && testFilePath) {
    const content = fs.readFileSync(testFilePath, 'utf8');
    runNegativeTest(ruleId, content);
} else {
    console.log('Usage: node negative_test_runner.js <ruleId> <testFilePath>');
}
