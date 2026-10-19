const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Tipos de contenido para que cargue CSS, JS y HTML sin errores
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Si la ruta es "/" carga index.html, de lo contrario carga el archivo solicitado (ej: /marketplace.html)
    let urlPath = req.url === '/' ? 'index.html' : req.url;
    let filePath = path.join(PUBLIC_DIR, urlPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Archivo no encontrado</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`Error interno del servidor: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('==============================================');
    console.log('🚀 Servidor NorteCafé Pro corriendo en Node.js');
    console.log(`💻 Local:  http://localhost:${PORT}`);
    console.log(`📱 En red: http://10.5.140.32:${PORT}`);
    console.log('Presiona Ctrl + C para detener el servidor.');
    console.log('==============================================');
});