# 段階②-a C（見た目の土台）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** サイト全体の見た目を、暗い配色から「紙の質感」（生成りの地・墨の文字・罫線・明朝の見出し・少し丸い角）に変える。中身と順番は変えない。

**Architecture:** 色と書体を `src/styles/global.css` の `@theme` のトークンに置き直し、各部品のクラスを古いトークンから新しいトークンへ機械的に置き換える。コントラストはトークンの値から計算する単体の検査で守り、古いトークンが残っていないことを `pnpm check` で検出する。記事の図（mermaid）と OGP 画像の配色も同じトークンの値にそろえる。

**Tech Stack:** Astro 5、Tailwind CSS 4（`@theme`）、`node:test`、satori（OGP）、rehype-mermaid

**Spec:** [docs/superpowers/specs/2026-10-15-redesign-design.md](../specs/2026-10-15-redesign-design.md)（C の節）。見た目の判断は [ADR-016](../../adr/adr-016-paper-look.md)

D〜G の計画は別のファイルで書く。

## Global Constraints

- 変更は PR → verify → squash merge。main に直接 push しない。git・gh の書き込みは単発のコマンド、PR の本文は `--body-file`
- **この PR は staging で本人に見てもらい、問題が無いと言われてから merge する**
- 日本語は端末のフォントを使い、Web フォントを足さない（ADR-009）
- 文字と地のコントラストは 4.5:1 以上
- 明るい紙だけにし、ダークは作らない
- 角は 6〜8px（Tailwind の `rounded-md` = 6px、`rounded-lg` = 8px）。チップは線ではなく薄い面
- 中身（文言・順番・リンク先）は変えない
- Lighthouse（モバイル）の Accessibility・Best Practices・SEO は 100、Performance は 95 以上（`pnpm verify`）

## Review Focus

- 置き換え漏れ: どこかに `text-white` や `bg-bg-card` が残ると、紙の上に白い文字や暗い箱が出る → Task 2 の `pnpm check` で dist の HTML から古いトークンを検出する
- 動きを減らす設定の人・`animation-timeline` に対応しないブラウザ: セクションが透明のまま見えなくならない → Task 1 の CSS で、アニメーションを `@supports` と `prefers-reduced-motion: no-preference` の両方の中にだけ置く。Task 4 で `reducedMotion: 'reduce'` で撮って確かめる
- 最初の画面の LCP: 最初の画面に浮き上がる動きを付けると LCP が遅れる → Task 2 で Hero には `.reveal` を付けない
- 記事のコード（shiki の暗い背景）と、紙の地の境目: 行内のコードと `pre` の中のコードの色が混ざらない → Task 2 で `.blog-content pre code` の色を shiki のままにする
- OGP 画像の文字が紙の地で読める → Task 3 で画像を目で確かめる

---

ブランチ: `feat/paper-look`（main から）

### Task 1: 紙のトークンと、コントラストの検査

**Files:**
- Modify: `src/styles/global.css`
- Create: `scripts/contrast.test.cjs`

**Interfaces:**
- Produces: Tailwind のトークン `paper`・`surface`・`surface-strong`・`ink`・`ink-muted`・`rule`・`wisteria`・`wisteria-soft`（`bg-paper`・`text-ink` などのクラスになる）、`--font-serif`（`font-serif`）、CSS のクラス `.paper-lines`（罫線の地）・`.reveal`（画面に入るときの動き）

- [ ] **Step 1: 失敗する検査を書く**

`scripts/contrast.test.cjs`:

