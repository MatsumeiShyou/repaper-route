const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let logs = [];
    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
        logs.push(`[pageerror] ${err.message}`);
    });

    console.log('Navigating to portal to login...');
    await page.goto('http://localhost:5173/');
    
    // Fill credentials
    try {
        await page.fill('input[type="email"]', 'admin@tbny.co.jp');
        await page.fill('input[type="password"]', 'tbny-admin-2026');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
    } catch(e) {
        console.log('Failed to login:', e.message);
    }
    
    // Find the link for RePaper Route
    let targetUrl = '';
    try {
        await page.waitForSelector('.dxos-tile', { timeout: 5000 });
        // Retrieve the tokens via evaluating localstorage OR grabbing the click behavior
        // Actually, let's just grab the session from localStorage of port 5173
        const storageJSON = await page.evaluate(() => window.localStorage.getItem('sb-mjaoolcjjlxwstlpdgrg-auth-token'));
        const storage = JSON.parse(storageJSON);
        const accessToken = storage.access_token;
        const refreshToken = storage.refresh_token;
        
        targetUrl = `http://localhost:5174/?activeView=board#access_token=${accessToken}&refresh_token=${refreshToken}`;
        console.log('Target URL formed.');
    } catch(e) {
        console.log('Failed to get token:', e.message);
    }

    if (targetUrl) {
        console.log('Navigating to SSO target...');
        logs = []; // Clear previous logs
        await page.goto(targetUrl);
        await page.waitForTimeout(6000); // Wait for timeouts
    }

    console.log('\n--- BROWSER CONSOLE LOGS ---');
    console.log(logs.join('\n'));
    console.log('----------------------------\n');

    await browser.close();
})();
