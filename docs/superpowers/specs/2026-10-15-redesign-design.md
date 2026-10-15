# 段階②-a サイトの作り直し 実装仕様

- 日付: 2026-10-15
- 入力: [設計（ui-grill の合意）](../../design/redesign.md)、grilling の合意（2026-10-15）、アイデアソンの記録（[デザイン](../../ideathon/2026-10-15-design.md)・[スクロールで動く場面](../../ideathon/2026-10-15-scroll-scene.md)）
- 前提: 変更は PR → verify → squash merge で入れる（[ADR-011](../../adr/adr-011-pr-and-ci.md)）

## 目的
表は30秒で読める普通の自己紹介のまま、その下に「このサイトそのものが作り方の証拠」になっている層を置く。あわせて、人生の KGI・KSF・KPI と開発者ストーリーを確定させ、PR ごとに本番の前の見た目を確かめられるようにする。

## 範囲

やる:
- A. 中身の文書（要件・開発者ストーリー・ADR）
- B. staging（PR ごとの確認用の環境）
- C. 見た目の土台（紙の質感）
- D. 作りの層（「この部分の作り」と「この記事の履歴」）
- E. About（スクロールで動く場面と樹形図）
- F. 作品ページ
- G. リンク欄（共有・AI エージェント向けの説明）

やらない:
- 配信基盤の移行（段階②-c）。`serve.cjs` は B で設定を外から渡せるようにするだけで、置き換えない
- `/infra`（段階②-d）
- 根底の段落の文章（本人が書くまで置かない）

## 進め方
- 1つの区切りを1つの PR にし、A → B → C → D → E → F → G の順に出す
- A と B は見た目を変えないので、すぐに merge してよい
- C 以降の PR は、merge の前に staging で見た目を確かめてもらう

## A. 中身の文書

### 要件
- `requirements/user-stories.md` の US-01: 受け入れ条件の「5人中4人以上」はそのまま残し、「計測: 未計測（人に見せる機会があれば測る）」を足す
- `requirements/README.md` の成功の条件の表で、30秒の指標に「未計測」と添える

### 開発者ストーリー（`requirements/developer-stories.md`）
- 冒頭の「ステータス: 下書き」を「ステータス: 確定（2026-10-15）」にする
- 書き方に「状態」の欄を足す: `達成`・`一部達成`・`未着手` と、その根拠（PR・検査・ファイル）
- 既存の DS-01〜08 の状態:
  - DS-01: 一部達成。Markdown 1ファイルで完結・OGP 自動生成は済み。「push から本番まで10分以内」は計測の仕組みがまだ無い
  - DS-02: 達成。`src/data/` から最初の画面・経歴・OGP を作り、`pnpm check` で確かめている
  - DS-03: 達成。ADR-001〜014 と `docs/README.md`
  - DS-04: 未着手（段階②-c）
  - DS-05: 達成。`.node-version`・`packageManager`・`guides/setup.md`（ADR-012）
  - DS-06: 達成。`rules/code-structure.md`
  - DS-07: 達成。`pnpm verify` と CI（ADR-010・ADR-011）
  - DS-08: 達成。`adr/README.md` と `rules/docs.md`
- 足すストーリー:
  - DS-09（自分）: 自宅の機械が止まっても、何もしないうちにサイトが見られ続ける。受け入れ条件: 自宅が止まると予備に自動で切り替わる、月間稼働率 99.9%。段階②-c。状態: 未着手
  - DS-10（自分）: PR を開けば、本番の前に見た目を確かめられる。受け入れ条件: このリポジトリの PR は verify の後に staging に出る、staging は検索に載らない。段階②-a。状態: B で達成にする
  - DS-11（自分）: 構成図を手で描かずに、実際の構成から作られる。受け入れ条件: `/infra` の構成図がマニフェスト・Terraform から生成される。段階②-d。状態: 未着手
  - DS-12（AI エージェント）: 部品を足したとき、その部品を決めた PR・ADR へのリンクを手で書かずに済む。受け入れ条件: PR は git の履歴から自動で拾われる、ADR とファイルの対応は1か所に書き、`pnpm check` で抜けを検出する。段階②-a。状態: D で達成にする
