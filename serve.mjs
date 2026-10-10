import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const HOST = 'localhost';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf'
};

const server = createServer(async (req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = join(__dirname, filePath);

    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
        const content = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        console.log(`✓ Served: ${req.url}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Not Found</h1>');
            console.log(`✗ Not found: ${req.url}`);
        } else {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Internal Server Error</h1>');
            console.error(`✗ Error serving ${req.url}:`, error);
        }
    }
});

server.listen(PORT, HOST, () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║                                            ║');
    console.log('║           🚀 NOTESHUB SERVER 🚀           ║');
    console.log('║                                            ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`  Server running at: http://${HOST}:${PORT}`);
    console.log(`  Press Ctrl+C to stop the server\n`);
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Features:                                 ║');
    console.log('║  ✓ Browse & Filter Notes                   ║');
    console.log('║  ✓ Upload & Monetize                       ║');
    console.log('║  ✓ Premium Access Plans                    ║');
    console.log('║  ✓ LocalStorage Persistence                ║');
    console.log('╚════════════════════════════════════════════╝\n');
});

process.on('SIGINT', () => {
    console.log('\n\n👋 Server shutting down gracefully...');
    server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});
