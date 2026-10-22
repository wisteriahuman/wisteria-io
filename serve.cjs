// dist/ を配る静的サーバー。本番は既定値のまま、staging は環境変数で配る場所と検索よけを切り替える（ADR-015）
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const DISALLOW_ALL = 'User-agent: *\nDisallow: /\n';

function createServer({ dist, noindex }) {
  const root = path.resolve(dist);
  const send = (res, status, type, body) => {
    const headers = { 'Content-Type': type };
    if (noindex) headers['X-Robots-Tag'] = 'noindex, nofollow';
    res.writeHead(status, headers);
    res.end(body);
  };
  const typeOf = (file) => MIME[path.extname(file)] || 'application/octet-stream';

  return http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      send(res, 400, 'text/plain', 'Bad Request');
      return;
    }
    // ヌル文字があると fs が例外を投げてプロセスごと落ちるので、先に断る
    if (urlPath.includes('\0')) {
      send(res, 400, 'text/plain', 'Bad Request');
      return;
    }
    if (noindex && urlPath === '/robots.txt') {
      send(res, 200, 'text/plain', DISALLOW_ALL);
      return;
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    if (!path.extname(urlPath)) urlPath += '/index.html';

    // root と同じ文字で始まる隣のディレクトリに出られないよう、区切り文字まで含めて比べる
    const inside = (file) => file.startsWith(root + path.sep);
    const notFound = () =>
      fs.readFile(path.join(root, '404.html'), (_, d404) => {
        send(res, 404, 'text/html', d404 || 'Not Found');
      });

    const filePath = path.join(root, urlPath);
    if (!inside(filePath)) {
      send(res, 403, 'text/plain', 'Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (!err) {
        send(res, 200, typeOf(filePath), data);
        return;
      }
      // /about/index.html が無ければ /about.html を探す。/ のときは <root>.html になり外に出るので探さない
      const alt = filePath.replace(/\/index\.html$/, '.html');
      if (!inside(alt)) {
        notFound();
        return;
      }
      fs.readFile(alt, (err2, data2) => {
        if (!err2) {
          send(res, 200, typeOf(alt), data2);
          return;
        }
        notFound();
      });
    });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const dist = process.env.DIST || '/Users/wisteria/portfolio-dist';
  const port = Number(process.env.PORT || 4321);
  const noindex = process.env.NOINDEX === '1';
  createServer({ dist, noindex }).listen(port, '0.0.0.0', () =>
    console.log(`Serving ${dist} on :${port}${noindex ? ' (noindex)' : ''}`),
  );
}