- 既存の文言は、意味を変えずに読みやすさだけ見直す

### ADR
- ADR-008 を更新する（ステータスは採用のまま、日付を更新し、議論に経緯を書く）
  - 人生の KGI・KSF・KPI は About に、用語ごと見出しにして出す
  - このサイトの目的と指標は要件書（リポジトリ）に残す。`/infra` では指標の数字だけ見せる
  - 「2つの構造を同じ形にそろえる」は外す
  - 選考上の目標はどこにも出さない（変えない）
- ADR-015: 本番の前の確認に、PR ごとの staging を使う（別の選択肢: develop ブランチ、手元の preview だけ）
- ADR-016: 見た目を紙の質感にする（別の選択肢: スイス・ミニマル、暗い配色の延長）
- ADR-017: 「この部分の作り」の PR は、ビルド時に git の履歴から拾う（別の選択肢: GitHub の API、手で書く）
- ADR の一覧（`adr/README.md`）に足す

### 人生の KGI・KSF・KPI のデータ
E で使う。中身は次のとおり（`src/data/goals.ts`）。
- KGI: みんなの役に立つ
- KSF と KPI:
  1. 新しいことを吸収し続けて成長し、成果を出す → Go College ベストエンジニアリング賞・ハッカソン受賞3回・FISH で作ったものが今も大学で使われている
  2. 理念が日々の行動にまで表れている人たちと働く → このサイトの全変更が、自分で決めた規則（ADR・自動検証）を通っている・最新の PR
  3. 考え続ける → AtCoder 水色・ICPC 2025 横浜・判断の記録（ADR の本数）
- 受賞・評価・ADR の本数は、既存のデータ（`career.ts`・`profile.ts`）と `docs/adr/` から作り、2か所に書かない（DS-02）
- ADR の本数は `docs/adr/adr-*.md` の数、最新の PR はリポジトリ全体の `git log` で最初に `(#N)` が付いたコミットから作る（D の `src/lib/history.ts` を使う）

## B. staging

### CI（`.github/workflows/ci.yml`）
- `verify` の job: PR でも `dist/` を artifact として上げる
- `staging` の job（新規）: `needs: verify`、`runs-on: self-hosted`
  - 条件: `github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository`（fork からの PR では動かない）
  - `concurrency: { group: staging, cancel-in-progress: true }`（新しい push が来たら古い配置をやめる）
  - 配置先: `/Users/wisteria/portfolio-staging`。本番と同じく、別の場所に写してから入れ替える
- 本番の `deploy` の job は変えない

### 配信
- `serve.cjs`: 配る場所・ポート・検索よけを環境変数で受け取れるようにする（`DIST`・`PORT`・`NOINDEX`）。既定値は今の本番の値のまま
- `NOINDEX=1` のとき、すべての応答に `X-Robots-Tag: noindex, nofollow` を付け、`/robots.txt` は `Disallow: /` を返す
- Mac mini に staging 用の launchd の設定（ポート 4322・`/Users/wisteria/portfolio-staging`・`NOINDEX=1`）を置く。設定ファイルはリポジトリの `deploy/launchd/` に置き、Mac mini には手で入れる
- Cloudflare Tunnel の設定に `staging.wisteria-io.com → http://localhost:4322` を足し、DNS の経路を作る（`cloudflared tunnel route dns`）
- launchd・Tunnel・DNS の変更は、Mac mini で実行する直前に本人に確認する

### 確かめ方
- この PR 自体で staging の job が動き、`https://staging.wisteria-io.com/` が開ける
- 応答に `X-Robots-Tag: noindex, nofollow` が付き、`/robots.txt` が `Disallow: /` を返す
- 本番の応答には付かない
- main への push では staging の job が動かない（skipped）

