# 段階②-a E（About を経験の年表にする）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** About の紙を、時期と一行ずつの経験の年表だけにする。リンクの紙に「話しかけるなら X の DM へ」を足す。人生の KGI を About に出す予定だったドキュメントを、新しい決定にそろえる。

**Architecture:** 年表は `src/components/About.astro` の中の配列から、経歴の紙（`Experience.astro`）と同じ `<ol>` と `.margin-note` の形で描く。AtCoder の色は `src/data/profile.ts` の `ratings`、X の URL は同じファイルの `socialLinks.x` から出し、値を二か所に書かない。検査は既存の `scripts/check-dist.mjs`（ビルド結果の HTML を見る）と `scripts/check-grid.mjs`（罫線）に足す。

**Tech Stack:** Astro 5、Tailwind CSS 4、Node 24（`scripts/*.mjs`）、Playwright（check-grid）

**Spec:** [docs/superpowers/specs/2026-10-23-about-design.md](../specs/2026-10-23-about-design.md)（本人承認済み）。見た目は [ADR-016](../../adr/adr-016-paper-look.md)、目標の見せ方は [ADR-008](../../adr/adr-008-goal-visibility.md)

## Global Constraints

- ブランチ `feat/about-timeline` を `origin/main`（3b928ea、PR #18 を含む）から切る
- git・gh の書き込みは `git -C /Users/wisteria/Projects/wisteria-io ...` の単発のコマンド。`&&`・パイプ・リダイレクト・`$` を入れない。PR の本文は `--body-file`。コミットは `<種類>: <内容>` の日本語、Co-Authored-By を付けない
- この PR は見た目と文章が変わるので、PR を出したら止まる。本人が staging（https://staging.wisteria-io.com）で確かめて OK を出してから squash merge する（`docs/guides/development-flow.md`）
- 書くのは事実だけ。自分の評価（「優しい」「芯がある」「好き」「楽しい」など）を書かない。仕様の年表にない事実を足さない
- 公開リポジトリ。選考中の企業名・日程・選考上の目標・個人的な事情を書かない。2026-10-16 以降に話した核とその出どころは、どこにも書かない
- 表の層（サイト本体）では KGI・KSF・KPI の語を使わない
- 縦の寸法は罫線 1.75rem の倍数（`pnpm check:grid` が 320/390/768/1280px × 文字 16/20px で測る）。箱・枠・影・角の丸い面を足さない
- 検証は `pnpm verify`（型・リント・ビルド・check・check:grid・test・Lighthouse）

## Review Focus

- 文字を 20px にした端末で、入れ子の「大学」の欄の下の行が罫線からずれる → Task 1 は check:grid を全幅・16/20px で通す（既存の検査が About の紙の全要素を測る）
- 768px 以上で、入れ子の `<li>` の中に `.margin-note` を置くと、日付の欄が入れ子の左端から測られて本文に重なる → 欄は外側の4つの `<li>` にだけ置く。Task 1 で `.margin-note` が About の中にちょうど4つあることを確かめる
- 最初の画面の評価の行を変えたのに、年表の AtCoder の色が古いまま残る → Task 1 で、ビルド結果の最初の画面の `AtCoder …` と About の `AtCoder …` が同じ文字列であることを確かめる
- X のアカウントを変えたとき、シールと DM の一行の URL が食い違う → Task 2 で、リンクの紙の DM の一行の `href` が X のシールの `href` と同じであることを確かめる
- 外した文が別の紙に移ったり、About に残ったりする → Task 1 で「好きです」「楽しくて」「KGI」「KSF」「KPI」が About に無いことを確かめる

---

### Task 1: About の紙を年表にする

**Files:**
- Modify: `src/components/About.astro`（全体）
- Modify: `scripts/check-dist.mjs:59-61`（About の検査）

**Interfaces:**
- Consumes: `ratings: string[]`（`src/data/profile.ts`。今は `['AtCoder 水色', 'paiza Sランク']`）
- Produces: About の `<section id="about">` の中に `<ol>`。外側の `<li>` は4つで、それぞれに `<p class="margin-note">`

- [ ] **Step 1: check-dist に About の検査を足す（失敗する）**

`scripts/check-dist.mjs` の `const about = ...` の後、既存の2つ（「3年」を含まない、「Ubuntu Server」を含む）は残し、次を足す。

```js
// About は経験の年表だけ（docs/superpowers/specs/2026-10-23-about-design.md）
const aboutNotes = [...about.matchAll(/class="margin-note"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
check(
  JSON.stringify(aboutNotes) === JSON.stringify(['小学校〜高校', '2024', '2025', '大学']),
  `About の時期の欄が「小学校〜高校・2024・2025・大学」でない（${aboutNotes.join('・')}）`,
);
const aboutText = about.replace(/<[^>]+>/g, '');
for (const line of ['ハンドボールをやっていた', '大学でプログラミングを始める', 'ICPC 2025 アジア横浜大会に出場', 'Neovim', 'Nix', 'コーヒーをこぼして故障']) {
  check(aboutText.includes(line), `About の年表に「${line}」が無い`);
}
check(!/KGI|KSF|KPI|好きです|楽しくて/.test(aboutText), 'About に KGI・KSF・KPI か「好き」「楽しい」の文が残っている');
const heroAtCoder = hero.replace(/<[^>]+>/g, '').match(/AtCoder [^・\s<]+/)?.[0];
check(Boolean(heroAtCoder) && aboutText.includes(heroAtCoder), 'About の AtCoder の色が、最初の画面の評価と同じでない');
```

