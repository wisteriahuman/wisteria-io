# 段階②-a A・B（中身の文書と staging）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 人生の KGI・開発者ストーリー・ADR を確定させ、このリポジトリの PR を verify の後に `staging.wisteria-io.com` で確かめられるようにする。

**Architecture:** A は文書だけの PR。B は `serve.cjs` を環境変数で切り替えられる関数にし、`node --test` で検査する。CI に self-hosted の `staging` の job を足し、Mac mini で2つ目の `serve.cjs` を launchd で動かし、Cloudflare Tunnel に hostname を足す。

**Tech Stack:** Node 24（`node:test`・型の除去）、GitHub Actions、launchd、Cloudflare Tunnel（cloudflared）

**Spec:** [docs/superpowers/specs/2026-10-15-redesign-design.md](../specs/2026-10-15-redesign-design.md)（A・B の節）

C〜G の計画は、A・B を merge した後に別のファイルで書く。

## Global Constraints

- 変更は PR → verify → squash merge で入れる。main に直接 push しない
- コミットは `<種類>: <内容>`（日本語）、署名行を付けない
- git・gh の書き込みは `git -C /Users/wisteria/Projects/wisteria-io ...` のような単発のコマンドで実行する（`&&`・パイプ・`$` を含めない）。PR の本文は `--body-file`
- PR を出す前に手元で `pnpm verify` を通す
- 公開リポジトリ。選考中の企業名・日程・選考上の目標、就活軸の本文は書かない
- 2026-10-17 までは本番の見た目を変えない（A・B は見た目を変えない）
- launchd・Cloudflare Tunnel・DNS の変更は、Mac mini で実行する直前に本人に確認する
- fork からの PR のコードを自宅の機械で動かさない

## Review Focus

- `DIST` の外を指すパス（`/../portfolio-dist-x/index.html` のように、`DIST` と同じ文字で始まる隣のディレクトリ）: 403 を返す。今の `startsWith(DIST)` はこれを通してしまう → Task 4 に検査を足す
- 本番（`NOINDEX` なし）の応答: `X-Robots-Tag` が付かず、`/robots.txt` は `dist/robots.txt` をそのまま返す → Task 4 に検査を足す
- fork からの PR: `staging` の job が skipped になる → Task 5 で `if` の条件を固定し、Task 6 で PR 上の job の状態を確かめる
- 同じ PR に続けて push したとき: 古い staging の配置が止められても、配信中のディレクトリが空にならない → Task 5 で配置を「写してから入れ替え」にし、配置の最初に残骸（`.next`・`.prev`）を消す
- main への push: `staging` の job が skipped、`deploy` は今まで通り動く → Task 6 で merge 後の run を確かめる

---

## 区切り A: 中身の文書（PR 1本）

### Task 0: 設計書・仕様書・この計画を merge する

**Files:** `docs/design/redesign.md`・`docs/superpowers/specs/2026-10-15-redesign-design.md`・この計画（ブランチ `docs/redesign-design` にある）

- [ ] **Step 1:** `pnpm verify` を通し、計画をコミットする（`git -C … add docs/superpowers/plans/2026-10-15-redesign-a-b.md`、`git -C … commit -m "docs: 段階②-aのA・Bの実装計画を書く"`）
- [ ] **Step 2:** push して PR を出し（タイトル `docs: 段階②-aの設計と実装仕様を書く`）、verify の pass を確かめて squash で merge する

ブランチ: `docs/redesign-content`（Task 0 を merge した main から）

### Task 1: US-01 を「未計測」にする

**Files:**
- Modify: `docs/requirements/user-stories.md`（US-01 の受け入れ条件）
- Modify: `docs/requirements/README.md`（成功の条件の表の1行目）

**Interfaces:** なし（文書のみ）

- [ ] **Step 1: US-01 に計測の状態を足す**

`docs/requirements/user-stories.md` の US-01 の受け入れ条件の2行目の下に、次の行を足す:

```
  - 計測: 未計測。初見の人に見せる機会があれば測る（AI に画面を見せて代わりにする方法は、30秒で拾えるかを測れないため使わない）
```

