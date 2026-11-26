import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(__dirname, '..', 'site');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.py': 'text/x-python; charset=utf-8',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/DataDojo') {
    res.writeHead(301, { Location: '/DataDojo/' });
    return res.end();
  }
  if (!urlPath.startsWith('/DataDojo/')) {
    urlPath = '/DataDojo' + (urlPath.startsWith('/') ? urlPath : '/' + urlPath);
  }
  let rel = urlPath.slice('/DataDojo/'.length);
  if (!rel || rel.endsWith('/')) {
    rel += 'index.html';
  }
  let fullPath = path.join(SITE_DIR, rel);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    fullPath = path.join(fullPath, 'index.html');
  }

  if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    console.warn(`[404] ${req.method} ${urlPath} -> ${fullPath}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + urlPath);
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${SITE_DIR} on http://127.0.0.1:${PORT}/DataDojo/`);
});
