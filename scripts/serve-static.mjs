// Minimal static file server with no dependencies.
// Used by playwright.config.ts when NIT_SITE_DIR points at a local copy of
// the nIT site, so the suite can run offline or against an unreleased build.
// Usage: node scripts/serve-static.mjs <folder> [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const port = Number(process.argv[3] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No index.html in ${root} – check NIT_SITE_DIR`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = path.resolve(root, '.' + urlPath);
    // Never serve anything outside the site folder
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:${port}`));
