// 文字が罫線に乗っているか（ADR-016）。dist を配り、本文の要素の上端と高さが罫線の間隔の倍数かを測る
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { createServer } = require('../serve.cjs');

const TOLERANCE = 1;
const dist = fileURLToPath(new URL('../dist', import.meta.url));
// 記事は dist から全部拾う。足した記事も測る
const posts = readdirSync(new URL('../dist/blog/', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => `/blog/${d.name}/`);
const pages = ['/', '/blog/', ...posts];
// 320px は WCAG のリフローの基準の幅
const widths = [320, 390, 768, 1280];
// ブラウザの標準の文字サイズを大きくした人（20px）でも、罫線と文字が一緒に大きくなるか
const rootSizes = [16, 20];

const server = createServer({ dist, noindex: false });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const rootSize of rootSizes) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      if (rootSize !== 16) {
        await page.addInitScript((size) => {
          document.addEventListener('DOMContentLoaded', () => {
            const style = document.createElement('style');
            style.textContent = `html { font-size: ${size}px; }`;
            document.head.prepend(style);
          });
        }, rootSize);
      }
      for (const path of pages) {
        const label = `${width}px 文字${rootSize}px ${path}`;
        await page.goto(`${base}${path}`);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(
          ({ TOLERANCE, rootSize }) => {
            // 罫線の間隔は本文の行の高さ。ページから読む
            const line = Number.parseFloat(getComputedStyle(document.body).lineHeight);
            const off = (v) => {
              const r = ((v % line) + line) % line;
              return Math.min(r, line - r);
            };
            const bad = [];
            // 図やコードの中は数えない。日付欄（.margin-note）は PC では本文と同じ行に並ぶので数える
            const targets = [...document.querySelectorAll('main :is(p, li, h1, h2, h3, dt, dd, tr)')].filter(
              (el) => !el.closest('pre, figure, svg') && el.getClientRects().length > 0,
            );
            // 罫線は紙（.page）ごとに、紙の上端から引く
            for (const el of targets) {
              const rect = el.getBoundingClientRect();
              const top = rect.top - (el.closest('.page')?.getBoundingClientRect().top ?? -window.scrollY);
              if (off(top) > TOLERANCE || off(rect.height) > TOLERANCE) {
                const text = (el.textContent ?? '').trim().slice(0, 30);
                bad.push(`${el.tagName.toLowerCase()} top=${top.toFixed(1)} h=${rect.height.toFixed(1)} 「${text}」`);
              }
            }
            // ナビのリンクとボタンは、指で押せる高さ（44px）を持つ
            const smallTaps = [...document.querySelectorAll('nav :is(a, button)')]
              .filter((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height < 44)
              .map(
                (el) =>
                  `${(el.textContent ?? '').trim() || el.getAttribute('aria-label')} h=${el.getBoundingClientRect().height}`,
              );
            // 紙の高さも罫線の倍数にする（紙の下の端で罫線が切れない）
            for (const p of document.querySelectorAll('.page')) {
              const h = p.getBoundingClientRect().height;
              if (off(h) > TOLERANCE) bad.push(`紙の高さ h=${h.toFixed(1)}`);
            }
            return {
              bad,
              smallTaps,
              line,
              expectedLine: rootSize * 1.75,
              scrollWidth: document.documentElement.scrollWidth,
              count: targets.length,
            };
          },
          { TOLERANCE, rootSize },
        );
        if (result.count === 0) failures.push(`${label}: 測る要素が無い`);
        // 記事は日付欄を使わないので、本文を紙の中央に置く（左だけ空くと右に寄って見える）
        if (path.startsWith('/blog/') && path !== '/blog/') {
          const gap = await page.evaluate(() => {
            const sheet = document.querySelector('.page')?.getBoundingClientRect();
            const body = document.querySelector('.blog-content')?.getBoundingClientRect();
            return sheet && body ? { left: body.left - sheet.left, right: sheet.right - body.right } : null;
          });
          if (!gap || Math.abs(gap.left - gap.right) > 2)
            failures.push(`${label}: 記事の本文が紙の中央に無い（左 ${gap?.left}px・右 ${gap?.right}px）`);
        }
        if (Math.abs(result.line - result.expectedLine) > 0.5)
          failures.push(`${label}: 行の高さが文字の大きさに合わせて変わらない（${result.line}px）`);
        if (result.scrollWidth > width) failures.push(`${label}: 横にはみ出す（${result.scrollWidth}px）`);
        for (const t of result.smallTaps) failures.push(`${label}: ナビの押せる高さが 44px 未満 ${t}`);
        for (const b of result.bad.slice(0, 3)) failures.push(`${label}: 罫線からずれている ${b}`);
        if (result.bad.length > 3) failures.push(`${label}: ほか ${result.bad.length - 3} 件`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`NG ${failures.length}件:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
