import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', exception => {
    console.log(`BROWSER_ERROR: Uncaught exception: "${exception}"`);
  });
  
  console.log("Navigating to http://localhost:5173 ...");
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 5000 });
    console.log("Page loaded. Taking screenshot just in case.");
    await page.screenshot({ path: '.agent/scripts/debug_screenshot.png' });
  } catch (err) {
    console.log("Navigation error:", err);
  }
  
  await browser.close();
})();
