# ADR-015: 本番の前の確認に、PR ごとの staging を使う

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- 段階②-a で見た目を作り直す。main への merge がそのまま本番に出るので、見た目は本番の前に別の場所で確かめたい
- 手元の `pnpm preview` では、スマホの実機や他の人に見せられない
- 見た目を変える PR は、本番に出す前に崩れていないことを確かめたい

## 決定事項 (Decision)
- このリポジトリから出た PR（fork でないもの）は、verify が通ったら self-hosted runner で `staging.wisteria-io.com` に配置する。最後に verify を終えた PR で上書きする
- staging は `serve.cjs` の2つ目のプロセス（ポート 4322、`/Users/wisteria/portfolio-staging`）で配り、すべての応答に `X-Robots-Tag: noindex, nofollow` を付け、`/robots.txt` は `Disallow: /` を返す
- Cloudflare Tunnel の設定に hostname を足して公開する
- fork からの PR では staging の job を動かさない（`github.event.pull_request.head.repo.full_name == github.repository`）

### 理由 (Reasons)
- 長く残すブランチを作らず、今の「ブランチ → PR → merge」の流れのまま確かめられる
- このリポジトリに push できるのは本人だけなので、自宅の機械で動くのは身元の確かなコードに限られる。fork からの PR は、承認するまで workflow 自体が動かない（ADR-011）
- 検証を通ったビルド結果をそのまま配るので、staging で見たものと本番に出るものが同じになる

### 受け入れるトレードオフ (Accepted Trade-offs)
- staging は URL を知っていれば誰でも見られる（検索には載らない）
- PR が複数あるときは、最後に verify を終えたものしか見られない（push の順ではない。古い job を再実行しても上書きされる）
- launchd の設定は Mac mini に手で入れる。段階②-c で配信基盤ごと置き換えるまでのつなぎとする

## 検討した別の選択肢 (Alternatives Considered)
- **develop ブランチ**: main への merge を squash にしているため、merge のたびに履歴がずれ、衝突しやすい
- **手元の `pnpm preview` だけ**: スマホの実機や他の人に見せられない
- **PR ごとに別の URL**: 見比べられるが、自宅の機械に PR の数だけ配置が増える

## 参考 (References)
- [ADR-011](./adr-011-pr-and-ci.md)
- [Cloudflare Tunnel: configuration file](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/configuration-file/)
- [staging の手順](../guides/staging.md)

## 議論 (Discussion)
- 最初は develop ブランチで確かめる案が出た。squash との相性から、PR ごとの staging にした
