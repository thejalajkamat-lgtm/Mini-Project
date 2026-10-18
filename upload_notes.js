const fs = require('fs');
const path = require('path');

// This script reads all PDFs from SEM 2 folder and prepares them for upload
// You'll upload these via the web interface

const baseDir = 'C:\Users\JALAJ KAMAT\Documents\SEM 2';

// Map folder names to our subject options
const subjectMap = {
    'BCVS': 'BCVS',
    'DSA': 'DM',  // Data Structures Algorithm -> Discrete Math
    'ECONOMICS': 'Statistics',
    'FUNDAMENTALS OF ECONOMICS': 'Statistics',
    'LA': 'DM',  // Linear Algebra -> Discrete Math
    'PEE': 'PE',  // Physical Education
    'SPS': 'SPS'
};

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

const allFiles = getAllFiles(baseDir);

console.log(`\n📚 Found ${allFiles.length} files to upload:\n`);

allFiles.forEach((file, index) => {
    const relative = path.relative(baseDir, file);
    const parts = relative.split(path.sep);
    const subject = parts[0];
    const fileName = parts[parts.length - 1];
    const fileSize = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
    
    console.log(`${index + 1}. ${fileName} (${fileSize}MB) - Subject: ${subjectMap[subject] || subject}`);
});

console.log(`\n✅ Total: ${allFiles.length} files ready to upload`);
console.log(`\n📝 Instructions:`);
console.log(`1. Open http://localhost:5000`);
console.log(`2. Go to "Upload & Earn" section`);
console.log(`3. Upload each file one by one`);
console.log(`4. Use the subject mapping above for each file`);
console.log(`5. College: KITCoek`);
console.log(`6. Semester: 2`);
console.log(`7. Type: Free`);