## C. 見た目の土台

### 色とトークン（`src/styles/global.css`）
- 地: 生成り（`#FDFBF7` 前後）、文字: 墨（`#1A1A1A` 前後）、罫線、薄い面（チップ・カード）、リンクの色を `@theme` のトークンにする。今の暗い配色のトークンは消す
- 文字と地のコントラストは 4.5:1 以上。トークンを決めたら比を計算して仕様の検査に入れる
- 明るい紙だけにする（ダークは作らない）

### 文字
- 見出しは明朝、本文はゴシック。日本語は端末のフォントを使い、Web フォントは足さない（ADR-009）
  - 明朝: `"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", serif`
  - ゴシック: 今の本文の並びのまま
- 等幅（JetBrains Mono）は、日付・番号・「この部分の作り」のラベルにだけ使う。名前には使わない

### 形と動き
- 角は 6〜8px。チップは線ではなく薄い面
- 背景の罫線は、最初の画面でははっきり、ほかのセクションでは薄くする
- セクションが画面に入るとき、少しだけ浮き上がって出る（CSS の `animation-timeline: view()`）。`prefers-reduced-motion: reduce` と、対応しないブラウザでは動かさず最初から出す
- 見た目を変えるのは、トップ・ブログ一覧・記事・OGP 画像の配色。中身と順番は変えない

### 確かめ方
- `pnpm verify` が通る（Lighthouse の Accessibility 100 でコントラストも確かめる）
- 幅 390px と 1280px で全セクションを撮り、横スクロールが無いこと（`scrollWidth` が画面幅と同じ）を確かめる
- staging で本人に見てもらう

## D. 作りの層

### 対応表（`src/data/build-notes.ts`）
- セクション（`top`・`experience`・`projects`・`skills`・`about`・`links`）ごとに、決めた ADR の番号と、コードのファイルの一覧を書く
- ADR の題名は `docs/adr/` のファイルの1行目から作り、手で書かない

### 履歴（`src/lib/history.ts`）
- ビルド時に `git log --format=%s -- <ファイル>` を実行し、件名の末尾の `(#N)` から PR の番号と件名を拾う。新しい順に重複を除き、3件まで
- PR が1件も無いときは空の配列を返す。git が使えない環境では失敗させる（黙って空にしない）
- PR の URL は `https://github.com/wisteriahuman/wisteria-io/pull/N`

### 部品
- `BuildNote.astro`: `<details>` で「この部分の作り」を出す。中身は ADR（題名つきリンク）・コードのファイル（GitHub へのリンク）・最近の PR 3件。PR が無ければ「まだ変更の記録がない」
- 各セクションの最後（右下）に置く
- ブログの記事の末尾に「この記事の履歴」（記事のファイルを変えた PR。同じ部品を使う）

### CI
- `actions/checkout` に `fetch-depth: 0` を足す（verify の job）

### 確かめ方
- `pnpm check` に足す: すべてのセクションに「この部分の作り」があり、ADR のリンクが1つ以上ある。対応表のファイルが実在する
- `src/lib/history.ts` に、件名から PR を拾う処理の単体の検査を足す（`(#12)` あり・なし・重複）

## E. About

### 樹形図
- `src/data/goals.ts` から、入れ子のリスト（KGI → KSF → KPI）を作る
- CSS で木の図に見せる。幅 900px 以上は横に枝分かれ、それ未満は縦
- 見出しは「人生の KGI」「KSF」「KPI」。用語は見出しに1回ずつだけ使う
- KPI のうち、受賞・評価は経歴の該当の位置（`#career-<id>`）に、最新の PR は PR のページにリンクする