- [ ] **Step 2: 要件の表に「未計測」を添える**

`docs/requirements/README.md` の表の1行目の目標の欄を `5人中4人以上` から `5人中4人以上（未計測）` にする。

- [ ] **Step 3: lint**

Run: `pnpm lint`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add docs/requirements/user-stories.md docs/requirements/README.md
git -C /Users/wisteria/Projects/wisteria-io commit -m "docs: US-01の30秒の指標が未計測であることを書く"
```

### Task 2: 開発者ストーリーを確定する

**Files:**
- Modify: `docs/requirements/developer-stories.md`

**Interfaces:** なし

- [ ] **Step 1: ステータスと書き方を変える**

- 冒頭の `ステータス: 下書き。段階②-a で確定させる。` を `ステータス: 確定（2026-10-15）。各ストーリーの「状態」は、達成したら根拠を添えて更新する。` にする
- 「書き方」のコードブロックの最後に `- 状態: 達成 | 一部達成 | 未着手（根拠: PR・検査・ファイル）` を足す

- [ ] **Step 2: DS-01〜08 に状態を足す**

各ストーリーの `- 段階:` の行の下に、次の行を足す（文言は意味を変えずに読みやすさだけ見直す。見直す箇所が無ければそのまま）:

- DS-01: `- 状態: 一部達成。Markdown 1ファイルで完結し、OGP は自動で作られる（src/pages/og/）。push から本番までの時間はまだ測っていない`
- DS-02: `- 状態: 達成。src/data/ から最初の画面・経歴・OGP を作り、pnpm check で食い違いを検出する（scripts/check-dist.mjs）`
- DS-03: `- 状態: 達成。判断は ADR-001〜017 にあり、docs/README.md から辿れる`
- DS-04: `- 状態: 未着手（段階②-c）`
- DS-05: `- 状態: 達成。.node-version と packageManager で固定し、手順は guides/setup.md（ADR-012）`
- DS-06: `- 状態: 達成。置き場所の規則は rules/code-structure.md`
- DS-07: `- 状態: 達成。pnpm verify が型検査・リント・ビルド・ビルド結果の検査・Lighthouse を走らせ、CI も同じコマンドを使う（ADR-010・ADR-011）`
- DS-08: `- 状態: 達成。一覧は adr/README.md、ADR を伴わせる規則は rules/docs.md`

- [ ] **Step 3: DS-09〜12 を足す**

「## 自分」の DS-05 の後に DS-09・DS-10・DS-11 を、「## AI エージェント」の DS-08 の後に DS-12 を、既存と同じ書き方で足す:

```markdown
### DS-09: 自宅が止まってもサイトが見られ続ける
- ペルソナ: 自分
- ストーリー: 自分として、自宅の機械が止まっても、何もしないうちにサイトが見られ続けてほしい。旅行中や就活中に止まっても、見る人を待たせないため
- 受け入れ条件:
  - 自宅が止まると、予備（AWS）に自動で切り替わる
  - 月間稼働率 99.9%
- 段階: ②
- 状態: 未着手（段階②-c）

### DS-10: PR を開けば本番の前に見た目を確かめられる
- ペルソナ: 自分
- ストーリー: 自分として、PR を開いたら、本番に出す前にその見た目を確かめたい。見た目の崩れを本番で初めて知ることがないようにするため
- 受け入れ条件:
  - このリポジトリから出た PR は、verify の後に staging に出る
  - staging は検索に載らない
- 段階: ②
- 状態: 未着手（段階②-a の B で達成にする）

### DS-11: 構成図を手で描かずに済む
- ペルソナ: 自分
- ストーリー: 自分として、インフラの構成図を手で描かずに、実際の構成から作りたい。図と実物が食い違わないようにするため
- 受け入れ条件:
  - `/infra` の構成図が、マニフェスト・Terraform から生成される
