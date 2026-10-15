# 段階②-a C（大学ノート）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR #12 で入れた「紙の質感」を、大学ノート（白い紙・水色の罫線・赤い余白線・文字が罫線に乗る・箱や札の無い書き方）に作り直す。中身と順番は変えない。

**Architecture:** 罫線は `body` の背景に 28px おきに引き、本文の行の高さも 28px にして、すべての縦の寸法を 28px の倍数にそろえる。ページは `.sheet`（余白線と日付欄を持つ1頁）に載せ、部品は箱をやめて行で書く。文字が罫線に乗っていることは、ビルド結果をブラウザで開いて要素の位置を測る検査（`pnpm check:grid`）で守り、ノートに無い部品のクラスが残っていないことは `pnpm check` で守る。

**Tech Stack:** Astro 5、Tailwind CSS 4（`@theme`・`@layer components`）、`node:test`、Playwright（`channel: 'chrome'`）、CSS の `round()` と container query units

**Spec:** [docs/superpowers/specs/2026-10-15-redesign-design.md](../specs/2026-10-15-redesign-design.md) の「C. 見た目の土台（大学ノート）」。理由と判断は [ADR-016](../../adr/adr-016-paper-look.md)、決めたことは [設計](../../design/redesign.md) の「見た目」

## Global Constraints

- 変更は PR #12（`feat/paper-look`）に積む。git・gh の書き込みは単発のコマンド、PR の本文は `--body-file`
- PR #12 は、staging で本人に見てもらい、問題が無いと言われてから merge する
- トークン: 紙 `#fdfdfa`、文字 `#1d1f24`、薄い文字 `#4f5560`、ボールペンの青 `#24489a`、罫線 `#b9d4ea`、余白線 `#e3a0a0`、蛍光ペン `#e4d9f4`、黄色の見本 `#fbef9f`
- 文字と地のコントラストは 4.5:1 以上
- 本文は 16px、行の高さは 28px。縦の寸法はすべて 28px の倍数（Tailwind の `7` = 28px、`14` = 56px、`28` = 112px、`42` = 168px）
- 角の丸い面・影・枠の線を使わない（コードの `pre` を除く）。手書き風の書体・落書き・紙の破れは使わない
- 見出しも本文もゴシック。明朝は使わない。等幅はロゴと「この部分の作り」のラベルだけ
- 日本語は端末のフォントを使い、Web フォントを足さない（ADR-009）
- 動きは About の場面（E）だけ。セクションが浮き上がる動きはやめる
- 中身（文言・順番・リンク先）は変えない
- タップできるところは高さ 44px 以上
- Lighthouse（モバイル）の Accessibility・Best Practices・SEO は 100、Performance は 95 以上

## Review Focus

- コードの行が長いとき: `pre` に横スクロールのバーが出ると、端末によって高さが 28px の倍数から外れ、下の文字が罫線からずれる → Task 4 で `pre` を折り返しにし、`check:grid` で長いコードのある記事（`errors-are-values`）の後ろの段落を測る
- 表が画面より広いとき: 表に横スクロールを付けると同じずれが出て、付けないとはみ出す → Task 4 で表のセルを折り返しにし、`check:grid` の `scrollWidth` の確認で 390px でもはみ出さないことを確かめる
- 図（mermaid）の高さ: SVG の高さは図ごとにばらばらで、そのままだと図の後ろが罫線からずれる → Task 4 で図の枠の高さを `round(up, …, 28px)` で切り上げ、`check:grid` で図のある記事（`neovim-intro-part1`）を測る
- 大きさの違う文字を同じ行に混ぜたとき（本文の中の行内のコード・蛍光ペンの札）: 行の箱が 28px より高くなり、下がずれる → Task 1 で行内のコードの `line-height` を 1 にし、`check:grid` で記事とトップを測る
- 黄色の見本の切り替え: 本番に残ると、URL に `?marker=yellow` を付けた人だけ色が変わる → Task 6 で、本人が色を決めたら切り替えを消し、`pnpm check` で `data-marker` が残っていないことを確かめる

---

ブランチ: `feat/paper-look`（PR #12、すでにある）

### Task 1: ノートのトークンと紙・線・頁の CSS

