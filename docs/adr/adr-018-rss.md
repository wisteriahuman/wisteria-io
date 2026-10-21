# ADR-018: 記事の RSS を /rss.xml で配る

- ステータス: 採用
- 日付: 2026-10-21

## 背景・課題 (Background/Problem)
- GitHub のプロフィールの README（wisteriahuman/wisteriahuman）に「最近書いた記事」を出したい。README の生成器が毎日このサイトを読み、新しい3件を載せる
- 生成器が読める、決まった形の記事の一覧がこのサイトに無い

## 決定事項 (Decision)
- `https://wisteria-io.com/rss.xml` で RSS 2.0 を返す。`@astrojs/rss` でビルド時に作る
- 中身は blog コレクションの `draft: false` の記事を、`pubDate` の新しい順に並べる。各 item に title・link（記事の絶対 URL）・pubDate・description を入れる
- 全ページの head に `<link rel="alternate" type="application/rss+xml">` を置き、RSS リーダーからも見つけられるようにする
- 生成器との約束（URL・RSS 2.0・新しい順・pubDate が RFC 1123 の形）は `scripts/check-dist.mjs` で確かめ、壊れたら verify で止める

### 理由 (Reasons)
- RSS 2.0 は読み手側のライブラリが多く、生成器が独自の形を解釈しなくて済む
- `@astrojs/rss` は Astro の公式で、pubDate を RFC 1123 の形で書き、相対の link をサイトの絶対 URL にする。手で XML を組むより間違いが少ない
- 静的なファイルなので、配信の仕組み（ADR-011）を変えずに済む

### 受け入れるトレードオフ (Accepted Trade-offs)
- 依存が1つ増える
- 本文は入れず description だけにする。RSS リーダーで全文は読めず、サイトへ来てもらう形になる
- 記事を足すたびに本番へデプロイしないと、README に出ない

## 検討した別の選択肢 (Alternatives Considered)
- **JSON（/posts.json などの独自の形）**: 生成器には読みやすいが、RSS リーダーでは使えず、形の約束を自分で決めて守る必要がある
- **Atom**: RSS 2.0 と同じ用途だが、生成器との約束が RSS 2.0 なので合わせる
- **README の生成器がこのリポジトリの Markdown を直接読む**: サイトを経由しないので早いが、下書きの扱いや URL の作り方をサイトと二重に持つことになる

## 参考 (References)
- [@astrojs/rss](https://docs.astro.build/ja/recipes/rss/)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)

## 議論 (Discussion)
- プロフィールの README の側から、`/rss.xml` で RSS 2.0、`@astrojs/rss` を使い、item に title・link・pubDate・description を入れる、という約束で頼まれた