```js
// global.css の @theme の色から、文字と地のコントラストが WCAG の 4.5:1 以上かを確かめる（ADR-016）
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../src/styles/global.css'), 'utf8');
const theme = css.match(/@theme\s*{([\s\S]*?)}/)?.[1] ?? '';
const color = (name) => {
  const m = theme.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `--color-${name} が @theme に無い`);
  return m[1];
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// 文字の色 × 地の色。部品で実際に重ねる組み合わせだけを並べる
const pairs = [
  ['ink', 'paper'],
  ['ink-muted', 'paper'],
  ['wisteria', 'paper'],
  ['ink', 'surface'],
  ['ink-muted', 'surface'],
  ['wisteria', 'surface'],
  ['ink', 'surface-strong'],
  ['ink-muted', 'surface-strong'],
  ['wisteria', 'surface-strong'],
  ['ink', 'wisteria-soft'],
  ['ink-muted', 'wisteria-soft'],
];

for (const [fg, bg] of pairs) {
  test(`${fg} の文字は ${bg} の地で 4.5:1 以上`, () => {
    const r = ratio(color(fg), color(bg));
    assert.ok(r >= 4.5, `${fg} / ${bg} = ${r.toFixed(2)}`);
  });
}
```

- [ ] **Step 2: 失敗を確かめる**

Run: `pnpm test`
Expected: FAIL（`--color-ink が @theme に無い` など。今の global.css は暗い配色のトークンしか持たない）。serve の検査8件は pass のまま

- [ ] **Step 3: global.css を書き換える**

`src/styles/global.css` の全体を次にする:

```css
@import "tailwindcss";

/* 紙の質感（ADR-016）。値を変えたら pnpm test のコントラストの検査が確かめる */
@theme {
  --color-paper: #fbf8f1;
  --color-surface: #f3eee3;
  --color-surface-strong: #ece5d6;
  --color-ink: #1f1d1a;
  --color-ink-muted: #5c5650;
  --color-rule: #ddd5c5;
  --color-wisteria: #5a4a8c;
  --color-wisteria-soft: #ece6f2;

  /* 見出しは明朝。日本語は端末のフォントを使う（ADR-009） */
  --font-serif: "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif CJK JP", "Noto Serif JP", serif;
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
  /* ほかのセクションでは罫線を薄くする */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 31px,
    color-mix(in srgb, var(--color-rule) 40%, transparent) 31px 32px
  );
  color: var(--color-ink);
  font-family:
    "Inter", "Inter Fallback", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", "Noto Sans JP",
    "Yu Gothic", "Meiryo", system-ui, sans-serif;
}

/* 最初の画面の罫線は、はっきり見せる */
.paper-lines {
  background-image: repeating-linear-gradient(to bottom, transparent 0 31px, var(--color-rule) 31px 32px);
}

::selection {
  background-color: var(--color-wisteria);
  color: var(--color-paper);
}

/* セクションが画面に入るとき少しだけ浮き上がる。対応しないブラウザと、動きを減らす設定では最初から出す */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 35%;
    }
  }
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 4: 検査が通ることを確かめる**

Run: `pnpm test`
Expected: コントラスト11件 + serve 8件、すべて pass

- [ ] **Step 5: lint と Commit**

Run: `pnpm lint`
Expected: エラーなし（差分が出たら `pnpm format`）

```bash
git -C /Users/wisteria/Projects/wisteria-io add src/styles/global.css scripts/contrast.test.cjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 紙の色のトークンを定め、コントラストを検査する"
```

### Task 2: 部品を紙のトークンに置き換える

**Files:**
- Modify: `scripts/check-dist.mjs`
- Modify: `src/components/Nav.astro`・`Hero.astro`・`Experience.astro`・`Projects.astro`・`Skills.astro`・`About.astro`・`Links.astro`・`BlogCard.astro`
- Modify: `src/pages/blog/index.astro`、`src/layouts/BlogPost.astro`、`src/layouts/Layout.astro`

**Interfaces:**
- Consumes: Task 1 のトークンと `.paper-lines`・`.reveal`・`font-serif`

- [ ] **Step 1: 古いトークンを検出する検査を足す**

`scripts/check-dist.mjs` の、図の検査の `for` の後（`if (failures.length)` の前）に足す:

```js
// 紙の見た目（ADR-016）。暗い配色のトークンが残ると、紙の上に白い文字や暗い箱が出る
const oldTokens = [
  'text-white',
  'bg-white',
  'bg-bg-',
  'ring-bg-',
  'text-text-',
  'border-border',
  'bg-border',
  'text-accent',
  'ring-accent',
  'bg-primary',
  'text-primary',
  'border-primary',
];
for (const page of ['index.html', 'blog/index.html', 'blog/errors-are-values/index.html', 'blog/neovim-intro-part1/index.html']) {
  const classes = [...read(page).matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
  // hover: などの前置きを外して比べる
  const left = oldTokens.filter((t) => classes.some((c) => c.replace(/^([a-z-]+:)+/, '').startsWith(t)));
  check(left.length === 0, `${page} に暗い配色のクラスが残っている: ${left.join(', ')}`);
}
check(/<section id="top" class="[^"]*\bpaper-lines\b/.test(html), '最初の画面に罫線の地が無い');
```

- [ ] **Step 2: 失敗を確かめる**

Run: `pnpm build` の後に `pnpm check`
Expected: NG（4ページすべてで `text-white`・`bg-bg-`・`text-text-` などが残っている、最初の画面に罫線の地が無い）

- [ ] **Step 3: クラスを機械的に置き換える**

スクラッチパッドに次のスクリプトを置いて実行する（`python3 <パス>`）。置き換えは上から順に、長い指定を先に当てる:

```python
import pathlib, re
root = pathlib.Path('/Users/wisteria/Projects/wisteria-io')
files = [
    'src/components/Nav.astro', 'src/components/Hero.astro', 'src/components/Experience.astro',
    'src/components/Projects.astro', 'src/components/Skills.astro', 'src/components/About.astro',
    'src/components/Links.astro', 'src/components/BlogCard.astro',
    'src/pages/blog/index.astro', 'src/layouts/BlogPost.astro',
]
pairs = [
    # 最初の画面のチップ: 線ではなく薄い面
    ('bg-primary/25 hover:bg-primary/40 border border-primary/40 text-white', 'bg-wisteria-soft hover:bg-surface-strong text-ink'),
    ('rounded-full bg-wisteria-soft', 'rounded-md bg-wisteria-soft'),
    ('text-primary-light shrink-0', 'text-wisteria shrink-0'),
    # 作品の受賞の札
    ('bg-primary/30 text-white text-xs rounded-full', 'bg-wisteria-soft text-ink text-xs rounded-md'),
    # 背景
    ('bg-bg-dark/80', 'bg-paper/90'),
    (' bg-bg-card/30', ''),
    ('hover:bg-bg-card-hover', 'hover:bg-surface-strong'),
    ('bg-bg-card', 'bg-surface'),
    ('ring-bg-dark', 'ring-paper'),
    ('hover:bg-white/20', 'hover:bg-surface-strong'),
    ('bg-white/10', 'bg-surface'),
    ('bg-white/5', 'bg-surface'),
    ('bg-border', 'bg-rule'),
    ('bg-primary', 'bg-wisteria'),
    # 文字
    ('hover:text-white', 'hover:text-ink'),
    ('text-white', 'text-ink'),
    ('text-text-main', 'text-ink'),
    ('text-text-muted', 'text-ink-muted'),
    ('hover:text-accent', 'hover:text-wisteria'),
    ('text-accent', 'text-wisteria'),
    ('text-primary-light', 'text-wisteria'),
    ('ring-accent/30', 'ring-wisteria/30'),
    # 線と角
    ('border-primary', 'border-wisteria'),
    ('border-border', 'border-rule'),
    ('rounded-xl', 'rounded-lg'),
]
for f in files:
    p = root / f
    s = p.read_text()
    for a, b in pairs:
        s = s.replace(a, b)
    p.write_text(s)
