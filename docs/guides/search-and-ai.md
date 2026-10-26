# 検索と AI の公開後の確認

## 概要

本人のサイトを Google に登録し、実名検索と AI による概要の参照を確認する。実装の検査と、Google 上での達成を区別する。

## 前提条件

- 本人の Google アカウントと、`wisteria-io.com` を管理する Cloudflare アカウント。
- PR の staging を本人が確認し、承認後に本番へ反映していること。Search Console のドメイン登録自体は先にできる。

## 手順

### 1. 本人が Search Console に登録する

1. [Search Console](https://search.google.com/search-console/welcome) を本人の Google アカウントで開き、「ドメイン」に `wisteria-io.com` を入力する。
2. Cloudflare での自動確認が提示されたら、それを選んで本人がログインし確認する。
3. 自動確認が出なければ「任意の DNS プロバイダ」で表示された `google-site-verification=…` をコピーする。Cloudflare → `wisteria-io.com` → DNS → レコードを追加、種類 **TXT**、名前 **@**、内容はコピーした値、TTL は自動で保存する。
4. Search Console に戻って「確認」。失敗したら DNS の反映を待って再確認する。成功後も TXT は残す。

確認トークンをエージェントに渡したり、コードを変更したりする必要はない。ドメインプロパティには staging も含まれるため、公開後の解析では本番 URL に絞る。

### 2. 本番公開後にサイトマップと索引を確認する

1. 「サイトマップ」に `https://wisteria-io.com/sitemap-index.xml` を送信し、取得成功を確認する。
2. 「URL 検査」で `https://wisteria-io.com/` を検査し、「公開 URL をテスト」。HTTP 200、クロール可能、索引登録可能、ユーザー指定 canonical が本番トップであることを確認し、未登録や更新後なら「インデックス登録をリクエスト」。これは登録・時期の保証ではない。
3. 記事の1件でも同じ検査を行う。後日「Google が選択した正規 URL」が指定と一致するか確認する。
4. [リッチリザルト テスト](https://search.google.com/test/rich-results) でトップの ProfilePage と記事の BlogPosting を確認する。ローカルの JSON 構文検査と Google の判断は別に扱う。
5. Cloudflare のチャレンジやアクセス拒否が出る場合は URL 検査の取得結果とセキュリティイベントを照合する。UA を Googlebot にした curl の成功だけでは本物の Googlebot の到達を証明できない。

### 3. 外部プロフィールを本人が整える

| 場所 | 確認・変更する内容 |
|---|---|
| [GitHub](https://github.com/settings/profile) | Website を `https://wisteria-io.com/` にする。名前・bio・プロフィール README に実名と wisteria の対応が分かるように書く。学年など古くなる情報を確認する |
| X（`@wisteria_man`） | プロフィールのウェブサイト欄へ同じ URL。名前・自己紹介でサイトと同じ人物と分かるようにする |
| [AtCoder](https://atcoder.jp/settings) | プロフィールの Web サイト欄へ同じ URL。所属の表記を確認する |
| 自分が編集できる登壇・作品紹介・チームの自己紹介 | 読者に役立つ箇所で実名と本人サイトを対応付ける。第三者のページは勝手に書き換えない |

リンクの新規作成やプロフィール変更は本人が行う。無関係な被リンクの購入や大量投稿は行わない。

### 4. 順位と AI の参照を観測する

公開直後に基準を残し、索引登録後は週1回程度、同じ条件で確認する。結果が出なければ URL 検査・表示回数・Google が選択した正規 URL から原因を絞る。

- Search Console の検索パフォーマンスで検索タイプ「ウェブ」、国「日本」、期間を固定し、`藤井優気` と `wisteriahuman` をそれぞれ完全一致で絞る。本番のページだけを対象に平均掲載順位・表示回数・クリック数を記録する。データなしは順位0ではなく未計測。
- Google で引用符を付けずに `藤井優気` を検索する。日時、地域・言語、端末、ログイン状態を記録し、広告等を除く最初の通常の自然検索結果の URL を確かめる。Search Console の平均順位は、この一回の検索順位とは別の指標。
- Search Console に「生成 AI 機能」のレポートが提示される場合は、集計期間と対象ページの表示回数を記録する。サイト全体の表示回数は、実名検索で本人が説明された証拠とは分ける。
- AI による概要が出れば、説明が本人の所属・実績と一致するか、参照リンクが `wisteria-io.com` を含むかを確認する。概要なし、別人、他サイトのみの引用はそれぞれ分けて記録する。リンクがあることだけで説明の正確さを実証したとしない。
- `wisteriahuman`・`ふじいゆうき` は補助指標、`wisteria`・`藤井` は探索として記録する。植物名・著名人を含む広い語句は検索意図が異なるので、実名検索の達成条件と混ぜない。現時点でそれらに勝てると約束する根拠はない。
- 日時・検索語・自然検索順位と URL・AI の有無／説明／引用先・Search Console の集計期間と数値・次の対応を私的な記録に残す。スクリーンショットや Search Console の書き出しも残す。達成の判定は、その時点の順位と概要全文の観測で行い、過去の成功例だけで完了扱いにしない。

## トラブルシューティング

- 索引に未登録：URL 検査で取得拒否、noindex、重複扱いを確認。staging は `X-Robots-Tag: noindex, nofollow` と robots の拒否を維持し、本番では付いていないことを確認する。
- 索引にあるのに上位でない：表記の一貫性、外部プロフィールとの対応、内容の正確さと固有の根拠を確認する。特定の順位や反映期限を保証しない。
- AI による概要がない：概要は常に表示されない。強制する設定はない。通常検索と、概要が出た場合の引用を分けて扱う。
- AI リンクから回答されない：質問文の引継ぎ、ログイン、サービスの URL 取得対応を確認する。リンクは AI が必ず読めることを保証しない。

## 参考・公式資料で確認したこと

2026-10-26 に現行の公式ページを再確認した。

- AI による概要や AI Mode の参照候補には、索引登録され、スニペット表示可能であることが必要。特別な技術要件はなく、表示も保証されない。AI の検索流入は Search Console のウェブ検索に含まれる。[Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)
- Google 検索は `llms.txt` を特別な入力として使わず、それによって順位が改善するわけではない。このサイトでは人が AI に渡す入口として用意する。[Google: AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- Google-Extended は Gemini の学習等を制御するトークンで、Google 検索への掲載や順位のシグナルに影響しない。検索のクロールは Googlebot の制御を確認する。[Google: common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended)
- ProfilePage は人物などのプロフィールを表し、本文と構造化データを一致させる。著者への参照にも使える。[Google: ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- canonical は正規 URL の選択のシグナルとなるが、最終的な選択は Google が行う。[Google: canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- ドメイン所有権は対応プロバイダでの自動確認または DNS レコードで確認できる。[Google: 所有権の確認](https://support.google.com/webmasters/answer/9008080?hl=ja)、[Cloudflare: DNS レコードの管理](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