`hero` は同じファイルの上（`const hero = html.match(/<section id="top"...`）で作られている。

- [ ] **Step 2: ビルドして、検査が失敗するのを確かめる**

Run: `pnpm build` の後に `pnpm check`
Expected: FAIL。「About の時期の欄が…でない」「About の年表に…が無い」「About に KGI…か『好き』『楽しい』の文が残っている」が出る

- [ ] **Step 3: About.astro を年表に書き換える**

- 段落（大学・学部の紹介、「好きです」、「楽しくて…興味があります」、「エディタは Neovim…こんな感じです」）をすべて外す。見出し `<h2>`（手書き・蛍光ペンの「About」）はそのまま
- 年表は `Experience.astro` と同じ形: `<ol class="mt-7 space-y-7">`、外側の `<li class="relative">` に `<p class="margin-note">{時期}</p>` と本文
- 外側の4行と本文（文言はこのとおり）
  - `小学校〜高校`: ハンドボールをやっていた
  - `2024`: 大学でプログラミングを始める
  - `2025`: ICPC 2025 アジア横浜大会に出場
  - `大学`: 中に入れ子の `<ul class="space-y-7">` で3つ（入れ子の `<li>` に `.margin-note` は置かない）
    - `競技プログラミング（{ratings のうち 'AtCoder' で始まる値}）`。`ratings.find((r) => r.startsWith('AtCoder'))`
    - エディタを Neovim に、開発環境を Nix にする
    - マシンごとの OS の遍歴。その下に今の `machines` 配列の3台を、今の表示（名前を太字、添え書きを小さく `text-sm leading-none text-ink-muted`、遍歴を `text-ink-muted`）のまま並べる
- `machines` 配列は今の値を変えない

- [ ] **Step 4: ビルドと検査が通るのを確かめる**

Run: `pnpm build` の後に `pnpm check`、続けて `pnpm check:grid`
Expected: どちらも `OK`。check:grid は About の紙を含め、全幅・16/20px でずれが0件

- [ ] **Step 5: コミット**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src/components/About.astro scripts/check-dist.mjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: About を、経験の年表だけにする"
```

### Task 2: リンクの紙に、話しかける先を一行足す

**Files:**
- Modify: `src/components/Links.astro`（`<Stickers />` の後）
- Modify: `scripts/check-dist.mjs`（Links の検査を足す）

**Interfaces:**
- Consumes: `socialLinks.x: string`（`src/data/profile.ts`。今は `https://x.com/wisteria_man`）

- [ ] **Step 1: check-dist に検査を足す（失敗する）**

```js
// 「聞きたい」と思った人の窓口（docs/superpowers/specs/2026-10-23-about-design.md）
const links = html.match(/<section id="links"[\s\S]*?<\/section>/)?.[0] ?? '';
const xHref = links.match(/<a href="([^"]+)"[^>]*>\s*<span class="sr-only">X<\/span>/)?.[1];
const dm = links.match(/<a href="([^"]+)"[^>]*>[^<]*X の DM[^<]*<\/a>/);
check(links.replace(/<[^>]+>/g, '').includes('話しかけるなら X の DM へ'), 'リンクの紙に「話しかけるなら X の DM へ」が無い');
check(Boolean(xHref) && dm?.[1] === xHref, 'DM の一行のリンク先が、X のシールと同じでない');
```

- [ ] **Step 2: ビルドして、検査が失敗するのを確かめる**

Run: `pnpm build` の後に `pnpm check`
Expected: FAIL。上の2件が出る

- [ ] **Step 3: Links.astro に一行足す**

`<Stickers />` の直後に `<p>`。文は「話しかけるなら X の DM へ」。リンクにするのは「X の DM へ」の部分で、`href={socialLinks.x}`、`target="_blank" rel="noopener"`、見た目はフッターのリンクと同じ `text-pen underline underline-offset-4`。行の高さは本文と同じ（1.75rem）。`socialLinks` は `../data/profile` から読む

- [ ] **Step 4: ビルドと検査が通るのを確かめる**

Run: `pnpm build` の後に `pnpm check`、続けて `pnpm check:grid`
Expected: どちらも `OK`

- [ ] **Step 5: コミット**

```bash
git -C /Users/wisteria/Projects/wisteria-io add src/components/Links.astro scripts/check-dist.mjs
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: リンクの紙に、話しかける先を一行足す"
```

### Task 3: ドキュメントを新しい決定にそろえる