print('ok')
```

- [ ] **Step 4: 見出しを明朝にし、動きと罫線を付ける**

- `h1`・`h2`・`h3` の `class` に `font-serif` を足す（Nav のロゴは等幅のまま）:
  - `Hero.astro` の `h1`、`Experience.astro`・`Projects.astro`・`Skills.astro`・`About.astro`・`Links.astro` の `h2` と `h3`、`BlogCard.astro` の `h2`、`blog/index.astro` の `h1`、`BlogPost.astro` の `h1`
  - `BlogPost.astro` の `<style is:global>` の `.blog-content h2` と `.blog-content h3` の `@apply` に `font-serif` を足す
- `Hero.astro` の `<section id="top" class="px-6 ...">` の `class` の先頭に `paper-lines ` を足す。Hero には `.reveal` を付けない（LCP を遅らせないため）
- `Experience.astro`・`Projects.astro`・`Skills.astro`・`About.astro`・`Links.astro` の `<section>` の `class` に `reveal` を足す
- `BlogPost.astro` の `<style is:global>` の中を置き換える:
  - `.blog-content code` の `@apply` の `bg-bg-card` → `bg-surface`（Step 3 で置換済みなら確かめるだけ）
  - `.blog-content pre code` に `color: inherit;` を足す（行内のコードの色を shiki の中に持ち込まない）
  - `.blog-content .mermaid` の `@apply` は `bg-surface ... border-rule` になっていることを確かめる
- `Layout.astro` の `<body class="antialiased">` を `<body class="antialiased text-ink">` にする

- [ ] **Step 5: 残りを手で確かめる**

Run: `grep -rnE "text-white|bg-white|bg-bg-|ring-bg-|text-text-|border-border|bg-border|accent|primary" src/components src/pages src/layouts`
Expected: 出力なし。出たら、意味に合わせて Task 1 のトークンに置き換える（例: `bg-white` → `bg-paper`）

- [ ] **Step 6: 検査が通ることを確かめる**

Run: `pnpm build` の後に `pnpm check`
Expected: `OK`

- [ ] **Step 7: lint と Commit**

Run: `pnpm lint`
Expected: エラーなし

```bash
git -C /Users/wisteria/Projects/wisteria-io add scripts/check-dist.mjs src
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 部品の配色を紙のトークンに置き換え、見出しを明朝にする"
```

### Task 3: 記事の図と OGP 画像の配色をそろえる

**Files:**
- Modify: `astro.config.mjs`（`mermaidConfig.themeVariables`）
- Modify: `src/lib/og.ts`（`colors`）、`src/pages/og.png.ts`、`src/pages/og/[...slug].png.ts`

**Interfaces:**
- Consumes: Task 1 のトークンの値（色コードを同じ値にする）
- Produces: `ogText.colors` のキーを `{ bg, primary, soft, ink, text, muted }` にする（`white` は無くす）

- [ ] **Step 1: mermaid の配色を変える**

`astro.config.mjs` の `themeVariables` を次にする:

```js
            themeVariables: {
              background: '#f3eee3',
              primaryColor: '#fbf8f1',
              primaryTextColor: '#1f1d1a',
              primaryBorderColor: '#5a4a8c',
              secondaryColor: '#f3eee3',
              secondaryTextColor: '#1f1d1a',
              secondaryBorderColor: '#5a4a8c',
              tertiaryColor: '#f3eee3',
              lineColor: '#5c5650',
              textColor: '#1f1d1a',
              fontFamily: 'Inter, Hiragino Sans, Noto Sans CJK JP, system-ui, sans-serif',
              fontSize: '14px',
              nodeBorder: '#5a4a8c',
              nodeTextColor: '#1f1d1a',
              edgeLabelBackground: '#f3eee3',
              clusterBkg: '#f3eee3',
              clusterBorder: '#ddd5c5',
            },
```

その上のコメントに `// 色は src/styles/global.css のトークンと同じ値にする（ADR-016）` を足す。

- [ ] **Step 2: OGP の配色を変える**

`src/lib/og.ts` の `colors` を次にし、コメントを添える:

```ts
// 色は src/styles/global.css のトークンと同じ値にする（ADR-016）
const colors = {
  bg: '#fbf8f1',
  primary: '#5a4a8c',
  soft: '#ece6f2',
  ink: '#1f1d1a',
  text: '#1f1d1a',
  muted: '#5c5650',
};
```

- `src/pages/og.png.ts`: `colors.white` → `colors.ink`。チップの `color: colors.white` → `colors.ink`、`border: \`2px solid ${colors.primary}\`` を消し、`backgroundColor: 'rgba(99,102,241,0.25)'` → `colors.soft`、`borderRadius: '9999px'` → `'8px'`
- `src/pages/og/[...slug].png.ts`: `colors.white` → `colors.ink`

- [ ] **Step 3: 型検査とビルド**

Run: `pnpm typecheck` の後に `pnpm build`
Expected: エラーなし（`colors.white` が残っていれば型検査で止まる）

- [ ] **Step 4: 画像を目で確かめる**

`dist/og.png` と `dist/og/errors-are-values.png` を Read で開き、紙の地に墨の文字・藤色の上の線・薄い面のチップになっていること、文字が欠けていないことを確かめる。`/blog/neovim-intro-part1/` の図は Task 4 で撮る

- [ ] **Step 5: Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add astro.config.mjs src/lib/og.ts src/pages/og.png.ts "src/pages/og/[...slug].png.ts"
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 記事の図とOGP画像の配色を紙にそろえる"
```

### Task 4: 幅を変えて撮り、staging で見てもらう

**Files:** なし（確かめるだけ）

- [ ] **Step 1: verify**

Run: `pnpm verify`
Expected: 終了コード 0。Lighthouse の4ページが Accessibility・Best Practices・SEO 100、Performance 95 以上

- [ ] **Step 2: 撮る**

スクラッチパッドに次のスクリプトを置き、`pnpm preview --port 4333` を裏で立ててから `node <パス> <出力先>` で実行する:

```js
import { chromium } from '/Users/wisteria/Projects/wisteria-io/node_modules/playwright/index.mjs';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome' });
const pages = ['/', '/blog/', '/blog/errors-are-values/', '/blog/neovim-intro-part1/'];
for (const [name, w, motion] of [['m', 390, 'no-preference'], ['d', 1280, 'no-preference'], ['m-reduce', 390, 'reduce']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: motion });
  for (const path of pages) {
    await p.goto(`http://localhost:4333${path}`);
    // 浮き上がる動きを最後まで進めるため、下まで流してから撮る
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    const slug = path.replaceAll('/', '_') || '_';
    await p.screenshot({ path: `${out}/${name}${slug}.png`, fullPage: true });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(name, path, 'scrollWidth', sw);
  }
}
await b.close();
```

Expected: すべての行で `scrollWidth` が画面幅（390 か 1280）と同じ

- [ ] **Step 3: 目で確かめる**

撮った画像を Read で開き、次を確かめる:
- 白い文字・暗い箱が残っていない
- 見出しが明朝、本文がゴシック
- 最初の画面の罫線がはっきり、ほかは薄い
- `m-reduce` でも全セクションが見えている（透明のまま残っていない）
- 記事のコード（暗い背景）と図（紙の色）が読める

- [ ] **Step 4: PR を出し、staging で見てもらう**

```bash
git -C /Users/wisteria/Projects/wisteria-io push -u origin feat/paper-look
```

PR: `gh pr create --base main --head feat/paper-look --title "feat: 見た目を紙の質感にする" --body-file <パス>`。本文の先頭に「staging で見てもらってから merge する」と書く。

- `gh pr checks <N> --watch` で verify と staging が pass
- 本人に `https://staging.wisteria-io.com` を見てもらい、直したいところを聞く。直したら同じブランチに push して staging を更新する

- [ ] **Step 5: 本人の了承を得て merge する**

staging で問題が無いと本人に言われてから `gh pr merge <N> --squash --delete-branch`。main の run で verify・deploy が success になり、本番 `https://wisteria-io.com/` が新しい見た目で 200 を返すことを確かめる
