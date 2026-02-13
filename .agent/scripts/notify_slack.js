#!/usr/bin/env node
/**
 * AMPLOG → Slack Auto-Notification Script
 * 
 * Usage:
 *   node .agent/scripts/notify_slack.js --message "AMP approved: Feature X"
 *   node .agent/scripts/notify_slack.js --dry-run --message "Test notification"
 *   node .agent/scripts/notify_slack.js --latest  (send latest AMPLOG entry)
 * 
 * AGENTS.md § 2-1 (No Leakage): Webhook URL is read from SLACK_WEBHOOK_URL env var.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.md');

function parseArgs(argv) {
    const args = { dryRun: false, latest: false, message: null };
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--dry-run') args.dryRun = true;
        else if (argv[i] === '--latest') args.latest = true;
        else if (argv[i] === '--message' && argv[i + 1]) args.message = argv[++i];
    }
    return args;
}

function getLatestAMPLOGEntry() {
    if (!fs.existsSync(AMPLOG_PATH)) {
        return null;
    }

    const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().startsWith('|'));

    if (lines.length === 0) return null;

    const lastLine = lines[lines.length - 1];
    const cells = lastLine.split('|').filter(c => c.trim());

    if (cells.length >= 6) {
        return {
            date: cells[0].trim(),
            title: cells[1].trim(),
            scope: cells[2].trim(),
            impact: cells[3].trim(),
            approver: cells[4].trim(),
            status: cells[5].trim()
        };
    }

    return { raw: lastLine };
}

function buildSlackPayload(messageText) {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📋 AMPLOG Update — RePaper Route',
                    emoji: true
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: messageText
                }
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `🕐 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} JST`
                    }
                ]
            }
        ]
    };
}

function sendToSlack(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(webhookUrl);
        const data = JSON.stringify(payload);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(new Error(`Slack API returned ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const args = parseArgs(process.argv);

    console.log('📤 AMPLOG → Slack Notification');
    console.log('==============================\n');

    // Determine message content
    let messageText = '';

    if (args.latest) {
        const entry = getLatestAMPLOGEntry();
        if (!entry) {
            console.error('❌ No AMPLOG entries found.');
            process.exit(1);
        }

        if (entry.raw) {
            messageText = `*New AMP Entry:*\n${entry.raw}`;
        } else {
            messageText = [
                `*🏷️ ${entry.title}*`,
                `• *Scope:* ${entry.scope}`,
                `• *Impact:* ${entry.impact}`,
                `• *Approver:* ${entry.approver}`,
                `• *Status:* ${entry.status}`,
                `• *Date:* ${entry.date}`
            ].join('\n');
        }
    } else if (args.message) {
        messageText = args.message;
    } else {
        console.error('❌ Specify --message "text" or --latest');
        process.exit(1);
    }

    // Dry run mode
    if (args.dryRun) {
        console.log('🧪 Dry Run Mode — No actual notification sent.\n');
        console.log('Payload preview:');
        console.log(JSON.stringify(buildSlackPayload(messageText), null, 2));
        console.log('\n✅ Dry run completed successfully.');
        process.exit(0);
    }

    // Get webhook URL (No Leakage: § 2-1)
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('❌ SLACK_WEBHOOK_URL not set in environment variables.');
        console.error('   Set it in .env file: SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...');
        console.error('   Then load with: dotenv config before running this script.');
        process.exit(1);
    }

    // Send notification
    const payload = buildSlackPayload(messageText);

    try {
        await sendToSlack(webhookUrl, payload);
        console.log('✅ Slack notification sent successfully!');
        console.log(`📍 Message: ${messageText.substring(0, 80)}...`);
    } catch (err) {
        console.error('❌ Failed to send Slack notification:', err.message);
        process.exit(1);
    }
}

main();