### スクロールで動く場面
- About の入口に、`position: sticky` の舞台を置く。高さは画面3つ分ほどのスクロールの区間
- 舞台はインラインの SVG。順に: 作ったものの図と作者の手 → 手が離れ、名前が薄れる → 使う人の点が増える → 視点が引いていき、大学・街・全員の輪郭が出る → KGI「みんなの役に立つ」の文字が収まる
- 動きは CSS の `animation-timeline: view()` / `scroll()` だけで作る。JS は使わない
- 使う人の点は抽象的に描き、人数を表すものに見せない
- `prefers-reduced-motion: reduce` と、対応しないブラウザでは、舞台を固定せず、最後の状態（KGI の文字）を静止して出す
- スマホでも同じ場面を出すが、点の数を減らす
- 場面の直後に樹形図が続く

### 確かめ方
- `pnpm verify` が通る（Performance 95 以上を保つ）
- 動きを減らす設定（Playwright の `reducedMotion: 'reduce'`）で撮り、KGI の文字が見えていることを確かめる
- 幅 390px と 1280px で、スクロールの途中を数か所撮って確かめる

## F. 作品ページ

### データ
- `src/data/projects.ts` に、作品ページ用の項目を足す: `purpose`（何を作ったか・誰のためか）、`role`（自分の役割）、`result`（結果）、`decisions`（判断の一覧。各項目は選んだもの・理由・捨てた案）
- 中身の無い項目は省略できる型にする

### ページ
- `src/pages/works/[id].astro`。URL は `/works/<id>`
- 上に「作品一覧に戻る」（`/#project-<id>`）
- 順番: 何を作ったか → 自分の役割 → 結果 → 判断 → リンク（GitHub・デモ）→ この部分の作り
- 中身の無い項目は見出しごと出さない
- OGP は作品の題名で作る（ブログの OGP と同じ仕組み）
- トップの作品カードは、カード全体を作品ページへのリンクにし、各カードに `id="project-<id>"` を付ける

### 文章の書き方
- 書く前に事実を確かめる。各作品のリポジトリ（README・コミット・Issue）と既存の `desc` から事実を拾い、確かめられないこと（役割の範囲・判断の理由・今の状態）は、書く前に本人に聞く。確かめた事実だけを書く
- チームの成果を自分の成果として書かない。役割の書き方は本人が決める
- インターン先の社内のことは書かない

### 確かめ方
- `pnpm check` に足す: 5作品すべてのページがあり、トップのカードが作品ページにリンクしている
- 作品ページを Lighthouse の対象に1つ足す

## G. リンク欄

### 共有
- `src/data/profile.ts` の要約と URL から文面を作る: 「藤井 優気（28卒・公立はこだて未来大学）Go College ベストエンジニアリング賞・ハッカソン受賞3回・ICPC 2025 横浜 https://wisteria-io.com」
- 「共有」ボタン: `navigator.share` があれば共有シート、無ければクリップボードにコピーし「コピーしました」と出す。小さなインラインの JS
- JS が無いときは、ボタンの代わりに文面そのものを出す（`<noscript>` ではなく、JS が動いたらボタンに差し替える）

### AI エージェント向けの説明
- `src/pages/llms.txt.ts`: ビルド時に `src/data/` から作る。名前・所属・実績・作品・リポジトリと `docs/` へのリンク
- リンク欄に「AI エージェント向けの説明」として `/llms.txt`、リポジトリの `CLAUDE.md`・`docs/` へのリンクを並べ、「このリポジトリは AI エージェントも開発者として読む前提で書いている」と一言添える

### 確かめ方
- `pnpm check` に足す: `/llms.txt` があり、名前と実績を含む。リンク欄に共有の文面がある
- 共有ボタンを Playwright で押し、PC でクリップボードに文面が入ることを確かめる

## 全体の確かめ方
- 各 PR で `pnpm verify` が通る
- C 以降の各 PR は staging で本人に見てもらってから merge する
- C 以降を merge したら、本番で Lighthouse（モバイル）を測る
