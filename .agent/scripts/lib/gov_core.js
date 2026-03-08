/**
 * TBNY DXOS Governance Core Library (EAL) v1.2 (ESM)
 * Environment Abstraction Layer for OS/Shell dependency management.
 * Logic Key: 'RULE_LOAD'
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { readJsonStrict } from './gov_loader.js';

// TBNY DXOS Seal Token: §N 準拠 (seal_rules.json から取得推奨)
let SEAL_TOKEN = '\uff59';
let REQUIRED_SEAL = `(PW: ${SEAL_TOKEN})`;

class GovernanceCore {
    constructor() {
        this.root = process.cwd();
        this.configPath = path.join(this.root, 'governance', 'environment.json');
        this.rulesPath = path.join(this.root, 'governance', 'rules');
        this.env = this._loadEnv();
    }

    _loadEnv() {
        if (!fs.existsSync(this.configPath)) {
            const platform = process.platform === 'win32' ? 'windows' : 'linux';
            const shell = process.env.PSModulePath ? 'powershell' : 'bash';
            return { platform, shell, encoding: 'utf8' };
        }
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }

    getPlatform() {
        return this.env.platform;
    }

    getShell() {
        return this.env.shell;
    }

    /**
     * Get platform-specific command string
     */
    getCommand(cmdKey) {
        if (this.env.commands && this.env.commands[cmdKey]) {
            return this.env.commands[cmdKey];
        }
        const defaults = {
            windows: {
                tail: 'Get-Content -Tail',
                cat: 'Get-Content',
                ls: 'dir',
                rm: 'rm -Force',
                mkdir: 'mkdir'
            },
            linux: {
                tail: 'tail',
                cat: 'cat',
                ls: 'ls',
                rm: 'rm -rf',
                mkdir: 'mkdir -p'
            }
        };
        return defaults[this.env.platform][cmdKey] || cmdKey;
    }

    /**
     * Execute a command with environment-aware error handling
     */
    execute(cmdKey, args = [], options = {}) {
        const cmdBase = this.getCommand(cmdKey);
        // Quote arguments with spaces for Windows/Linux compatibility
        const quotedArgs = args.map(arg => {
            const s = String(arg);
            return (s.includes(' ') && !s.startsWith('"')) ? `"${s}"` : s;
        });
        const fullCmd = `${cmdBase} ${quotedArgs.join(' ')}`;

        try {
            // Force shell usage to match detected environment (esp. for PowerShell aliases)
            const shell = this.getPlatform() === 'windows' ? 'powershell.exe' : true;
            return execSync(fullCmd, { encoding: 'utf8', shell, ...options });
        } catch (error) {
            console.error(`[GovCore] Command failed: ${fullCmd}`);
            throw error;
        }
    }

    /**
     * Read file with environment-appropriate encoding detection
     */
    readFile(filePath) {
        const buffer = fs.readFileSync(filePath);
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return buffer.toString('utf8', 3);
        }

        const encoding = this.env.encoding || 'utf8';
        return buffer.toString(encoding);
    }

    /**
     * Load compliance rules from JSON
     * v6.7: §N Zero-Fallback compliance
     */
    getRule(fileName, keyPath) {
        const potentialPaths = [
            path.join(this.root, 'governance', fileName + '.json'),
            path.join(this.rulesPath, fileName + '.json')
        ];

        let data = null;
        let foundPath = null;
        for (const filePath of potentialPaths) {
            if (fs.existsSync(filePath)) {
                foundPath = filePath;
                break;
            }
        }

        if (foundPath) {
            // §N: Zero-Fallback
            data = readJsonStrict(foundPath, `RULE_LOAD:${fileName}`, `Restore ${foundPath}`);
        }

        if (!data) return null;
        if (!keyPath) return data;
        return keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, data);
    }

    /**
     * Path normalization for Windows/Linux
     */
    normalizePath(p) {
        return path.normalize(p).replace(/\\/g, '/');
    }
}

const govCore = new GovernanceCore();
export { govCore as default, SEAL_TOKEN, REQUIRED_SEAL };
