# トップページ段階① 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スマホの最初の画面に名前・一行・28卒・実績3つを収め、トップに OGP を付け、Lighthouse モバイル4項目100で本番に出す。

**Architecture:** 名前・経歴・作品を `src/data/` の3ファイルに置き、Hero・経歴・作品・OGP・メタはそこから作る。OGP の描画は `src/lib/og.ts` にまとめ、トップとブログで同じ見た目にする。テストの仕組みは足さず、ビルド結果を検査する `scripts/check-dist.mjs` を先に書いてから実装する。

**Tech Stack:** Astro 5、Tailwind CSS 4、satori + sharp（既存）。依存は足さない。

**Spec:** [docs/superpowers/specs/2026-10-14-top-page-phase1-design.md](../specs/2026-10-14-top-page-phase1-design.md)

## Global Constraints

- 一行は `課題を見つけ、技術を選び、作りきる。` のまま変えない
- 所属は `28卒・公立はこだて未来大学`。学年を書かない
- title: `藤井 優気 (wisteria) | ポートフォリオ`、description: 一行
- 依存を足さない。bun.lock・package-lock.json・CI を変えない
- ブログ記事の URL（`/blog/<slug>`）と OGP 画像のパス（`/og/<slug>.png`）を変えない
- 絵文字をアイコンに使わない
- ビルドは CI と同じ `npx astro build`
- git は `git -C /Users/wisteria/Projects/wisteria-io ...` の単発。署名行なし
- 選考中の企業名・日程・選考上の目標を書かない

## Review Focus

- チップのリンク先: `#career-<id>` が固定ナビの下に隠れず見える（`scroll-margin-top`）。検査で id の存在を確かめる
- 375×667 で最初の画面に名前〜リンクまでが収まる。チップが3行に折り返しても収まること。スクリーンショットで確かめる
- 受賞の件数と内訳が projects.ts の受賞から作られる。検査で「受賞3回」と内訳3件が出ていることを確かめる
- OGP 画像の日本語が豆腐（□）にならない。画像を目で確かめる
- JS が無い環境でも Inter が読み込まれる（`<noscript>`）。検査で確かめる

---

### Task 1: ビルド結果の検査スクリプト（先に失敗させる）

**Files:**
- Create: `scripts/check-dist.mjs`
- Modify: `package.json`（`"check": "node scripts/check-dist.mjs"` を scripts に足す）

**Interfaces:**
- Produces: `npm run check`。`dist/` を読み、失敗した項目を全部出して exit 1

- [ ] **Step 1: スクリプトを書く**

```js
// ビルド結果（dist/）が段階①の仕様を満たすか確かめる。npx astro build の後に実行する
import { readFileSync, existsSync } from 'node:fs';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../dist/${path}`, import.meta.url));

const html = read('index.html');
const tagline = '課題を見つけ、技術を選び、作りきる。';

check(html.includes('<title>藤井 優気 (wisteria) | ポートフォリオ</title>'), 'title');
check(html.includes(`<meta name="description" content="${tagline}"`), 'description');
check(html.includes('<meta property="og:image" content="https://wisteria-io.com/og.png"'), 'og:image');
check(exists('og.png'), '/og.png が無い');

const hero = html.match(/<section id="top"[\s\S]*?<\/section>/)?.[0] ?? '';
check(hero.includes('藤井 優気'), 'Hero に名前');
check(hero.includes(tagline), 'Hero に一行');
check(hero.includes('28卒・公立はこだて未来大学'), 'Hero に所属');
const chips = [...hero.matchAll(/href="#(career-[\w-]+)"/g)].map((m) => m[1]);
check(chips.length === 3, `チップが3つ（実際: ${chips.length}）`);
for (const id of chips) check(html.includes(`id="${id}"`), `チップの行き先 #${id} が無い`);
check(hero.includes('ハッカソン受賞3回'), 'チップ「ハッカソン受賞3回」');

check(html.includes('FISH 優勝・P2HACKS 2025 Directorz賞・P2HACKS 2024 サイバーエージェント賞'), '経歴にハッカソンの内訳');
check(html.includes('2026/2 〜 2026/7'), 'アルゴ式の期間');

const projects = html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] ?? '';
check((projects.match(/data-project/g) ?? []).length === 5, '作品が5件');
check(projects.includes('FUN Developers Hub'), '作品に FUN Developers Hub');
check(!html.includes('yajiuma'), 'yajiuma.nvim が載っている');