**Files:**
- Modify: `scripts/contrast.test.cjs`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BlogPost.astro`（`<style is:global>` だけ。前のトークンを `@apply` していて、トークンを消すとビルドが止まるため）

**Interfaces:**
- Produces: Tailwind のトークン `paper`・`ink`・`ink-muted`・`pen`・`rule`・`margin`・`marker`・`marker-yellow`（`text-pen`・`bg-paper` などのクラス）、`font-mono`（JetBrains Mono → 端末の等幅）。`@layer components` のクラス `.sheet`（頁。余白線を描く）・`.margin-note`（PC では余白線の左の日付欄に出し、スマホでは本文の上の1行にする。親は `relative`）・`.marker`（蛍光ペン）。CSS 変数 `--line`（28px）

- [ ] **Step 1: コントラストの検査を新しい組み合わせにする**

`scripts/contrast.test.cjs` の `pairs` を次にする（ほかはそのまま）:

```js
// 文字の色 × 地の色。罫線と余白線は飾りの線なので対象にしない
const pairs = [
  ['ink', 'paper'],
  ['ink-muted', 'paper'],
  ['pen', 'paper'],
  ['ink', 'marker'],
  ['ink-muted', 'marker'],
  ['pen', 'marker'],
  ['ink', 'marker-yellow'],
  ['ink-muted', 'marker-yellow'],
  ['pen', 'marker-yellow'],
];
```

- [ ] **Step 2: 失敗を確かめる**

Run: `pnpm test`
Expected: FAIL（`--color-pen が @theme に無い`・`--color-marker が @theme に無い` など）。serve の検査8件は pass

- [ ] **Step 3: global.css を書き換える**

`src/styles/global.css` の全体を次にする:

```css
@import "tailwindcss";

/* 大学ノート（ADR-016）。値を変えたら pnpm test のコントラストの検査が確かめる */
@theme {
  --color-paper: #fdfdfa;
  --color-ink: #1d1f24;
  --color-ink-muted: #4f5560;
  --color-pen: #24489a;
  --color-rule: #b9d4ea;
  --color-margin: #e3a0a0;
  --color-marker: #e4d9f4;
  --color-marker-yellow: #fbef9f;

  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* 文字を罫線に乗せるため、文字の大きさのクラスは行の高さを変えない */
  --text-xs--line-height: 28px;
  --text-sm--line-height: 28px;
  --text-base--line-height: 28px;
  --text-lg--line-height: 28px;
  --text-xl--line-height: 28px;
  --text-2xl--line-height: 28px;
}

:root {
  /* 罫線の間隔 = 本文の行の高さ（16px × 1.75） */
  --line: 28px;
  /* 罫線を行の下端から少し上げ、文字が線に乗って見えるようにする */
  --rule-shift: 4px;
}

/* staging で蛍光ペンの色を見比べる（?marker=yellow）。色を決めたら消す */
[data-marker="yellow"] {
  --color-marker: var(--color-marker-yellow);
}

/* Inter が届く前に使う Arial の寸法を Inter に合わせ、差し替えでレイアウトが動かないようにする（ADR-009） */
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial"), local("ArialMT");
  size-adjust: 107.12%;
  ascent-override: 90.44%;
  descent-override: 22.52%;
  line-gap-override: 0%;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-paper);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 calc(var(--line) - 1px),
    var(--color-rule) calc(var(--line) - 1px) var(--line)
  );
  background-position: 0 calc(-1 * var(--rule-shift));
  color: var(--color-ink);
  font-size: 16px;
  line-height: var(--line);
  font-family:
    "Inter", "Inter Fallback", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", "Noto Sans JP",
    "Yu Gothic", "Meiryo", system-ui, sans-serif;
}

::selection {
  background-color: var(--color-marker);
  color: var(--color-ink);
}

