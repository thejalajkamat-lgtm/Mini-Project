const fs = require('fs');
const path = require('path');

// Open IndexedDB
const DB_NAME = 'NoteshubDB';
const STORE_NAME = 'notes';

let db;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Save note to IndexedDB
function saveNote(note) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(note);

        request.onsuccess = () => resolve(note);
        request.onerror = () => reject(request.error);
    });
}

// Subject mapping
const subjectMap = {
    'BCVS': 'BCVS',
    'DSA': 'DM',
    'ECONOMICS': 'Statistics',
    'FUNDAMENTALS OF ECONOMICS': 'Statistics',
    'LA': 'DM',
    'PEE': 'PE',
    'SPS': 'SPS'
};

// Get all files
function getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
        } else if (item.endsWith('.pdf') || item.endsWith('.docx') || item.endsWith('.doc')) {
            files.push(fullPath);
        }
    });

    return files;
}

// Main upload function
async function uploadAllNotes() {
    try {
        // Initialize DB
        await initDB();
        console.log('✅ IndexedDB initialized\n');

        const baseDir = 'C:\\Users\\JALAJ KAMAT\\Documents\\SEM 2';
        const files = getAllFiles(baseDir);

        console.log(`📚 Found ${files.length} files to upload\n`);

        let uploadedCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const fileContent = fs.readFileSync(file);
                const base64 = fileContent.toString('base64');
                const fileName = path.basename(file);
                const relative = path.relative(baseDir, file);
                const subject = relative.split(path.sep)[0];
                const mappedSubject = subjectMap[subject] || subject;

                const newNote = {
                    id: Date.now() + Math.random(),
                    title: fileName,
                    college: 'KITCoek',
                    subject: mappedSubject,
                    semester: '2',
                    description: fileName,
                    type: 'free',
                    price: 0,
                    author: 'You',
                    fileName: fileName,
                    fileMimeType: 'application/pdf',
                    fileData: base64,
                    fileSize: fileContent.length,
                    uploadedAt: new Date().toISOString()
                };

                await saveNote(newNote);
                uploadedCount++;

                console.log(`✅ [${uploadedCount}/${files.length}] ${fileName} (${mappedSubject})`);

            } catch (error) {
                errorCount++;
                console.log(`❌ Error uploading ${path.basename(file)}: ${error.message}`);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Upload Complete!`);
        console.log(`📊 Uploaded: ${uploadedCount}/${files.length}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`${'='.repeat(60)}\n`);

        console.log('📝 Notes uploaded and saved to IndexedDB');
        console.log('🌐 Refresh http://localhost:5000 to see your notes');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

// Run if this is Node.js (for testing)
if (typeof window === 'undefined') {
    console.log('⚠️  This script is for browser use only');
    console.log('Run this code in browser console at http://localhost:5000');
} else {
    uploadAllNotes();
}

module.exports = uploadAllNotes;
