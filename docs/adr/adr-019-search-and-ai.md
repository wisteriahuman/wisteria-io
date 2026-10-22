# ADR-019: 本人の情報を画面・構造化データ・AI 向けの案内で共有する

- ステータス: 採用
- 日付: 2026-10-23

## 背景・課題 (Background/Problem)

名前から本人のサイトへ辿り着き、検索や AI の説明から根拠を確かめられるようにする。同姓同名の人と混同せず、実名・ハンドル・所属・外部プロフィールが同じ人を指すことを伝える必要がある。

## 決定事項 (Decision)

- `src/data/profile.ts` に実名・読み・ハンドル・アカウント名・大学名・本人の URL と外部プロフィールを置き、表示、トップの `ProfilePage.mainEntity`（`Person`）、記事の `BlogPosting.author`、ビルド時の `/llms.txt` から共有する。経歴・作品は既存の `src/data/`、記事一覧は公開記事のコレクションから生成する。
- 全 HTML に本番の canonical を付け、`og:url` とサイトマップの URL を揃える。記事一覧も自身の URL を指す。
- トップに読みとハンドルを表示し、記事にトップへ戻る著者リンクを置く。構造化データだけに人物像を足さない。
- ソースの先頭に wisteria の ASCII アートと GitHub・docs の案内を HTML コメントで残す。
- 「AI に聞く」はトップに1か所、各記事に1か所。Claude と ChatGPT に URL 入りの質問文を渡す静的リンクとし、閲覧時の JavaScript は増やさない。
- Google Search Console は本人が自分のアカウントで登録する。Cloudflare のドメイン確認を優先し、自動確認できなければ TXT レコードで確認する。登録情報をコードへ埋め込む必要はない。
- 順位と AI の参照は公開後に観測する。[公開後の手順](../guides/search-and-ai.md) と [画面仕様](../ui/search-and-ai.md) に記録する。

### 理由 (Reasons)

- 通常の索引登録と、本文で本人を明確に説明することが Google 検索と AI による概要の共通の土台になる。
- Google は `llms.txt` を検索の特別な入力として使わない。これは利用者が AI に本人の情報を渡すための案内として設ける。
- 原本を共通にすると、画面と AI に渡す内容の食い違いを減らせる。

### 受け入れるトレードオフ (Accepted Trade-offs)

- 正しく実装しても索引登録・1位・AI による概要の表示や引用は保証されない。Search Console と手動検索で確認が続く。
- 外部 AI のリンク仕様や URL 取得能力はサービスに依存する。質問文が開くことと、AI が取得・回答できることを区別する。
- 構造化データは HTML の転送量を増やす。記事でも著者を明示するため同じ Person を含め、Lighthouse で性能を確認する。

## 検討した別の選択肢 (Alternatives Considered)

- **llms.txt だけを追加する**: 作業は小さいが Google の順位や索引登録の土台を改善できない。
- **人物情報を JSON-LD と llms.txt に手書きする**: 初期実装は簡単だが、更新時に画面と食い違う。
- **AI の呼び出しをサイト内で実行する**: 会話を埋め込めるが、認証・費用・JavaScript が必要になり、既存の静的配信の利点を失う。
- **Google の確認用タグを追加する**: URL プレフィックスだけなら使えるが、本人の確認トークンを受け取ってコードを変更・デプロイする手間が増える。

## 参考 (References)

- [Google の AI 機能とウェブサイト](https://developers.google.com/search/docs/appearance/ai-features)
- [Google の生成 AI 向け最適化ガイド（llms.txt の扱い）](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google の ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google の正規 URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [調査結果と公開後の手順](../guides/search-and-ai.md)

## 議論 (Discussion)

本人との合意に基づき、AI への入口は Claude・ChatGPT の2つとする。Google のためだけに本文を増やしたり、未確認の人物情報や実績を加えたりしない。