@layer components {
  /* ノートの1頁。左の赤い線が余白線、その左が日付欄 */
  .sheet {
    position: relative;
    max-width: 56rem;
    margin-inline: auto;
    padding-left: 2.5rem;
    padding-right: 1.5rem;
  }

  .sheet::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 1.5rem;
    width: 1px;
    background-color: var(--color-margin);
  }

  /* 日付欄に書くこと。スマホでは本文の上の1行にする */
  .margin-note {
    display: block;
    color: var(--color-ink-muted);
    font-size: 14px;
  }

  @media (min-width: 768px) {
    .sheet {
      padding-left: 10rem;
      padding-right: 2rem;
    }

    .sheet::before {
      left: 9rem;
    }

    .margin-note {
      position: absolute;
      top: 0;
      left: -10rem;
      width: 8.5rem;
      text-align: right;
    }
  }

  /* 蛍光ペン。文字の下半分に引く */
  .marker {
    background-image: linear-gradient(transparent 55%, var(--color-marker) 55%);
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
}
```

- [ ] **Step 4: 記事の CSS を書き換える**

`src/layouts/BlogPost.astro` の `<style is:global>` の中を次にする:

```css
  @reference "../styles/global.css";

  /* 記事の本文も罫線に乗せる。縦の寸法はすべて行の高さ（28px）の倍数にする */
  .blog-content {
    container-type: inline-size;
  }

  .blog-content h2 {
    @apply text-[22px] font-bold text-ink mt-14;
  }

  .blog-content h3 {
    @apply text-lg font-bold text-ink mt-7;
  }

  .blog-content :is(p, ul, ol, table, pre, blockquote, figure) {
    @apply mb-7;
  }

  .blog-content :is(ul, ol) {
    @apply pl-6;
  }

  .blog-content ul {
    @apply list-disc;
  }

  .blog-content ol {
    @apply list-decimal;
  }

  .blog-content a {
    @apply text-pen underline underline-offset-4;
  }

  /* 行内のコード。行の箱を高くしないよう line-height を 1 にする */
  .blog-content code {
    @apply font-mono text-[14px] text-ink;
    line-height: 1;
    padding: 0 0.3em;
    background-color: color-mix(in srgb, var(--color-rule) 35%, transparent);
  }

  /* コードはノートに貼った印刷物。横スクロールのバーで高さが変わらないよう折り返す */
  .blog-content pre {
    @apply rounded-md text-[14px];
    padding: 14px 16px;
    line-height: 28px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .blog-content pre code {
    padding: 0;
    background-color: transparent;
    color: inherit;
    line-height: inherit;
  }

  .blog-content blockquote {
    @apply pl-4 text-ink-muted;
    box-shadow: inset 2px 0 0 var(--color-margin);
  }

  .blog-content hr {
    @apply mb-7;
    height: 28px;
    border: 0;
  }

  /* 表は罫線を区切りにして、セルを折り返す */
  .blog-content table {
    @apply w-full;
    border-collapse: collapse;
  }

  .blog-content :is(th, td) {
    @apply pr-3 align-top text-left;
    overflow-wrap: anywhere;
  }

  .blog-content th {
    @apply font-bold;
  }

  /* 図は紙の上に描く。枠の高さを罫線の倍数に切り上げ、後ろの文字がずれないようにする */
  .blog-content .mermaid {
    @apply flex justify-center;
    height: round(up, calc(min(100cqw, var(--fw)) * var(--ratio)), 28px);
  }

  .blog-content .mermaid svg {
    @apply h-auto;
  }
```

（`pre` の `rounded-md` は `@apply` で CSS に入るだけで、HTML の `class` には出ないので、check-dist の検査には掛からない。仕様の「コードの `pre` を除く」に当たる）

- [ ] **Step 5: 検査とビルドが通ることを確かめる**

Run: `pnpm test`
Expected: コントラスト9件 + serve 8件、すべて pass

Run: `pnpm build`
Expected: 成功（部品の `class` に残る前のトークンは CSS が作られないだけで、ビルドは止まらない）

- [ ] **Step 6: Commit**


```bash
git -C /Users/wisteria/Projects/wisteria-io add src/styles/global.css src/layouts/BlogPost.astro scripts/contrast.test.cjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 大学ノートの色と罫線と頁のCSSを定める"
```

### Task 2: 罫線に乗っているかの検査と、ノートに無い部品の検査

**Files:**
- Create: `scripts/check-grid.mjs`
- Modify: `scripts/check-dist.mjs`
- Modify: `package.json`（`scripts`）

**Interfaces:**
- Consumes: `serve.cjs` の `createServer({ dist, noindex })`（`http.Server` を返す）
- Produces: `pnpm check:grid`（dist をその場で配り、4ページ × 390px・1280px で、本文の要素の上端と高さが 28px の倍数か、横にはみ出さないかを測る）。`pnpm verify` に組み込む

- [ ] **Step 1: 罫線の検査を書く**

`scripts/check-grid.mjs`:

```js
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
```

`package.json` の `scripts` に `"check:grid": "node scripts/check-grid.mjs"` を足し、`verify` を `pnpm typecheck && pnpm lint && pnpm build && pnpm check && pnpm check:grid && pnpm test && pnpm lighthouse` にする。

- [ ] **Step 2: ノートに無い部品の検査を書く**

`scripts/check-dist.mjs` の「紙の見た目（ADR-016）」から `if (failures.length)` の前までを、次に置き換える:

```js
// 大学ノートの見た目（ADR-016）。ノートに無い部品（角の丸い面・枠・影・前の配色・浮き上がる動き）を残さない
const notNotebook = [
  'rounded',
  'border',
  'shadow',
  'ring',
  'backdrop-',
  'bg-surface',
  'bg-wisteria',
  'text-wisteria',
  'font-serif',
  'reveal',
  'paper-lines',
  'text-white',
  'bg-white',
  'bg-bg-',
  'text-text-',
  'text-accent',
  'bg-primary',
  'text-primary',
];
for (const page of [
  'index.html',
  'blog/index.html',
  'blog/errors-are-values/index.html',
  'blog/neovim-intro-part1/index.html',
]) {
  const body = read(page);
  const classes = [...body.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
  // hover: などの前置きを外して比べる
  const left = notNotebook.filter((t) => classes.some((c) => c.replace(/^([a-z0-9-]+:)+/, '').startsWith(t)));
  check(left.length === 0, `${page} にノートに無い部品のクラスが残っている: ${left.join(', ')}`);
  check(/<main class="sheet\b/.test(body), `${page} の本文がノートの頁（.sheet）に載っていない`);
}
check(!/\.reveal\b|animation-timeline/.test(html), '浮き上がる動きが残っている');
```

- [ ] **Step 3: 失敗を確かめる**

Run: `pnpm check:grid`（dist は Task 1 の Step 5 のビルド。部品はまだ前の書き方）
Expected: NG（トップと一覧で `罫線からずれている` が出る）

Run: `pnpm check`
Expected: NG（`ノートに無い部品のクラスが残っている: rounded, border, ...`、`.sheet に載っていない`、`浮き上がる動きが残っている`）

- [ ] **Step 4: lint と Commit**

Run: `pnpm lint`（差分が出たら `pnpm format`）
Expected: エラーなし

```bash
git -C /Users/wisteria/Projects/wisteria-io add scripts/check-grid.mjs scripts/check-dist.mjs package.json
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 文字が罫線に乗っているかとノートに無い部品を検査する"
```

### Task 3: トップの部品をノートの書き方にする

**Files:**
- Modify: `src/pages/index.astro`、`src/components/Nav.astro`・`Hero.astro`・`Experience.astro`・`Projects.astro`・`Skills.astro`・`About.astro`・`Links.astro`
- Delete: `src/components/Icon.astro`（アイコンを使う部品が無くなるため。Step 8 で使われていないことを確かめてから消す）

**Interfaces:**
- Consumes: Task 1 の `.sheet`・`.margin-note`・`.marker`・トークン
- 中身（文言・順番・`id`・`href`・`data-project`）は変えない。`check-dist.mjs` の既存の検査（チップ3つと行き先、作品5件、セクションの順番など）が守る

- [ ] **Step 1: index.astro**

`<main>` を `<main class="sheet">` にする（ほかはそのまま）。

- [ ] **Step 2: Nav.astro**

`<nav ...>` から `</div>`（PC のリンクとボタンの行の終わり）までを次にする（`#mobile-menu` と `<script>` はそのまま）:

```astro
<nav class="fixed top-0 w-full z-50 bg-paper">
  <div class="max-w-4xl mx-auto px-6 h-14 flex justify-between items-center">
    <a href="#top" class="font-bold text-lg text-ink font-mono">wisteria-io</a>
    <div class="hidden md:flex gap-6">
      {links.map(l => (
        <a href={l.href} class="text-ink-muted hover:text-ink transition-colors text-sm">{l.label}</a>
      ))}
    </div>
    <button type="button" id="menu-toggle" class="md:hidden w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink" aria-label="Menu">
      <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
```

`#mobile-menu` の `class` は `hidden md:hidden px-6 pb-4 space-y-2` のまま（ナビは罫線の外の固定の帯なので、28px の倍数にそろえなくてよい）。

- [ ] **Step 3: Hero.astro**

全体を次にする:

```astro
---
import { Image } from 'astro:assets';
import avatar from '../assets/avatar.jpg';
import { highlights } from '../data/career';
import { profile, ratings } from '../data/profile';

const links = [
  { label: 'GitHub', href: 'https://github.com/wisteriahuman' },
  { label: 'X', href: 'https://x.com/wisteria_man' },
  { label: 'AtCoder', href: 'https://atcoder.jp/users/wisteriahuman' },
];
---

<section id="top" class="pt-28 pb-14 md:pt-42">
  <Image src={avatar} alt="" width={56} height={56} loading="eager" class="w-14 h-14 object-cover" />
  <h1 class="mt-7 text-[32px] md:text-[40px] leading-14 font-bold text-ink">{profile.name}</h1>
  <p class="text-ink">{profile.affiliation}</p>

  <ul>
    {highlights.map((h) => (
      <li class="h-14 flex items-end">
        <a href={`#career-${h.id}`} class="h-14 inline-flex items-end font-semibold text-ink hover:text-pen">
          <span class="marker">{h.label}</span>
        </a>
      </li>
    ))}
  </ul>
  <p class="text-ink-muted">{ratings.join('・')}</p>

  <p class="h-14 flex items-end gap-6">
    {links.map((l) => (
      <a href={l.href} target="_blank" rel="noopener" class="h-14 inline-flex items-end text-pen underline underline-offset-4">
        {l.label}
      </a>
    ))}
  </p>
