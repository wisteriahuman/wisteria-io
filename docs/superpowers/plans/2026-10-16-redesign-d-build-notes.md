# 段階②-a D（作りの層）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** トップの各紙と記事の最後に「この部分の作り」を置き、その部分を決めた ADR・コードのファイル・最近の PR 3件を見せる。PR は git の履歴から拾い、手で書かない。

**Architecture:** セクションと ADR・ファイルの対応は `src/data/build-notes.ts` の1か所に書く。ADR の題名と改訂前の題は `docs/adr/` のファイルから読み（`src/lib/adr.ts`）、PR はビルド時にファイルごとの `git log` の件名の `(#N)` から拾う（`src/lib/history.ts`）。表示は `BuildNote.astro`（`<details>`）で、ノートの余白に書き足したメモの見た目にする。

**Tech Stack:** Astro 5、Tailwind CSS 4、`node:test`（Node 24 の型の取り除きで `.ts` をそのまま読む）、git

**Spec:** [docs/superpowers/specs/2026-10-15-redesign-design.md](../specs/2026-10-15-redesign-design.md) の「D. 作りの層」。判断は [ADR-017](../../adr/adr-017-build-notes-from-git.md)、見た目は [ADR-016](../../adr/adr-016-paper-look.md)、達成する開発者ストーリーは DS-12

## Global Constraints

- 変更は PR → verify → staging で本人が確かめる → squash merge。git・gh の書き込みは単発のコマンド、PR の本文は `--body-file`
- PR は `git log --format=%s -- <ファイル>` の件名の末尾 `(#N)` から拾う。GitHub の API は使わない。新しい順に重複を除き3件まで
- git が使えないときはビルドを失敗させる（黙って空にしない）
- ADR の題名は `docs/adr/` のファイルの1行目から作り、手で書かない
- 見た目は大学ノートの書き方（ADR-016）。箱・枠・影・角の丸い面を足さない。縦の寸法は 28px の倍数（`pnpm check:grid`）
- 等幅（`font-mono`）は「この部分の作り」のラベルにだけ使う
- 表の層（サイト本体）では KGI・KSF などの用語を使わない
- Lighthouse（モバイル）の Accessibility・Best Practices・SEO は 100、Performance は 95 以上

## Review Focus

- CI の浅い clone: `fetch-depth` が既定の 1 だと、`git log` は最新の1件しか返さず、「最近の変更」がほぼ空になる → Task 4 で `fetch-depth: 0` にし、check-dist で「トップの紙の多くに PR のリンクがある」ことを確かめる
- PR のビルドの merge commit: PR の CI は GitHub が作る merge commit（件名に `(#N)` が無い）の上でビルドする → `(#N)` の無い件名は捨てる。Task 1 の単体の検査で確かめる
- 件名の途中の `(#N)`（例: 「#3 の続き (#12)」）: 末尾の `(#N)` だけを PR とする → Task 1 の単体の検査
- 開いた中身の高さ: `<details>` を開いても、罫線からずれない → Task 3 で check-grid を「すべての `details` を開いた状態」でも測る
- 対応表のファイル名の書き間違い: 実在しないファイルを書くと、GitHub へのリンクが 404 になる → Task 1 の単体の検査で、対応表のファイルと ADR が実在することを確かめる

---

ブランチ: `feat/build-notes`（main から）

### Task 1: 対応表と、ADR・PR を読む処理

**Files:**
- Create: `src/data/build-notes.ts`、`src/lib/adr.ts`、`src/lib/history.ts`
- Create: `scripts/build-notes.test.mjs`
- Modify: `package.json`（`test` に `.mjs` を足す）

**Interfaces:**
- Produces:
  - `type SectionId = 'top' | 'experience' | 'projects' | 'skills' | 'about' | 'links'`
  - `buildNotes: Record<SectionId, { adrs: number[]; files: string[] }>`
  - `adr(no: number): { no: number; title: string; previous?: string; url: string }`（ファイルが無ければ throw）
  - `parsePrs(subjects: string[], limit = 3): { number: number; title: string; url: string }[]`
  - `prsFor(files: string[], limit = 3)`（git を実行して `parsePrs` に渡す。git が失敗したら throw）
  - `fileUrl(path: string): string`

- [ ] **Step 1: 失敗する検査を書く**

`scripts/build-notes.test.mjs`:

