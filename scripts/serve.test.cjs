// serve.cjs の配信の振る舞いを確かめる（本番と staging の違い、ディレクトリの外への脱出）
const { test, before, after } = require('node:test');
const http = require('node:http');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../serve.cjs');

let root;
let dist;
const servers = [];

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-test-'));
  dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'blog'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<p>top</p>');
  fs.writeFileSync(path.join(dist, 'blog', 'index.html'), '<p>blog</p>');
  fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  fs.writeFileSync(path.join(dist, '404.html'), '<p>404</p>');
  // dist と同じ文字で始まる隣のディレクトリ（外に出られてはいけない）
  fs.mkdirSync(path.join(root, 'dist-secret'));
  fs.writeFileSync(path.join(root, 'dist-secret', 'index.html'), 'secret');
});

after(() => {
  for (const s of servers) s.close();
  fs.rmSync(root, { recursive: true, force: true });
});

async function start(noindex) {
  const server = createServer({ dist, noindex });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return (p) => fetch(`http://127.0.0.1:${port}${p}`);
}

// fetch は送る前に URL の .. を取り除くので、パスをそのまま送るときは http.get を使う
async function startRaw() {
  const server = createServer({ dist, noindex: false });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return (p) =>
    new Promise((resolve, reject) => {
      http
        .get({ host: '127.0.0.1', port, path: p }, (res) => {
          let body = '';
          res.on('data', (c) => {
            body += c;
          });
          res.on('end', () => resolve({ status: res.statusCode, body }));
        })
        .on('error', reject);
    });
}

test('本番: ページを返し、noindex を付けない', async () => {
  const get = await start(false);
  const res = await get('/blog/');
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '<p>blog</p>');
  assert.equal(res.headers.get('x-robots-tag'), null);
});

test('本番: robots.txt は dist のものを返す', async () => {
  const get = await start(false);
  assert.equal(await (await get('/robots.txt')).text(), 'User-agent: *\nAllow: /\n');
});

test('staging: すべての応答に noindex を付ける', async () => {
  const get = await start(true);
  for (const p of ['/', '/blog/', '/no-such-page/']) {
    const res = await get(p);
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', p);
  }
});

test('staging: robots.txt はすべて拒否する', async () => {
  const get = await start(true);
  const res = await get('/robots.txt');
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'User-agent: *\nDisallow: /\n');
});

test('無いページは 404.html を 404 で返す', async () => {
  const get = await start(false);
  const res = await get('/no-such-page/');
  assert.equal(res.status, 404);
  assert.equal(await res.text(), '<p>404</p>');
});

test('dist の外（同じ文字で始まる隣のディレクトリ）には出られない', async () => {
  const get = await startRaw();
  for (const p of ['/../dist-secret/index.html', '/%2e%2e/dist-secret/index.html']) {
    const res = await get(p);
    assert.equal(res.status, 403, p);
    assert.notEqual(res.body, 'secret', p);
  }
});