**Files:**
- Modify: `docs/adr/adr-008-goal-visibility.md`
- Modify: `docs/adr/adr-016-paper-look.md:27`
- Modify: `docs/design/redesign.md`（About の節・トップの並び）
- Modify: `docs/superpowers/specs/2026-10-15-redesign-design.md`（「E. About」の節の頭）
- Modify: `docs/guides/development-flow.md:32`（作業ツリーにある変更をそのまま入れる）
- Add: `docs/superpowers/specs/2026-10-23-about-design.md`、この計画

- [ ] **Step 1: ADR-008 を書き直す**

- 決定: 「人生の目標の構造（KGI・KSF・KPI）は About に出さない。About には経験の事実を年表で並べる。価値観の根っこは、相手が知りたいと思ったときに会って話す」。このサイトの目的と指標を要件書に残す、選考上の目標はどこにも出さない、は残す
- 題は変える場合、日付の行を `- 日付: 2026-10-15（2026-10-23 に「目標の構造をどこまで見せるか」から改訂）` の形にする（`src/lib/adr.ts` が前の題を拾い、「この部分の作り」で取り消し線にする）。題を変えないなら日付の行に改訂日だけ足す
- 理由・受け入れるトレードオフ・検討した別の選択肢を新しい決定に合わせる。別の選択肢には、前の決定（KGI・KSF・KPI を見出しで出す）と、核を開いた人だけが読む層に置く案を入れ、外した理由（性格の話は痛く見える、書き切らない方が聞きたい余白が残る）を書く
- 議論に 2026-10-23 の経緯を足す。前の KGI「みんなの役に立つ」と 2026-10-15 までの議論は消さない。核やその出どころの個人的な話は書かない

- [ ] **Step 2: ADR-016・詳細設計・前の仕様をそろえる**

- ADR-016 の「貼った紙は動かさない。動くのは About のスクロールで動く場面だけ」を「貼った紙は動かさない」にし、議論に「2026-10-23: About の動く場面を外した（→ ADR-008）」を一行足す
- `docs/design/redesign.md`: トップの並びの「5. About: スクロールで動く場面 → 人生の KGI・KSF・KPI の樹形図 → 根底の段落」を「5. About: 経験の年表」にし、「About の樹形図」「スクロールで動く場面（About の入口）」の節を、年表の節（新しい仕様へのリンクと、年表の4つの時期）に置き換える
- `docs/superpowers/specs/2026-10-15-redesign-design.md` の「E. About」の節の頭に「この節は [2026-10-23 の仕様](./2026-10-23-about-design.md) で置き換えた」と一行足す。本文は残す

- [ ] **Step 3: 残っている旧案の語を探す**

Run: `grep -rn "樹形図\|スクロールで動く\|goals.ts" docs/design docs/adr src`
Expected: 出てくるのは ADR-008・ADR-016 の議論（履歴）だけ

- [ ] **Step 4: コミット**

```bash
git -C /Users/wisteria/Projects/wisteria-io add docs/adr/adr-008-goal-visibility.md docs/adr/adr-016-paper-look.md docs/design/redesign.md docs/superpowers/specs/2026-10-15-redesign-design.md docs/superpowers/specs/2026-10-23-about-design.md docs/superpowers/plans/2026-10-23-about-timeline.md docs/guides/development-flow.md
git -C /Users/wisteria/Projects/wisteria-io commit -m "docs: About に人生の目標の構造を出さないと決め直す"
```

### Task 4: 初めて読む人の読みを確かめ、PR を出して止まる

**Files:** なし（確かめと PR）

- [ ] **Step 1: 全体の検証**

Run: `pnpm verify`
Expected: 最後まで通る（Lighthouse を含む）

- [ ] **Step 2: 初めて読む人の役で読ませる**

ビルドした `dist/index.html` の About とリンクの紙の文字を、3つの新しいエージェント（人事・エンジニア・大学の友人の役）にそれぞれ渡し、答えさせる。
1. 「痛い」「狙っている」と感じた行
2. 本人に何を聞きたくなったか
3. どの行でそう思ったか

- 「痛い」の指摘が言い回しだけなら、事実を変えずに平らに直し、Task 1 の検査を通し直す
- 聞きたいことが3人とも出なければ、ここで止め、結果と直す案を本人に渡す。行の入れ替えや、年表にない事実を足すことはしない

- [ ] **Step 3: push して PR を出す**

```bash
git -C /Users/wisteria/Projects/wisteria-io push -u origin feat/about-timeline
gh pr create --repo wisteriahuman/wisteria-io --base main --head feat/about-timeline --title "feat: About を、経験の年表だけにする" --body-file <scratchpad の PR 本文>
```

本文には、変えたこと、外したもの、Step 2 の3人の答えの要約、本人に staging で見てほしいところ（スマホと PC の About・リンクの紙）を書く。

- [ ] **Step 4: staging に出たのを確かめて止まる**

GitHub の verify と staging の job が通り、`https://staging.wisteria-io.com/` の About が年表になっていることを確かめる。本人に staging の確認を頼み、OK が出るまで merge しない。OK の後に `gh pr merge <番号> --repo wisteriahuman/wisteria-io --squash --delete-branch`、本番の About が年表になったことを確かめる