- 段階: ②
- 状態: 未着手（段階②-d）
```

```markdown
### DS-12: 部品を足しても、判断へのリンクを手で書かずに済む
- ペルソナ: AI エージェント
- ストーリー: AI エージェントとして、セクションや部品を足したとき、それを決めた PR と ADR へのリンクを手で書かずに済ませたい。リンクの書き漏れで「この部分の作り」が嘘にならないようにするため
- 受け入れ条件:
  - PR は git の履歴から自動で拾われる
  - ADR とファイルの対応は1か所に書かれ、抜けを `pnpm check` で検出できる
- 段階: ②
- 状態: 未着手（段階②-a の D で達成にする）
```

- [ ] **Step 4: lint と Commit**

Run: `pnpm lint`
Expected: エラーなし

```bash
git -C /Users/wisteria/Projects/wisteria-io add docs/requirements/developer-stories.md
git -C /Users/wisteria/Projects/wisteria-io commit -m "docs: 開発者ストーリーを確定し、状態と根拠を書く"
```

### Task 3: ADR-008 を更新し、ADR-015〜017 を書く

**Files:**
- Modify: `docs/adr/adr-008-goal-visibility.md`
- Create: `docs/adr/adr-015-staging.md`
- Create: `docs/adr/adr-016-paper-look.md`
- Create: `docs/adr/adr-017-build-notes-from-git.md`
- Modify: `docs/adr/README.md`（一覧に3行と、ADR-008 の題名）

**Interfaces:** なし

- [ ] **Step 1: ADR-008 を書き換える**

- 題名はそのまま。日付を `2026-10-15` にする
- 決定事項を次の4つにする:
  - 人生の KGI → KSF → KPI を About に置き、「人生の KGI」「KSF」「KPI」を見出しとして出す。用語は見出しに1回ずつだけ使い、文章の中では繰り返さない
  - このサイトの目的 → 成功の条件 → 指標は要件書（`requirements/README.md`）に残す。`/infra` では指標の数字だけを見せ、KGI という言葉は使わない
  - 選考上の目標はどこにも出さない
  - 根底にある考え（KGI の理由）は、本人が自分の言葉で書けるまで置かない
- 理由に足す: 一文だけを置くと標語に見えるが、KGI として下に KSF・KPI がつながっていれば、目標として読まれる
- 受け入れるトレードオフに足す: KGI・KSF という用語を表に出すので、くどく見えないよう見出しに限る
- 検討した別の選択肢に足す: **「人生の KGI」だけを見出しにし、下は普通の言葉で書く**: 用語は減るが、3段の構造が見えにくい
- 議論に足す:
  - `2026-10-15: 最初は「2つの構造を同じ形にそろえる」としていたが、このサイトの KGI は表に出さなくてよいと判断し、外した`
  - `2026-10-15: KGI は「みんなの役に立つ」。最初の下書き「考え抜くことで、より大きな課題を解決できる人になる」は在り方（KSF）を KGI の位置に置いていたため浅く感じた`

- [ ] **Step 2: ADR-015 を書く**

`docs/adr/TEMPLATE.md` の形で `docs/adr/adr-015-staging.md` を作る:
- 題: `ADR-015: 本番の前の確認に、PR ごとの staging を使う`、ステータス: 採用、日付: 2026-10-15
- 背景: 段階②-a で見た目を作り直す。main への merge がそのまま本番に出るので、見た目は本番の前に別の場所で確かめたい。2026-10-17 のイベントの前後は本番を崩したくない
- 決定事項:
  - このリポジトリから出た PR（fork でないもの）は、verify が通ったら self-hosted runner で `staging.wisteria-io.com` に配置する。最後に push された PR で上書きする
  - staging は `serve.cjs` の2つ目のプロセス（ポート 4322、`/Users/wisteria/portfolio-staging`）で配り、すべての応答に `X-Robots-Tag: noindex, nofollow` を付け、`/robots.txt` は `Disallow: /` を返す
  - Cloudflare Tunnel の設定に hostname を足して公開する
  - fork からの PR では staging の job を動かさない（`github.event.pull_request.head.repo.full_name == github.repository`）
- 理由: 長く残すブランチを作らず、今の「ブランチ → PR → merge」の流れのまま確かめられる。このリポジトリに push できるのは本人だけなので、自宅の機械で動くのは身元の確かなコードに限られる
- 受け入れるトレードオフ: staging は URL を知っていれば誰でも見られる（検索には載らない）。PR が複数あるときは、最後に push したものしか見られない。launchd の設定は Mac mini に手で入れる（段階②-c で配信基盤ごと置き換えるまでのつなぎ）
- 別の選択肢: **develop ブランチ**: squash で merge するたびに履歴がずれ、衝突しやすい。**手元の `pnpm preview` だけ**: スマホの実機や他の人に見せられない。**PR ごとに別の URL**: 見比べられるが、自宅の機械に PR の数だけ配置が増える
- 参考: [ADR-011](./adr-011-pr-and-ci.md)、[Cloudflare Tunnel: ingress rules](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/configuration-file/)

- [ ] **Step 3: ADR-016 を書く**

`docs/adr/adr-016-paper-look.md`:
- 題: `ADR-016: 見た目を紙の質感にする`、ステータス: 採用、日付: 2026-10-15
- 背景: 段階①は暗い配色を保った。段階②-a で、表は普通の自己紹介に見せ、その下に作りの証拠を置く方針にした（[アイデアソン](../ideathon/2026-10-15-design.md)）。ui-ux-pro-max で3つの方向を出し、スマホ幅の試作で比べた
- 決定事項: 生成りの地・墨の文字・罫線。見出しは明朝、本文はゴシック（日本語は端末のフォント、ADR-009）。角は 6〜8px 丸め、チップは薄い面にする。明るい紙だけにし、ダークは作らない。動きはセクションが少し浮き上がって出る程度と、About の1場面だけ
- 理由: 紙と罫線が「記録」の手触りになり、演出を足さずに「作り方の証拠」というテーマに合う。表が普通であるほど、「この部分の作り」を開いたときの驚きが大きい。明るい紙1つに絞ると、コントラストの確認が1回で済む
- 受け入れるトレードオフ: OS のダーク設定の人にも明るい画面を出す。明朝は端末によって字形が変わる（ヒラギノ明朝・游明朝・Noto Serif CJK）
- 別の選択肢: **スイス・ミニマル（白地・黒の罫線・等幅の見出し）**: 表が一番普通に見えるが、角張った線が初期表示のように見え、作っていない印象を与える。**暗い配色の延長**: 無難だが、よく見る形。**スライドのように1画面ずつ切り替える**: 長いセクションが読めず、人事の30秒の邪魔になる
- 参考: [設計](../design/redesign.md)、ui-ux-pro-max の E-Ink / Paper

- [ ] **Step 4: ADR-017 を書く**

`docs/adr/adr-017-build-notes-from-git.md`:
- 題: `ADR-017: 「この部分の作り」の PR は、ビルド時に git の履歴から拾う`、ステータス: 採用、日付: 2026-10-15
- 背景: 各セクションの「この部分の作り」に、そのセクションを変えた最近の PR を出す。手で書くと書き漏れて、証拠が嘘になる
- 決定事項: main は squash で merge し、件名の末尾に `(#N)` が付く。ビルド時にファイルごとの `git log` から `(#N)` を拾い、新しい順に3件出す。セクションと ADR・ファイルの対応は `src/data/build-notes.ts` の1か所に書き、`pnpm check` で抜けを検出する。git が使えないときはビルドを失敗させる。CI はチェックアウトの履歴を全部取る（`fetch-depth: 0`）
- 理由: GitHub の API を使わないので、ビルドがネットワークとトークンに依存しない。squash の決まり（ADR-011）がそのまま材料になる
- 受け入れるトレードオフ: CI のチェックアウトが少し遅くなる。squash 以外で入ったコミット（PR を経ない昔のコミット）は出ない
- 別の選択肢: **GitHub の API**: PR の本文やラベルも取れるが、ビルドにトークンとネットワークが要る。**手で書く**: 書き漏れる
- 参考: [ADR-011](./adr-011-pr-and-ci.md)、DS-12

- [ ] **Step 5: 一覧を更新する**

`docs/adr/README.md` の表で ADR-008 の題名を確かめ（変えていなければそのまま）、ADR-014 の行の下に足す:

```
| [ADR-015](./adr-015-staging.md) | 本番の前の確認に、PR ごとの staging を使う | 採用 |
| [ADR-016](./adr-016-paper-look.md) | 見た目を紙の質感にする | 採用 |
| [ADR-017](./adr-017-build-notes-from-git.md) | 「この部分の作り」の PR は、ビルド時に git の履歴から拾う | 採用 |
```

- [ ] **Step 6: verify と Commit**

Run: `pnpm verify`
Expected: 最後に `Done running autorun.`、終了コード 0

```bash
git -C /Users/wisteria/Projects/wisteria-io add docs/adr
git -C /Users/wisteria/Projects/wisteria-io commit -m "docs: ADR-008を更新し、staging・紙の見た目・作りの層のADRを書く"
```

- [ ] **Step 7: PR を出して merge する**

- PR の本文をスクラッチパッドに書き、`gh pr create --base main --head docs/redesign-content --title "docs: 人生のKGIと開発者ストーリーを確定し、ADRを更新する" --body-file <パス>`
- `gh pr checks <N> --watch` で verify の pass を確かめ、`gh pr merge <N> --squash --delete-branch`

---

## 区切り B: staging（PR 1本）

ブランチ: `ci/staging`（A を merge した main から）

### Task 4: serve.cjs を設定で切り替えられるようにし、検査を足す

**Files:**
- Modify: `serve.cjs`
- Create: `scripts/serve.test.cjs`
- Modify: `package.json`（`test` を足し、`verify` に入れる）

**Interfaces:**
- Produces: `serve.cjs` が `module.exports = { createServer }` を出す。`createServer({ dist: string, noindex: boolean }): http.Server`。`node serve.cjs` で直接動かしたときだけ `listen` する。環境変数 `DIST`（既定 `/Users/wisteria/portfolio-dist`）・`PORT`（既定 `4321`）・`NOINDEX`（`1` のとき真）

- [ ] **Step 1: 失敗する検査を書く**

`scripts/serve.test.cjs`:

```js
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
```

`package.json` の scripts に足す（`verify` は `check` の後に `test` を入れる）:

```json
"test": "node --test 'scripts/*.test.cjs'",
"verify": "pnpm typecheck && pnpm lint && pnpm build && pnpm check && pnpm test && pnpm lighthouse"
```

- [ ] **Step 2: 失敗を確かめる**

Run: `pnpm test`
Expected: FAIL（`createServer is not a function`。今の serve.cjs は何も export せず、読み込んだ時点で 4321 を listen しようとする）

- [ ] **Step 3: serve.cjs を書き換える**

```js
// dist/ を配る静的サーバー。本番は既定値のまま、staging は環境変数で配る場所と検索よけを切り替える（ADR-015）
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain',
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
    if (noindex && urlPath === '/robots.txt') {
      send(res, 200, 'text/plain', DISALLOW_ALL);
      return;
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    if (!path.extname(urlPath)) urlPath += '/index.html';

    const filePath = path.join(root, urlPath);
    // root と同じ文字で始まる隣のディレクトリに出られないよう、区切り文字まで含めて比べる
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      send(res, 403, 'text/plain', 'Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (!err) {
        send(res, 200, typeOf(filePath), data);
        return;
      }
      const alt = filePath.replace(/\/index\.html$/, '.html');
      fs.readFile(alt, (err2, data2) => {
        if (!err2) {
          send(res, 200, typeOf(alt), data2);
          return;
        }
        fs.readFile(path.join(root, '404.html'), (_, d404) => {
          send(res, 404, 'text/html', d404 || 'Not Found');
        });
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
```

- [ ] **Step 4: 検査が通ることを確かめる**

Run: `pnpm test`
Expected: 6件すべて pass

- [ ] **Step 5: lint**

Run: `pnpm lint`
Expected: エラーなし（整形の差分が出たら `pnpm format`）

- [ ] **Step 6: Commit**

```bash
git -C /Users/wisteria/Projects/wisteria-io add serve.cjs scripts/serve.test.cjs package.json
git -C /Users/wisteria/Projects/wisteria-io commit -m "feat: 配信サーバーを設定で切り替えられるようにし、stagingで検索よけを付ける"
```

### Task 5: CI に staging の job を足し、launchd の設定と手順を置く

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `deploy/launchd/com.wisteria.portfolio-staging.plist`
- Create: `docs/guides/staging.md`
- Modify: `docs/guides/development-flow.md`（手順4に staging を足す）
- Modify: `docs/rules/code-structure.md`（`deploy/` の行を足す）

**Interfaces:**
- Consumes: Task 4 の `serve.cjs`（環境変数 `DIST`・`PORT`・`NOINDEX`）
- Produces: artifact `dist`（PR でも上がる）、job `staging`

- [ ] **Step 1: ci.yml を変える**

`verify` の job の「Upload dist」の `if` を次にする:

```yaml
      # 検証したビルド結果を、そのまま本番・staging に出す
      - name: Upload dist
        if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
```

`deploy` の job の前に足す:

```yaml
  staging:
    needs: verify
    # このリポジトリから出た PR だけを staging に出す。fork からの PR のコードは自宅の機械で動かさない（ADR-015）
    if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository
    runs-on: self-hosted
    # 同じ PR に続けて push したら、古い配置はやめて新しい方を出す
    concurrency:
      group: staging
      cancel-in-progress: true
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist

      # 本番と同じく、別の場所へ写してから入れ替える。途中で止められた配置の残骸は最初に消す
      - name: Deploy to staging
        run: |
          set -eu
          target=/Users/wisteria/portfolio-staging
          rm -rf "$target.next" "$target.prev"
          cp -R dist "$target.next"
          if [ -d "$target" ]; then mv "$target" "$target.prev"; fi
          mv "$target.next" "$target"
          rm -rf "$target.prev"
          echo "Staged PR #${{ github.event.pull_request.number }} at $(date)"
```

ファイル冒頭のコメントを次にする:

```yaml
# 検証は GitHub のマシンで PR と main への push の両方に走らせる。
# このリポジトリから出た PR は、検証が通った後に自宅の Mac mini の staging に出す（ADR-015）。
# 本番へのデプロイは main への push のときだけ、検証が通った後に Mac mini で行う（ADR-011）
```

- [ ] **Step 2: launchd の設定を置く**

`deploy/launchd/com.wisteria.portfolio-staging.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- staging.wisteria-io.com を配る serve.cjs（ADR-015）。手順は docs/guides/staging.md -->
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.wisteria.portfolio-staging</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/wisteria/portfolio-serve/serve.cjs</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>DIST</key>
        <string>/Users/wisteria/portfolio-staging</string>
        <key>PORT</key>
        <string>4322</string>
        <key>NOINDEX</key>
        <string>1</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/portfolio-staging.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/portfolio-staging.log</string>
</dict>
</plist>
```

- [ ] **Step 3: 手順書を書く**

`docs/guides/TEMPLATE.md` の形で `docs/guides/staging.md` を作る。中身:
- 概要: PR の見た目を `https://staging.wisteria-io.com` で確かめる仕組みと、Mac mini に一度だけ入れる設定（ADR-015）
- 使い方: このリポジトリにブランチを push して PR を出すと、verify の後に staging の job が動く。最後に push した PR が出る。どの PR が出ているかは、Actions の staging の job のログ（`Staged PR #N`）で分かる
- Mac mini への設定（一度だけ。本人の確認を取ってから行う）:
  1. `mkdir -p /Users/wisteria/portfolio-serve /Users/wisteria/portfolio-staging`
  2. リポジトリの `serve.cjs` を `/Users/wisteria/portfolio-serve/serve.cjs` に写す
  3. `deploy/launchd/com.wisteria.portfolio-staging.plist` を `~/Library/LaunchAgents/` に写し、`launchctl load ~/Library/LaunchAgents/com.wisteria.portfolio-staging.plist`
  4. `~/.cloudflared/config.yml` の ingress の `http_status:404` の行より前に `- hostname: staging.wisteria-io.com` と `service: http://localhost:4322` を足す
  5. `cloudflared tunnel route dns a2b8a85d-99fb-4810-8d72-e9ba530d0af6 staging.wisteria-io.com`
  6. `launchctl kickstart -k gui/$(id -u)/com.wisteria.cloudflared` で Tunnel を読み直す
- 確かめ方: `curl -sI https://staging.wisteria-io.com/` に `x-robots-tag: noindex, nofollow` が付く。`curl -s https://staging.wisteria-io.com/robots.txt` が `Disallow: /`。本番の `curl -sI https://wisteria-io.com/` には付かない
- トラブルシューティング: 502 が出る → `launchctl list | grep portfolio-staging` と `/tmp/portfolio-staging.log`。古い見た目のまま → staging の job が skipped（fork からの PR）か、別の PR が後から push された

- [ ] **Step 4: 開発の流れと置き場所の規則に足す**

- `docs/guides/development-flow.md` の手順4の「3. PR を出す…」の下に `   - このリポジトリから出した PR は、verify の後に https://staging.wisteria-io.com に出る。見た目を変える PR は、merge の前にここで確かめる（→ [staging](./staging.md)）` を足す
- `docs/rules/code-structure.md` の表の `scripts/` の行の下に足す: `| \`deploy/\` | 自宅の機械に入れる設定 | 例: staging の launchd の設定（\`deploy/launchd/\`）。入れ方は [staging](../guides/staging.md) |`

- [ ] **Step 5: verify と Commit**

Run: `pnpm verify`
Expected: 終了コード 0（`pnpm test` の6件も pass）

```bash
git -C /Users/wisteria/Projects/wisteria-io add .github/workflows/ci.yml deploy docs/guides docs/rules/code-structure.md
git -C /Users/wisteria/Projects/wisteria-io commit -m "ci: このリポジトリのPRを検証の後にstagingへ出す"
```

### Task 6: Mac mini に入れ、PR で staging を確かめて merge する

**Files:**
- Modify: `docs/requirements/developer-stories.md`（DS-10 の状態）

**Interfaces:**
- Consumes: Task 5 の plist・手順書、Task 4 の serve.cjs

- [ ] **Step 1: 本人に確認する**

`docs/guides/staging.md` の「Mac mini への設定」の6つの手順を示し、実行してよいか本人に確認する。了承が無ければ止める。

- [ ] **Step 2: Mac mini に入れる**

この機械（MacBook Air）から `ssh mac-mini` で、手順書の1〜6を1つずつ実行する。`serve.cjs` と plist は `scp` で写す。各手順の後に結果を確かめる（`launchctl list | grep portfolio-staging` が PID を持つ、`curl -sI http://localhost:4322/` が応答する）。`/Users/wisteria/portfolio-staging` が空のうちは 404 でよい。

- [ ] **Step 3: push して PR を出す**

```bash
git -C /Users/wisteria/Projects/wisteria-io push -u origin ci/staging
```

PR: `gh pr create --base main --head ci/staging --title "ci: このリポジトリのPRを検証の後にstagingへ出す" --body-file <パス>`

- [ ] **Step 4: staging を確かめる**

- `gh pr checks <N> --watch` で verify と staging が pass、deploy が skipped
- `curl -sI https://staging.wisteria-io.com/` が 200 で `x-robots-tag: noindex, nofollow`
- `curl -s https://staging.wisteria-io.com/robots.txt` が `User-agent: *` と `Disallow: /`
- `curl -sI https://wisteria-io.com/` に `x-robots-tag` が無い

- [ ] **Step 5: DS-10 を達成にする**

DS-10 の `- 状態:` を `- 状態: 達成。このリポジトリの PR は verify の後に staging に出て、noindex が付く（ADR-015、PR #<N>）` にし、Commit・push する:

```bash
git -C /Users/wisteria/Projects/wisteria-io add docs/requirements/developer-stories.md
git -C /Users/wisteria/Projects/wisteria-io commit -m "docs: DS-10を達成にする"
git -C /Users/wisteria/Projects/wisteria-io push
```

- [ ] **Step 6: merge して main の run を確かめる**

- `gh pr merge <N> --squash --delete-branch`
- main の run で verify・deploy が success、staging が skipped
- 本番 `https://wisteria-io.com/` が 200
