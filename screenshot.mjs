import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000';
const label = args[1] ? `-${args[1]}` : '';

const screenshotDir = './temporary screenshots';

// Create directory if it doesn't exist
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

// Find the next available screenshot number
let screenshotNum = 1;
while (fs.existsSync(path.join(screenshotDir, `screenshot-${screenshotNum}${label}.png`))) {
    screenshotNum++;
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2' });

    const screenshotPath = path.join(screenshotDir, `screenshot-${screenshotNum}${label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`Screenshot saved: ${screenshotPath}`);

    await browser.close();
})();
