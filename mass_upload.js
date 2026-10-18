const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const baseDir = 'C:\\Users\\JALAJ KAMAT\\Documents\\SEM 2';

// Subject mapping
const subjectMap = {
    BCVS: 'BCVS',
    DSA: 'DM',
    ECONOMICS: 'Statistics',
    'FUNDAMENTALS OF ECONOMICS': 'Statistics',
    LA: 'DM',
    PEE: 'PE',
    SPS: 'SPS'
};

function getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir, {withFileTypes:true});
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
        } else if (item.isFile() && (fullPath.endsWith('.pdf') || fullPath.endsWith('.docx') || fullPath.endsWith('.doc'))) {
            files.push(fullPath);
        }
    }
    return files;
}

async function uploadFile(page, filePath) {
    const fileName = path.basename(filePath);
    const relative = path.relative(baseDir, filePath);
    const parts = relative.split(path.sep);
    const sourceFolder = parts[0];
    const subject = subjectMap[sourceFolder] || sourceFolder;

    // Fill form inputs
    await page.focus('#noteTitle');
    await page.keyboard.type(fileName);

    await page.select('#noteCollege', 'KITCoek');
    await page.select('#noteSubject', subject);
    await page.select('#noteSemester', '2');
    await page.select('#noteType', 'free');

    // Description same as title
    await page.focus('#noteDescription');
    await page.keyboard.type(fileName);

    // Set file
    const input = await page.$('#noteFile');
    await input.uploadFile(filePath);

    // Wait a bit for file name to show
    await page.waitForTimeout(500);

    // Submit form
    const form = await page.$('#uploadForm');
    await form.evaluate(f => f.submit());

    // Wait for success toast or message
    await page.waitForFunction(() => document.body.innerText.includes('Note uploaded successfully'), {timeout:5000}).catch(() => {});
}

(async () => {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    // Go to upload page
    await page.goto('http://localhost:5000', {waitUntil:'networkidle2'});

    // Scroll to upload section maybe
    await page.evaluate(() => {const el = document.getElementById('upload'); if(el){el.scrollIntoView();}});

    const files = getAllFiles(baseDir);
    console.log(`Found ${files.length} files to upload.`);

    for (let i=0;i<files.length;i++) {
        console.log(`Uploading (${i+1}/${files.length}) ${path.basename(files[i])}`);
        try {
            await uploadFile(page, files[i]);
            console.log('✓ Uploaded');
        } catch (e) {
            console.error('❌ Error uploading:', e.message);
        }
        // small delay between uploads
        await page.waitForTimeout(300);
    }

    console.log('✅ All uploads completed.');
    await browser.close();
})();