const order = ['experience', 'projects', 'skills', 'about', 'links'].map((id) => html.indexOf(`<section id="${id}"`));
check(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), `セクションの順番（${order}）`);

const about = html.match(/<section id="about"[\s\S]*?<\/section>/)?.[0] ?? '';
check(!about.includes('3年'), 'About に「3年」');
check(about.includes('Ubuntu Server'), 'About に Ubuntu Server');

check(!/\p{Extended_Pictographic}/u.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'トップに絵文字が残っている');
check(!html.includes('family=Noto+Sans+JP'), 'ページで Noto Sans JP を読み込んでいる');
check(/<noscript>[^]*fonts\.googleapis\.com[^]*<\/noscript>/.test(html), 'noscript のフォント読み込み');

const slugs = ['hello-world', 'neovim-intro-part1', 'neovim-intro-part2', 'neovim-intro-part3', 'golangci-lint', 'errors-are-values', 'ca-go-college-2026'];
for (const slug of slugs) {
  check(exists(`blog/${slug}/index.html`), `/blog/${slug} が無い`);
  check(exists(`og/${slug}.png`), `/og/${slug}.png が無い`);
}

if (failures.length) {
  console.error(`NG ${failures.length}件:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
```

- [ ] **Step 2: 失敗を確かめる**

Run: `npx astro build` → `npm run check`
Expected: FAIL（title・Hero・og.png などが NG として並ぶ）

- [ ] **Step 3: Commit** `chore: 段階①の仕様を確かめるビルド結果の検査を追加`

### Task 2: データ3ファイル

**Files:**
- Create: `src/data/profile.ts`, `src/data/projects.ts`, `src/data/career.ts`

**Interfaces:**
- Produces:
  - `profile: { name: string; handle: string; tagline: string; affiliation: string }`
  - `type Project = { id; title; event; desc; tech: string[]; award: string | null; period; github?; link? }`、`projects: Project[]`
  - `type CareerItem = { id; period; title; subtitle; desc }`、`career: CareerItem[]`
  - `type Highlight = { id: string; label: string }`、`highlights: Highlight[]`

- [ ] **Step 1: profile.ts** — 名前 `藤井 優気`、handle `wisteria`、一行、所属
- [ ] **Step 2: projects.ts** — `Projects.astro` の配列を移す。順番は FISH → P2HACKS 2025 → P2HACKS 2024 → JPHACKS 2025 → FUN Developers Hub。`event` は `FISH`・`P2HACKS 2025`・`P2HACKS 2024`・`JPHACKS 2025`・`高度ICT演習`。id は `fish-2024`・`p2hacks-2025`・`p2hacks-2024`・`jphacks-2025`・`fun-developers-hub`
- [ ] **Step 3: career.ts** — `Experience.astro` の配列を移す。id: `algo-method`・`go-college`・`hakoreco`・`icpc`・`hackathons`・`university`・`high-school`。アルゴ式の期間は `2026/2 〜 2026/7`。ハッカソンの項目は次で作る

```ts
const awarded = projects.filter((p) => p.award);
// title: `ハッカソン受賞${awarded.length}回`
// desc: awarded.map((p) => `${p.event} ${p.award}`).join('・')
export const highlights: Highlight[] = [
  { id: 'go-college', label: 'Go College ベストエンジニアリング賞' },
  { id: 'hackathons', label: `ハッカソン受賞${awarded.length}回` },
  { id: 'icpc', label: 'ICPC 2025 横浜' },
];
```

- [ ] **Step 4:** `npx astro build` が通る
- [ ] **Step 5: Commit** `feat: 名前・経歴・作品のデータを1か所にまとめる`

### Task 3: アイコンと Hero と経歴

**Files:**
- Create: `src/components/Icon.astro`（`name` で Lucide の SVG を返す。trophy・link・code・server・layout・palette・database・cloud・cpu・terminal・wrench）、`src/assets/avatar.jpg`（`public/avatar.jpg` を複製）
- Modify: `src/components/Hero.astro`, `src/components/Experience.astro`

- [ ] **Step 1:** Hero を `<section id="top">` にし、上から アバター（`<Image>` 64px）・h1 名前・一行・所属・チップ・リンク。`min-h-screen` の中央寄せをやめ `pt-24 pb-12` で上から詰める。チップは `<a href="#career-<id>">` に trophy アイコン、`min-h-9 px-3 gap-2`
- [ ] **Step 2:** Experience を `career` から描き、各項目に `id="career-<id>"` と `scroll-mt-24`。desc が空なら説明の行を出さない
- [ ] **Step 3:** build → check。Hero・経歴の項目が OK になる
- [ ] **Step 4: Commit** `feat: 最初の画面に名前・一行・実績3つを置く`

### Task 4: 作品・スキル・About・並び順

**Files:**
- Modify: `src/components/Projects.astro`, `Skills.astro`, `About.astro`, `Nav.astro`, `src/pages/index.astro`

- [ ] **Step 1:** Projects を `projects` から描く。各カードに `data-project`。🏆 → trophy、🔗 → link アイコン
- [ ] **Step 2:** Skills の絵文字を Icon に置き換え、Linux に CachyOS を足す
- [ ] **Step 3:** About を仕様の文に書き換える（「3年」を消し、マシンごとの OS の遍歴を箇条で）
- [ ] **Step 4:** index と Nav を Experience → Projects → Skills → About → Links（→ Blog）の順に
- [ ] **Step 5:** build → check。作品・順番・About・絵文字が OK
- [ ] **Step 6: Commit** `feat: 作品とAboutを整理し、セクションを実績から並べる`

### Task 5: OGP とメタ

**Files:**
- Create: `src/lib/og.ts`, `src/pages/og.png.ts`
- Modify: `src/pages/og/[...slug].png.ts`, `src/layouts/Layout.astro`

**Interfaces:**
- Produces: `renderOgImage(body: SatoriNode[]): Promise<Response>` — 背景・上の線・下の名前と URL を共通で描き、`body` を中央に置いて PNG を返す。フォント（Noto Sans JP 400/700）はモジュール内で1回だけ取得する

- [ ] **Step 1:** og.ts を書く（既存の取得処理と見た目を移す）
- [ ] **Step 2:** og.png.ts — 名前（64px）・一行（36px）・`highlights` のチップ3つ
- [ ] **Step 3:** ブログの OGP を `renderOgImage` で記事タイトルだけにする
- [ ] **Step 4:** Layout の既定値を profile から作り、既定の image を `/og.png`。`og:image:width` 1200・`height` 630 を足す
- [ ] **Step 5:** build → check。`dist/og.png` と `dist/og/errors-are-values.png` を Read で開き、日本語が出ていることを確かめる
- [ ] **Step 6: Commit** `feat: トップのOGP画像を作り、ブログのOGPと見た目を揃える`

### Task 6: 速さとアクセシビリティ

**Files:**
- Modify: `src/layouts/Layout.astro`, `src/styles/global.css`, `src/components/Links.astro`, `Projects.astro`
- Create: `docs/adr/adr-009-web-fonts.md`、`docs/adr/README.md` に追加

- [ ] **Step 1:** フォントの読み込みを Inter・JetBrains Mono だけにし、`rel="preload" as="style" onload="this.rel='stylesheet'"` ＋ `<noscript>`。body の font-family を `'Inter', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Noto Sans JP', system-ui, sans-serif` に
- [ ] **Step 2:** 受賞バッジと期間の色を AA に（バッジは `text-white` on `bg-primary/30` 等、期間は `text-text-muted`）。フッターのリンクに `underline`
- [ ] **Step 3:** build → check → preview → Lighthouse モバイル。100 未満の項目があれば原因を直す（CSS が描画を止めていれば `build.inlineStylesheets: 'always'`）
- [ ] **Step 4:** ADR-009（Web フォントで描画を止めない。別の選択肢: 全部端末のフォント／セルフホスト。トレードオフ: 日本語の見た目が端末で変わる）
- [ ] **Step 5: Commit** `perf: Webフォントで描画を止めないようにし、コントラストを直す`

### Task 7: 画面の確認と公開

- [ ] **Step 1:** Chrome headless で 375×667 と 1280×800 のスクリーンショットを撮り、最初の画面に名前〜リンクが収まることを確かめる。収まらなければ余白と文字の大きさを詰めて Task 3 からやり直す
- [ ] **Step 2:** チップを押した先が隠れないか、375 幅でアンカー付き URL を撮って確かめる
- [ ] **Step 3:** README の Tech Stack に変化はないので触らない。`npx astro build` と `npm run check` が通ることを確かめて `git push origin main`
- [ ] **Step 4:** デプロイの完了後、`curl -sI https://wisteria-io.com/` と `/og.png` が 200 を返し、title が新しいことを確かめる