</section>
```

- [ ] **Step 4: Experience.astro**

全体を次にする:

```astro
---
import { career } from '../data/career';
---

<section id="experience" class="py-14">
  <h2 class="text-[22px] font-bold text-ink"><span class="marker">Experience</span></h2>
  <ol class="mt-7 space-y-7">
    {career.map((item) => (
      <li id={`career-${item.id}`} class="relative scroll-mt-24">
        <p class="margin-note">{item.period}</p>
        <h3 class="font-bold text-ink">{item.title}</h3>
        <p class="text-ink-muted">{item.subtitle}</p>
        {item.desc && <p class="text-ink-muted">{item.desc}</p>}
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 5: Projects.astro**

全体を次にする:

```astro
---
import { projects } from '../data/projects';
---

<section id="projects" class="py-14">
  <h2 class="text-[22px] font-bold text-ink"><span class="marker">Projects</span></h2>
  <ul class="mt-7 space-y-7">
    {projects.map(p => (
      <li data-project class="relative">
        <p class="margin-note">{p.period}</p>
        <h3 class="font-bold text-ink">
          {p.title}{p.award && <> <span class="marker font-normal">{p.award}</span></>}
        </h3>
        <p class="text-ink-muted">{p.desc}</p>
        <p class="text-sm text-ink-muted">{p.tech.join('・')}</p>
        {(p.github || p.link) && (
          <p class="h-14 flex items-end gap-6">
            {p.github && (
              <a href={p.github} target="_blank" rel="noopener" class="h-14 inline-flex items-end text-pen underline underline-offset-4">GitHub</a>
            )}
            {p.link && (
              <a href={p.link} target="_blank" rel="noopener" class="h-14 inline-flex items-end text-pen underline underline-offset-4">関連サイト</a>
            )}
          </p>
        )}
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 6: Skills.astro**

`categories` から `icon` を消し（型も `{ title: string; skills: string[] }[]` にする）、`import` の2行を消す。`<section>` を次にする:

```astro
<section id="skills" class="py-14">
  <h2 class="text-[22px] font-bold text-ink"><span class="marker">Skills</span></h2>
  <dl class="mt-7 space-y-7 md:space-y-0">
    {categories.map(cat => (
      <div class="relative">
        <dt class="margin-note font-bold text-ink">{cat.title}</dt>
        <dd class="text-ink">{cat.skills.join('・')}</dd>
      </div>
    ))}
  </dl>
</section>
```

- [ ] **Step 7: About.astro と Links.astro**

About.astro の `<section>` を次にする（`machines` はそのまま）:

```astro
<section id="about" class="py-14">
  <h2 class="text-[22px] font-bold text-ink"><span class="marker">About</span></h2>
  <div class="mt-7 space-y-7 text-ink">
    <p>
      公立はこだて未来大学 システム情報科学部 情報アーキテクチャ学科 情報システムコース。
      バックエンド開発と競技プログラミングが好きです。
    </p>
    <p>
      API設計やDB設計を考えるのが楽しくて、ハッカソンでもバックエンドを担当することが多いです。
      最近はAI/LLMを組み込んだプロダクト設計にも興味があります。
    </p>
    <p>
      エディタは Neovim。開発環境は Nix で管理しています。
      マシンごとの OS の遍歴はこんな感じです。
    </p>
    <ul class="space-y-7">
      {machines.map((m) => (
        <li>
          <p><span class="font-bold">{m.name}</span><span class="ml-2 text-sm text-ink-muted">{m.note}</span></p>
          <p class="text-ink-muted">{m.history}</p>
        </li>
      ))}
    </ul>
  </div>
</section>
```

Links.astro の全体を次にする:

```astro
---
const links = [
  { label: 'GitHub', href: 'https://github.com/wisteriahuman' },
  { label: 'X (Twitter)', href: 'https://x.com/wisteria_man' },
  { label: 'AtCoder', href: 'https://atcoder.jp/users/wisteriahuman' },
];
---

<section id="links" class="py-14">
  <h2 class="text-[22px] font-bold text-ink"><span class="marker">Links</span></h2>
  <p class="h-14 flex items-end gap-6">
    {links.map(l => (
      <a href={l.href} target="_blank" rel="noopener" class="h-14 inline-flex items-end text-pen underline underline-offset-4">{l.label}</a>
    ))}
  </p>
</section>

<footer class="py-14">
  <p class="text-sm text-ink-muted">
    © 2026 wisteria. Built with <a href="https://astro.build" class="text-pen underline underline-offset-4">Astro</a> + <a href="https://tailwindcss.com" class="text-pen underline underline-offset-4">Tailwind CSS</a>. Self-hosted on Mac mini via <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/" class="text-pen underline underline-offset-4">Cloudflare Tunnel</a>.
  </p>
</footer>
```

- [ ] **Step 8: Icon.astro を消す**

Run: `grep -rn "Icon" src`
Expected: `src/components/Icon.astro` の中だけ。ほかに出なければ `git -C /Users/wisteria/Projects/wisteria-io rm src/components/Icon.astro`

- [ ] **Step 9: ビルドと検査**

Run: `pnpm build` の後に `pnpm check`
Expected: トップ（`index.html`）についての NG が無い。記事と一覧の NG は Task 4 で消す

Run: `pnpm check:grid`
Expected: `/` の 390px・1280px で NG が無い

- [ ] **Step 10: lint と Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: トップを罫線の上に書くノートの書き方にする"
```

### Task 4: 記事と一覧をノートにし、図とコードと表を罫線にそろえる

**Files:**
- Modify: `src/components/BlogCard.astro`、`src/pages/blog/index.astro`、`src/layouts/BlogPost.astro`
- Modify: `src/lib/rehype-wrap-mermaid.ts`
- Modify: `astro.config.mjs`（`mermaidConfig.themeVariables`）

**Interfaces:**
- Consumes: Task 1 のトークンとクラス、Task 2 の `check:grid`
- Produces: `<figure class="mermaid" style="--fw: <幅>px; --ratio: <高さ/幅>">`（check-dist の図の数の検査は `<figure class="mermaid"` で始まる形を数えているので、`style` は `class` の後ろに置く）

- [ ] **Step 1: blog/index.astro と BlogCard.astro**

`blog/index.astro` の `<main>` から `</main>` までを次にする:

```astro
  <main class="sheet min-h-screen pt-28 pb-28">
    <p class="h-14 flex items-end">
      <a href="/" class="h-14 inline-flex items-end text-pen underline underline-offset-4">ポートフォリオに戻る</a>
    </p>
    <h1 class="mt-7 text-[32px] leading-14 font-bold text-ink"><span class="marker">Blog</span></h1>
    <p class="text-ink-muted">技術的なメモや振り返りを書いています</p>

    {posts.length === 0 ? (
      <p class="mt-14 text-ink-muted">まだ記事がありません</p>
    ) : (
      <ul class="mt-14 space-y-7">
        {posts.map(post => (
          <BlogCard
            title={post.data.title}
            description={post.data.description}
            pubDate={post.data.pubDate}
            tags={post.data.tags}
            slug={post.slug}
          />
        ))}
      </ul>
    )}
  </main>
```

`BlogCard.astro` の `---` の後ろのマークアップを次にする（題のリンクを項目全体に広げ、タップの高さを取る）:

```astro
<li class="relative">
  <p class="margin-note"><time datetime={pubDate.toISOString()}>{formattedDate}</time></p>
  <h2 class="text-lg font-bold text-ink">
    <a href={`/blog/${slug}`} class="hover:text-pen after:absolute after:inset-0">{title}</a>
  </h2>
  <p class="text-ink-muted">{description}</p>
  {tags.length > 0 && <p class="text-sm text-ink-muted">{tags.join('・')}</p>}
</li>
```

- [ ] **Step 2: BlogPost.astro**

`<main>` から `</main>` までを次にする:

```astro
  <main class="sheet min-h-screen pt-28 pb-28">
    <article>
      <p class="h-14 flex items-end">
        <a href="/blog" class="h-14 inline-flex items-end text-pen underline underline-offset-4">記事一覧に戻る</a>
      </p>
      <header class="mt-7 mb-14">
        <h1 class="text-[28px] md:text-[32px] leading-14 font-bold text-ink">{title}</h1>
        <p class="text-sm text-ink-muted">
          <time datetime={pubDate.toISOString()}>{formattedDate}</time>{tags.length > 0 && <>・{tags.join('・')}</>}
        </p>
      </header>

      <div class="blog-content">
        <slot />
      </div>
    </article>
  </main>
```

`<style is:global>` は Task 1 で書き換え済み。

- [ ] **Step 3: 図の枠に幅と縦横比を渡す**

`src/lib/rehype-wrap-mermaid.ts` の、`figure` を返す行を次にする:

```ts
        if (child.tagName === 'svg' && String(child.properties.id ?? '').startsWith('mermaid-')) {
          // 枠の高さを罫線の倍数に切り上げるため、SVG の幅と縦横比を CSS に渡す（ADR-016）
          const [, , w, h] = String(child.properties.viewBox ?? '').split(/\s+/).map(Number);
          const style = w > 0 && h > 0 ? `--fw: ${w}px; --ratio: ${h / w}` : undefined;
          return {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['mermaid'], style },
            children: [child],
          };
        }
```

ファイルの先頭のコメントを `// rehype-mermaid が出した SVG を <figure class="mermaid"> で包み、記事の中で罫線にそろえられるようにする` にする。

- [ ] **Step 4: mermaid の配色**

`astro.config.mjs` の `themeVariables` を次にする（上のコメントはそのまま）:

```js
            themeVariables: {
              background: '#fdfdfa',
              primaryColor: '#fdfdfa',
              primaryTextColor: '#1d1f24',
              primaryBorderColor: '#24489a',
              secondaryColor: '#fdfdfa',
              secondaryTextColor: '#1d1f24',
              secondaryBorderColor: '#24489a',
              tertiaryColor: '#fdfdfa',
              lineColor: '#4f5560',
              textColor: '#1d1f24',
              fontFamily: 'Inter, Hiragino Sans, Noto Sans CJK JP, system-ui, sans-serif',
              fontSize: '14px',
              nodeBorder: '#24489a',
              nodeTextColor: '#1d1f24',
              edgeLabelBackground: '#fdfdfa',
              clusterBkg: '#fdfdfa',
              clusterBorder: '#b9d4ea',
            },
```

- [ ] **Step 5: 検査が通ることを確かめる**

Run: `pnpm build` の後に `pnpm check`
Expected: `OK`（図の数 3/2/2 の検査も通る）

Run: `pnpm check:grid`
Expected: `OK`。ずれが出たら、出た要素の上の寸法（余白・行の高さ）を 28px の倍数に直す。`--rule-shift` は変えない

- [ ] **Step 6: lint と Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src astro.config.mjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 記事と一覧をノートにし、図とコードと表を罫線にそろえる"
```

### Task 5: OGP 画像の配色と、蛍光ペンの見本の切り替え

**Files:**
- Modify: `src/lib/og.ts`（`colors`）
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: `ogText.colors` のキー `{ bg, primary, soft, ink, text, muted }`（前の Task で決めたまま。値だけ変える）
- Produces: `?marker=yellow` で `<html data-marker="yellow">` にする小さなスクリプト（Task 6 で消す）

- [ ] **Step 1: OGP の配色**

`src/lib/og.ts` の `colors` を次にする:

```ts
// 色は src/styles/global.css のトークンと同じ値にする（ADR-016）
const colors = {
  bg: '#fdfdfa',
  primary: '#24489a',
  soft: '#e4d9f4',
  ink: '#1d1f24',
  text: '#1d1f24',
  muted: '#4f5560',
};
```

- [ ] **Step 2: 見本の切り替え**

`Layout.astro` の `<title>{title}</title>` の次の行に足す:

```astro
    <!-- staging で蛍光ペンの色を見比べる（?marker=yellow）。本人が色を決めたら消す -->
    <script is:inline>if (new URLSearchParams(location.search).get('marker') === 'yellow') document.documentElement.dataset.marker = 'yellow';</script>
```

`<body class="antialiased text-ink">` はそのまま。

- [ ] **Step 3: verify**

Run: `pnpm verify`
Expected: 終了コード 0。Lighthouse の4ページが Accessibility・Best Practices・SEO 100、Performance 95 以上

- [ ] **Step 4: OGP 画像を目で確かめる**

`dist/og.png` と `dist/og/errors-are-values.png` を Read で開き、白い紙に黒い文字・青の線・藤色の面のチップで、文字が欠けていないことを確かめる

- [ ] **Step 5: Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: OGP画像の配色をノートにそろえ、蛍光ペンの見本を切り替えられるようにする"
```

### Task 6: 撮って確かめ、staging で見てもらい、蛍光ペンの色を決める

**Files:** 確かめるだけ。色が決まったら `src/styles/global.css`・`src/layouts/Layout.astro`・`scripts/contrast.test.cjs`・`scripts/check-dist.mjs`

- [ ] **Step 1: 撮る**

`pnpm preview --port 4333` を裏で立て、スクラッチパッドのスクリプトで、4ページを 390px と 1280px で、各セクションへ流してから画面の大きさで撮る。トップは `?marker=yellow` でも撮る

- [ ] **Step 2: 目で確かめる**

- 文字が罫線の上に乗っている（線が文字の真ん中を横切らない）
- 箱・札・丸い写真・アイコンが無い
- 余白線が頁の左に1本通り、PC では日付・期間・分類が余白線の左に並ぶ
- 記事のコードは暗い印刷物、図は紙の上に描かれ、表が画面に収まる
- 藤色と黄色の蛍光ペンの両方で、文字が読める

- [ ] **Step 3: push して staging で見てもらう**

```bash
git -C /Users/wisteria/Projects/wisteria-io push
```

`gh pr checks 12 --watch` で verify と staging が pass。PR の本文を、ノートに作り直したことに合わせて `gh pr edit 12 --body-file <パス>` で直す。本人に `https://staging.wisteria-io.com/` と `https://staging.wisteria-io.com/?marker=yellow` を見てもらい、蛍光ペンの色と直したいところを聞く

- [ ] **Step 4: 色を決めたら切り替えを消す**

- 先に `scripts/check-dist.mjs` の「大学ノートの見た目」の検査の後ろに `check(!html.includes('data-marker') && !html.includes('marker=yellow'), '蛍光ペンの見本の切り替えが残っている');` を足し、`pnpm build && pnpm check` で NG を確かめる
- `Layout.astro` のスクリプトと上のコメントを消す。`global.css` の `[data-marker="yellow"]` の規則とコメントを消す
- 黄色に決まったら `--color-marker` を `#fbef9f` にする。どちらでも `--color-marker-yellow` を消し、`contrast.test.cjs` から `marker-yellow` の3行を消す。黄色に決まったら `og.ts` の `soft` も `#fbef9f` にする
- `ADR-016` と設計の「色」を、決めた色に直す（「見本と見比べてから確定する」を消す）
- `pnpm verify` が通ることを確かめて commit・push する

```bash
git -C /Users/wisteria/Projects/wisteria-io add src scripts docs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 蛍光ペンの色を決め、見本の切り替えを消す"
git -C /Users/wisteria/Projects/wisteria-io push
```

- [ ] **Step 5: 本人の了承を得て merge する**

staging で問題が無いと本人に言われてから `gh pr merge 12 --squash --delete-branch`。main の run で verify・deploy が success になり、本番 `https://wisteria-io.com/` が新しい見た目で 200 を返すことを確かめる

### Task 7（2026-10-16 追加）: staging を見た本人の指摘を受けて、見開き・欄・密度・黄色にする

本人の指摘: 黄色が合う。「質素」。「note 書くときこんな赤い線入れるか？」。「スマホビューしか今考えていない？ PC もちゃんとどっちの UI もこだわってほしい」。ほかは推奨で、と任された。決めたことは ADR-016・設計・仕様の C に書いた。

**Files:** `src/styles/global.css`、`src/components/PageHead.astro`（新規）・`Toc.astro`（新規）・`Hero.astro`・`Nav.astro`・`Experience.astro`・`Projects.astro`・`Skills.astro`・`About.astro`・`Links.astro`、`src/lib/last-updated.ts`（新規）、`src/pages/index.astro`・`blog/index.astro`・`blog/[...slug].astro`、`src/layouts/BlogPost.astro`・`Layout.astro`、`src/lib/og.ts`、`scripts/check-dist.mjs`・`check-grid.mjs`・`contrast.test.cjs`

- [x] **Step 1: 検査を先に直し、失敗を確かめる**
  - check-dist: 本文が `<main class="page`、見開きの左のページ `<aside class="page page-left"` がある。`--color-margin`・`data-marker`・`marker=yellow` が無い。トップに `Date YYYY.MM.DD`、記事に `No. N`
  - check-grid: 要素の位置をそのページ（`.page`）の上端から測る。1ページの幅（〜1023px）ではページの高さも罫線の倍数。1024px 以上では、1500px 流しても左のページが動かない
  - contrast: 黄色の見本の3組を消す（蛍光ペンそのものが黄色になる）
  - Expected: check-dist 11件・check-grid の見開きの NG
- [x] **Step 2: CSS**: 赤い余白線と見本の切り替えを消し、蛍光ペンを `#fbef9f`、机 `#e7e5df` を足す。罫線を `body` から `.page` に移す。`.spread`（1024px〜 で2列の見開き）、`.page-left`（1024px〜 で sticky、綴じ目へ向かう薄い陰）、`.page-right`。日付欄（`.margin-note`）はタブレットの幅だけ本文の左に出す
- [x] **Step 3: 部品**: トップを `<aside class="page page-left">`（Date の欄・Hero・目次）と `<main class="page page-right">`（5つのセクション）に分ける。上のナビは 1024px〜 で隠す。実績とリンクの行は空行を挟まず 28px の行に続けて書く（押せる高さ 24px 以上）。見出しに「1.」〜「5.」。一覧と記事も見開きにし、記事は左に No.（公開日の古い順）・Date・題・タグ
- [x] **Step 4: 確かめる**: `pnpm verify` が通る。1440px・820px・390px で撮る
