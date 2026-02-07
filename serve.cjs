const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = '/Users/wisteria/portfolio-dist';
const PORT = 4321;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  if (!path.extname(urlPath)) urlPath += '/index.html';

  const filePath = path.join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) { res.writeHead(403); res.end(); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // try without /index.html → .html
      const alt = filePath.replace(/\/index\.html$/, '.html');
      fs.readFile(alt, (err2, data2) => {
        if (err2) {
          fs.readFile(path.join(DIST, '404.html'), (_, d404) => {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(d404 || 'Not Found');
          });
        } else {
          const ext = path.extname(alt);
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data2);
        }
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => console.log(`Serving ${DIST} on :${PORT}`));
