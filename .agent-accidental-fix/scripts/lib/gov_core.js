/**
 * TBNY DXOS Governance Core Library (EAL)
 * Environment Abstraction Layer for OS/Shell dependency management.
 */

const fs = require('fs');
const path = require('path');

class GovernanceCore {
    constructor() {
        this.configPath = path.join(process.cwd(), 'governance', 'environment.json');
        this.rulesPath = path.join(process.cwd(), 'governance', 'rules');
        this.env = this._loadEnv();
    }

    _loadEnv() {
        if (!fs.existsSync(this.configPath)) {
            // Fallback to auto-detection if config is missing
            return {
                platform: process.platform === 'win32' ? 'windows' : 'linux',
                shell: process.env.PSModulePath ? 'powershell' : 'bash'
            };
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
        // General defaults
        const defaults = {
            windows: { tail: 'Get-Content -Tail', cat: 'Get-Content', ls: 'dir' },
            linux: { tail: 'tail', cat: 'cat', ls: 'ls' }
        };
        return defaults[this.env.platform][cmdKey] || cmdKey;
    }

    /**
     * Read file with environment-appropriate encoding detection
     */
    readFile(filePath) {
        // Implementation for future: actual encoding detection
        // For now, standardize on utf8 but allow for customization via environment.json
        const encoding = this.env.encoding || 'utf8';
        return fs.readFileSync(filePath, encoding);
    }

    /**
     * Load compliance rules
     */
    getRule(fileName, keyPath) {
        const filePath = path.join(this.rulesPath, fileName + '.json');
        if (!fs.existsSync(filePath)) return null;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!keyPath) return data;

        return keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : null, data);
    }
}

module.exports = new GovernanceCore();