```js
// 「この部分の作り」の対応表と、ADR・PR を読む処理（ADR-017、DS-12）
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { buildNotes } from '../src/data/build-notes.ts';
import { adr } from '../src/lib/adr.ts';
import { parsePrs, prsFor } from '../src/lib/history.ts';

test('件名の末尾の (#N) から PR を拾う', () => {
  assert.deepEqual(parsePrs(['feat: 見た目を大学ノートにする (#12)']), [
    { number: 12, title: 'feat: 見た目を大学ノートにする', url: 'https://github.com/wisteriahuman/wisteria-io/pull/12' },
  ]);
});

test('(#N) の無い件名は捨てる（PR のビルドの merge commit など）', () => {
  assert.deepEqual(parsePrs(['Merge abc into def', 'fix: 直す']), []);
});

test('件名の途中の (#N) は PR にしない', () => {
  assert.deepEqual(parsePrs(['docs: (#3) の続き']), []);
});

test('同じ PR は1回だけ、新しい順に3件まで', () => {
  const prs = parsePrs(['a (#5)', 'b (#5)', 'c (#4)', 'd (#3)', 'e (#2)']);
  assert.deepEqual(
    prs.map((p) => p.number),
    [5, 4, 3],
  );
});

test('git の履歴から PR を拾える', () => {
  const prs = prsFor(['src/styles/global.css']);
  assert.ok(prs.length > 0, 'global.css を変えた PR が見つからない');
});

test('ADR の題名と、改訂前の題をファイルから読む', () => {
  const a = adr(16);
  assert.match(a.title, /^見た目を/);
  assert.equal(a.previous, '紙の質感');
  assert.equal(adr(17).previous, undefined);
  assert.match(a.url, /\/blob\/main\/docs\/adr\/adr-016-paper-look\.md$/);
});

test('対応表の ADR とファイルがすべて実在する', () => {
  for (const [id, note] of Object.entries(buildNotes)) {
    assert.ok(note.adrs.length > 0, `${id} に ADR が無い`);
    for (const no of note.adrs) assert.doesNotThrow(() => adr(no), `${id} の ADR-${no} が無い`);
    for (const f of note.files) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${id} の ${f} が無い`);
  }
});
```

`package.json` の `test` を `node --test 'scripts/*.test.cjs' 'scripts/*.test.mjs'` にする。

- [ ] **Step 2: 失敗を確かめる**

Run: `pnpm test`
Expected: FAIL（`Cannot find module '../src/data/build-notes.ts'`）。ほかの検査は pass

- [ ] **Step 3: 実装する**

`src/lib/history.ts`:

```ts
import { execFileSync } from 'node:child_process';

// 「この部分の作り」の最近の変更（ADR-017）。main は squash で merge し、件名の末尾に (#N) が付く
const REPO = 'https://github.com/wisteriahuman/wisteria-io';

export type Pr = { number: number; title: string; url: string };

export const fileUrl = (path: string) => `${REPO}/blob/main/${path}`;

