# staging

## 概要
PR の見た目を、本番に出す前に `https://staging.wisteria-io.com` で確かめる仕組みと、Mac mini に一度だけ入れる設定（→ [ADR-015](../adr/adr-015-staging.md)）。

## 前提条件
- Mac mini で self-hosted runner と Cloudflare Tunnel（`com.wisteria.cloudflared`）が動いている
- この機械から `ssh mac-mini` で入れる

## 手順

### 使い方
- このリポジトリにブランチを push して PR を出すと、verify の後に staging の job が動き、`https://staging.wisteria-io.com` に出る
- 出るのは最後に verify を終えた PR（push の順ではない。古い job を再実行しても上書きされる）。どの PR が出ているかは、Actions の staging の job のログ（`Staged PR #N`）で分かる
- fork からの PR では staging の job は動かない

### Mac mini への設定（一度だけ。本人の確認を取ってから行う）
1. 置き場所を作る: `mkdir -p /Users/wisteria/portfolio-serve /Users/wisteria/portfolio-staging`
2. リポジトリの `serve.cjs` を `/Users/wisteria/portfolio-serve/serve-staging.cjs` に写す
3. `deploy/launchd/com.wisteria.portfolio-staging.plist` を `~/Library/LaunchAgents/` に写し、`launchctl load ~/Library/LaunchAgents/com.wisteria.portfolio-staging.plist`
4. `~/.cloudflared/config.yml` の ingress で、`- service: http_status:404` の行より前に次を足す

   ```yaml
     - hostname: staging.wisteria-io.com
       service: http://localhost:4322
   ```

5. DNS の経路を作る: `cloudflared tunnel route dns a2b8a85d-99fb-4810-8d72-e9ba530d0af6 staging.wisteria-io.com`
6. Tunnel に設定を読み直させる: `launchctl kickstart -k gui/$(id -u)/com.wisteria.cloudflared`

### 確かめ方
- `curl -sI https://staging.wisteria-io.com/` に `x-robots-tag: noindex, nofollow` が付く
- `curl -s https://staging.wisteria-io.com/robots.txt` が `Disallow: /` を返す
- 本番の `curl -sI https://wisteria-io.com/` には `x-robots-tag` が付かない

### 本番の配信
- 本番（`wisteria-io.com`）は本番用の `/Users/wisteria/portfolio-serve/serve.cjs` を、既定値（`/Users/wisteria/portfolio-dist`・ポート 4321）で動かす。設定は `deploy/launchd/com.wisteria.portfolio.plist`
- `serve.cjs` を直したら、まず staging 用の `serve-staging.cjs` だけを更新して staging を再起動する。本番は承認・マージ後に `serve.cjs` を更新し、本番のプロセスだけを再起動する（本番は数秒止まる）。CI が配るのは dist だけなので、配信コードの更新は別途必要。
- Cloudflare の中継は `.txt`・画像などを最大4時間持つ。中身が変わったのに古いまま見えるときは、クエリを付けて（`?v=1`）取り直すと元の応答を確かめられる
  - OGP 画像は、ページの `og:image` の URL にビルドした commit の短い hash（`?v=<hash>`）を付けるので、配るたびに新しい画像が読まれる。画像の URL を直接開くときは、同じ `?v=` を付けて開く

## トラブルシューティング
- **502 が出る**: staging の serve.cjs が動いていない。`launchctl list | grep portfolio-staging` と `/tmp/portfolio-staging.log` を見る
- **古い見た目のまま**: staging の job が skipped（fork からの PR）か、別の PR が後から push された
- **serve.cjs を直した**: 手順2をやり直し、`launchctl kickstart -k gui/$(id -u)/com.wisteria.portfolio-staging`

## 参考
- [開発の流れ](./development-flow.md)
- [Cloudflare Tunnel: configuration file](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/configuration-file/)

## 正規 URL の転送を更新するとき（ADR-020）

- staging の plist が以前の共有 `serve.cjs` を指す場合は、新しい plist を設置して `launchctl bootout` / `bootstrap` で読み直す。本番の plist は変えない。
- 配信コードは一時ファイルへコピーし、`node --check` の後に同じディレクトリ内で置き換える。承認前に本番のファイルを置き換えない。
- 配置後は `/blog` と `/blog/index.html` が `/blog/` へ301、`/blog/` が200、`/missing` が404、クエリが維持されることを確認する。stagingの301・200・404すべてで `X-Robots-Tag` を確認する。
- 本番では `Host: www.wisteria-io.com` と `X-Forwarded-Proto: http` の転送も確認し、HTTPS非wwwから転送が繰り返されないことを確かめる。
- 公開側でもHTTP・www・スラッシュなしの転送を確認する。Cloudflareのキャッシュやプロキシのヘッダーがoriginの結果と異なる場合は、その差を調べる。
