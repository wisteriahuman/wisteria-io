# ADR-020: 公開ページの URL をリンクと301転送で統一する

- ステータス: 採用
- 日付: 2026-10-26

## 背景・課題 (Background/Problem)

- HTMLのcanonicalとサイトマップは末尾スラッシュありだが、記事リンクはなし。同じHTMLを両方のURLで200として配信していた。
- HTTP・www付きの入口でも同じ内容を返し、Google側の正規URLの選択と指定が食い違う場合がある。
- 配信サーバーはビルド結果とは別に配置するため、HTMLの公開だけでは転送を更新できない。

## 決定事項 (Decision)

- 正規URLはHTTPS・非www・末尾スラッシュありを維持する。AstroのtrailingSlash、内部リンク、RSS、canonical、サイトマップの表記を合わせる。
- 実在するHTMLのスラッシュなし・index.html・.html表記を正規パスへ301転送する。存在しないURLは404のまま、アセットの拡張子は維持する。
- 本番ホストのwwwと、TunnelがX-Forwarded-Proto:httpを渡したHTTPアクセスは固定のHTTPS非wwwへ転送する。パスの統一も1回の転送にまとめ、クエリは保持する。
- Hostを転送先に使わず、パスを再エンコードする。localhostとstagingを本番へ転送しない。stagingは転送にもnoindexを付ける。
- stagingのサーバーファイルを本番と分ける。stagingでの配信コードの検証が本番プロセスの再起動へ先行しないようにする。

### 理由 (Reasons)

- リンク・canonical・サイトマップ・転送を一致させ、重複した入口を減らす。AI検索にも通常検索の索引とクロールの整備が必要で、特別なAI用マークアップを追加する根拠はない。
- canonicalはGoogleへのシグナルであり、指定だけで必ず選択されるものではない。

### 受け入れるトレードオフ (Accepted Trade-offs)

- 古いリンクには1回の転送が増える。永続転送はブラウザにも残り得る。
- 配信コードはMac miniへの配置とプロセス再起動が必要で、本番は短い停止が生じる。公開後に実HTTPとGSCを確認する。
- X-Forwarded-Protoの解釈は既存のCloudflare Tunnel経由を前提とする。別のプロキシへ移す際はヘッダーとループを検証する。
- 検索順位やAI概要への採用・反映時期は保証できない。

## 検討した別の選択肢 (Alternatives Considered)

- **canonicalだけを維持する**: 配信を変えずに済むが、リンクと複数の200応答が残る。
- **スラッシュなしに統一する**: 既存の一部索引に合うが、サイトマップ・構造化データ・AI案内を再び変更する必要がある。
- **Cloudflareのルールだけで転送する**: 入口で実行できるが、実在ページと404の区別やローカル検証をコードと共有しにくい。

## 参考 (References)

2026-10-26に確認。

- [Google: 正規URLの指定](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [stagingと配信コードの更新](../guides/staging.md)

## 議論 (Discussion)

- canonical・リンク・配信を一緒に直す方針で合意した。人物情報と記事本文の主張は増やさず、検索の入口の不一致を解消する。