// git log の件名（新しい順）から、末尾の (#N) を PR として拾う。同じ PR は1回だけ
export function parsePrs(subjects: string[], limit = 3): Pr[] {
  const seen = new Set<number>();
  const prs: Pr[] = [];
  for (const subject of subjects) {
    const m = subject.match(/^(.*\S)\s+\(#(\d+)\)$/);
    if (!m) continue;
    const number = Number(m[2]);
    if (seen.has(number)) continue;
    seen.add(number);
    prs.push({ number, title: m[1], url: `${REPO}/pull/${number}` });
    if (prs.length === limit) break;
  }
  return prs;
}

// ファイルを変えた PR。git が使えないときは throw してビルドを止める（黙って空にしない）
export function prsFor(files: string[], limit = 3): Pr[] {
  const out = execFileSync('git', ['log', '--format=%s', '--', ...files], { encoding: 'utf8' });
  return parsePrs(out.split('\n').filter(Boolean), limit);
}
```

`src/lib/adr.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { fileUrl } from './history.ts';

// ADR の題名は docs/adr/ のファイルの1行目から作り、手で書かない（ADR-017）
const dir = new URL('../../docs/adr/', import.meta.url);

export type Adr = { no: number; title: string; previous?: string; url: string };

export function adr(no: number): Adr {
  const prefix = `adr-${String(no).padStart(3, '0')}-`;
  const file = readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) throw new Error(`ADR-${no} のファイルが docs/adr/ に無い`);
  const text = readFileSync(new URL(file, dir), 'utf8');
  const title = text.split('\n')[0].replace(/^#\s*ADR-\d+:\s*/, '').trim();
  // 日付の行の「（2026-10-16 に「紙の質感」から改訂）」から、改訂前の題を拾う
  const previous = text.match(/^- 日付:.*「([^」]+)」から改訂/m)?.[1];
  return { no, title, previous, url: fileUrl(`docs/adr/${file}`) };
}
```

`src/data/build-notes.ts`:

```ts
// 「この部分の作り」の対応表（ADR-017、DS-12）。セクションごとに、決めた ADR とコードのファイルを1か所に書く
// PR はここに書かない。ファイルの git の履歴からビルド時に拾う
export type SectionId = 'top' | 'experience' | 'projects' | 'skills' | 'about' | 'links';

export const buildNotes: Record<SectionId, { adrs: number[]; files: string[] }> = {
  top: {
    adrs: [7, 16, 9],
    files: ['src/components/Hero.astro', 'src/components/Stickers.astro', 'src/data/profile.ts', 'src/data/career.ts'],
  },
  experience: { adrs: [7, 16], files: ['src/components/Experience.astro', 'src/data/career.ts'] },
  projects: { adrs: [7, 16], files: ['src/components/Projects.astro', 'src/data/projects.ts'] },
  skills: { adrs: [16], files: ['src/components/Skills.astro'] },
  about: { adrs: [8, 16], files: ['src/components/About.astro'] },
  links: { adrs: [11, 6, 16], files: ['src/components/Links.astro', 'src/components/Stickers.astro', 'serve.cjs'] },
};
```

- [ ] **Step 4: 検査が通ることを確かめる**

Run: `pnpm test`
Expected: すべて pass（serve 8・コントラスト 10・作りの層 7）

- [ ] **Step 5: lint と Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src/data/build-notes.ts src/lib/adr.ts src/lib/history.ts scripts/build-notes.test.mjs package.json
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: この部分の作りの対応表と、ADRとPRを読む処理を足す"
```

### Task 2: BuildNote.astro を、各紙と記事の最後に置く

**Files:**
- Create: `src/components/BuildNote.astro`
- Modify: `src/pages/index.astro`、`src/layouts/BlogPost.astro`、`src/pages/blog/[...slug].astro`、`scripts/check-dist.mjs`、`src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 の `buildNotes`・`adr`・`prsFor`・`fileUrl`
- Produces: `<BuildNote adrs={number[]} files={string[]} label?={string} />`。HTML は `<details class="build-note">`

- [ ] **Step 1: 失敗する検査を書く**

`scripts/check-dist.mjs` の「破れ方は紙ごとに違う」の検査の後ろに足す:

```js
// この部分の作り（ADR-017）。トップの6枚すべての最後にあり、ADR のリンクが1つ以上ある
const notes = [...html.matchAll(/<details class="build-note"[\s\S]*?<\/details>/g)].map((m) => m[0]);
check(notes.length === 6, `この部分の作りが6つ（実際: ${notes.length}）`);
for (const n of notes) check(/\/docs\/adr\/adr-\d{3}-/.test(n), 'この部分の作りに ADR のリンクが無い');
// PR は git の履歴から拾う。浅い clone だとほとんど空になる
check(notes.filter((n) => /\/pull\/\d+/.test(n)).length >= 5, 'この部分の作りの多くに PR のリンクが無い（git の履歴が浅い？）');
// 改訂した ADR は、前の題を取り消し線で残す
check(/<s>紙の質感<\/s>/.test(html), '改訂した ADR-016 の前の題が取り消し線で残っていない');
// 記事の最後に、この記事の履歴
check(/<details class="build-note"[\s\S]*?この記事の履歴/.test(read('blog/hello-world/index.html')), '記事にこの記事の履歴が無い');
```

Run: `pnpm build` の後に `pnpm check`
Expected: NG（`この部分の作りが6つ（実際: 0）` など5件）

- [ ] **Step 2: 部品を書く**

`src/components/BuildNote.astro`:

```astro
---
// この部分の作り（ADR-017）。ノートの余白に、あとからペンで書き足したメモの見た目にする（ADR-016）
import { adr } from '../lib/adr';
import { fileUrl, prsFor } from '../lib/history';

interface Props {
  adrs?: number[];
  files: string[];
  label?: string;
}

const { adrs = [], files, label = 'この部分の作り' } = Astro.props;
const decisions = adrs.map(adr);
const prs = prsFor(files);
---

<details class="build-note">
  <summary class="font-mono text-sm text-pen">{label}</summary>
  <div class="build-note-body text-sm text-pen">
    {decisions.length > 0 && (
      <>
        <p class="font-bold">決めたこと</p>
        <ul>
          {decisions.map((d) => (
            <li>
              <a href={d.url} class="underline underline-offset-4">ADR-{String(d.no).padStart(3, '0')}</a>{' '}
              {d.previous && <><s>{d.previous}</s>{' → '}</>}{d.title}
            </li>
          ))}
        </ul>
      </>
    )}
    <p class="font-bold">コード</p>
    <ul>
      {files.map((f) => (
        <li><a href={fileUrl(f)} class="underline underline-offset-4">{f}</a></li>
      ))}
    </ul>
    <p class="font-bold">最近の変更</p>
    {prs.length === 0 ? (
      <p>まだ変更の記録がない</p>
    ) : (
      <ul>
        {prs.map((p) => (
          <li><a href={p.url} class="underline underline-offset-4">#{p.number}</a> {p.title}</li>
        ))}
      </ul>
    )}
  </div>
</details>
```

`src/styles/global.css` の `@layer components` の「蛍光ペン」の前に足す:

```css
  /* この部分の作り。紙の最後の右に、ペンで書き足したメモ（ADR-016・ADR-017） */
  .build-note {
    margin-top: var(--line);
    text-align: right;
  }

  .build-note > summary {
    display: inline-block;
    cursor: pointer;
  }

  .build-note[open] {
    text-align: left;
  }

  .build-note-body {
    padding-left: 1rem;
    overflow-wrap: anywhere;
  }
```

- [ ] **Step 3: 置く**

`src/pages/index.astro`: `import BuildNote from '../components/BuildNote.astro';` と `import { buildNotes } from '../data/build-notes';` を足し、6枚それぞれの最後の部品の後ろ（`</div>` の前）に `<BuildNote {...buildNotes.top} />`・`experience`・`projects`・`skills`・`about`・`links` を置く。

`src/pages/blog/[...slug].astro`: `props` に `file: \`src/content/blog/${post.id}\`` を足し（`post.id` は拡張子つきのファイル名）、`<BlogPost ... file={file}>` で渡す。

`src/layouts/BlogPost.astro`: `Props` に `file: string` を足し、`<div class="blog-content">` の後ろに `<BuildNote files={[file]} label="この記事の履歴" />` を置く（`adrs` は渡さない）。

- [ ] **Step 4: 検査が通ることを確かめる**

Run: `pnpm build` の後に `pnpm check` と `pnpm check:grid`
Expected: どちらも `OK`

- [ ] **Step 5: lint と Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src scripts/check-dist.mjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 各紙と記事の最後に、この部分の作りを書き足す"
```

### Task 3: 開いた状態でも罫線にそろうことを測る

**Files:**
- Modify: `scripts/check-grid.mjs`

- [ ] **Step 1: 開いた状態の回を足す**

`check-grid.mjs` の `for (const path of pages)` の中、`page.goto` の後の測る処理を、`open` を `false`・`true` の2回まわす。`true` のときは測る前に `document.querySelectorAll('details').forEach((d) => { d.open = true; })` を実行し、`label` に `開いた` を足す。

- [ ] **Step 2: 測る**

Run: `pnpm check:grid`
Expected: `OK`。ずれたら、`.build-note` と中の `p`・`li` の上下の余白を 28px の倍数に直す

- [ ] **Step 3: Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add scripts/check-grid.mjs src/styles/global.css
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: この部分の作りを開いても罫線にそろうことを測る"
```

### Task 4: CI の履歴を深くし、文書を直し、staging で見てもらう

**Files:**
- Modify: `.github/workflows/ci.yml`、`docs/requirements/developer-stories.md`（DS-12）

- [ ] **Step 1: CI**

`verify` の job の `- uses: actions/checkout@v4` を次にする:

```yaml
      # この部分の作りの PR を、ファイルごとの git の履歴から拾う（ADR-017）。浅い clone だと最新の1件しか見えない
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
```

- [ ] **Step 2: DS-12**

`状態: 未着手（段階②-a の D で達成にする）` を `状態: 達成（PR <N>。対応表は src/data/build-notes.ts、抜けは pnpm test と pnpm check が検出する）` にする（`<N>` は PR を作ってから入れる）

- [ ] **Step 3: verify・撮る・PR**

Run: `pnpm verify`
Expected: 終了コード 0

390px と 1280px で、トップの紙の最後と、開いた状態を撮って確かめる。push して PR（`feat: 各紙にこの部分の作りを書き足す`）を作り、GitHub の verify で `この部分の作りの多くに PR のリンクが無い` が出ないこと（fetch-depth が効いていること）を確かめる。staging で本人に見てもらい、問題が無いと言われてから merge する
