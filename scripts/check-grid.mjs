// 文字が罫線に乗っているか（ADR-016）。dist を配り、本文の要素の上端と高さが罫線の間隔（28px）の倍数かを測る
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { createServer } = require('../serve.cjs');

const LINE = 28;
const TOLERANCE = 1;
const pages = ['/', '/blog/', '/blog/errors-are-values/', '/blog/neovim-intro-part1/'];
const widths = [390, 1280];

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const server = createServer({ dist, noindex: false });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of pages) {
      await page.goto(`${base}${path}`);
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(
        ({ LINE, TOLERANCE }) => {
          const off = (v) => {
            const r = ((v % LINE) + LINE) % LINE;
            return Math.min(r, LINE - r);
          };
          const bad = [];
          // 図やコードの中は数えない。日付欄（.margin-note）は PC では本文と同じ行に並ぶので数える
          const targets = [...document.querySelectorAll('main :is(p, li, h1, h2, h3, dt, dd, tr)')].filter(
            (el) => !el.closest('pre, figure, svg') && el.getClientRects().length > 0,
          );
          for (const el of targets) {
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            if (off(top) > TOLERANCE || off(rect.height) > TOLERANCE) {
              const text = (el.textContent ?? '').trim().slice(0, 30);
              bad.push(`${el.tagName.toLowerCase()} top=${top.toFixed(1)} h=${rect.height.toFixed(1)} 「${text}」`);
            }
          }
          return { bad, scrollWidth: document.documentElement.scrollWidth, count: targets.length };
        },
        { LINE, TOLERANCE },
      );
      if (result.count === 0) failures.push(`${width}px ${path}: 測る要素が無い`);
      if (result.scrollWidth > width) failures.push(`${width}px ${path}: 横にはみ出す（${result.scrollWidth}px）`);
      for (const b of result.bad.slice(0, 5)) failures.push(`${width}px ${path}: 罫線からずれている ${b}`);
      if (result.bad.length > 5) failures.push(`${width}px ${path}: ほか ${result.bad.length - 5} 件`);
    }
    await page.close();
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
