const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const rawPath = (req.url || '/').split('?')[0];
  let safeRelPath;
  try {
    safeRelPath = decodeURIComponent(rawPath);
  } catch (_err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  if (safeRelPath === '/' || safeRelPath === '') {
    safeRelPath = '/index.html';
  }

  // Локальная эмуляция Vercel-функции заказа
  if (safeRelPath === '/api/order') {
    require('./api/order.js')(req, res);
    return;
  }

  const segments = safeRelPath.split(/[\\/]+/).filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const resolvedPath = path.resolve(ROOT_DIR, '.' + safeRelPath);
  if (resolvedPath !== ROOT_DIR && !resolvedPath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(resolvedPath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLanAddress();
  console.log(`AERA Bishkek server running:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  if (lanIp) {
    console.log(`  Network: http://${lanIp}:${PORT}`);
  }
});
