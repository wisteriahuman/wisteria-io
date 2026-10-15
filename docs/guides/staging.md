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
2. リポジトリの `serve.cjs` を `/Users/wisteria/portfolio-serve/serve.cjs` に写す
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
- 本番（`wisteria-io.com`）も同じ `/Users/wisteria/portfolio-serve/serve.cjs` を、既定値（`/Users/wisteria/portfolio-dist`・ポート 4321）で動かす。設定は `deploy/launchd/com.wisteria.portfolio.plist`
- `serve.cjs` を直したら、手順2で写した後、本番と staging の両方を `launchctl kickstart -k gui/$(id -u)/<Label>` で読み直す（本番は数秒止まる）
- Cloudflare の中継は `.txt`・画像などを最大4時間持つ。中身が変わったのに古いまま見えるときは、クエリを付けて（`?v=1`）取り直すと元の応答を確かめられる

## トラブルシューティング
- **502 が出る**: staging の serve.cjs が動いていない。`launchctl list | grep portfolio-staging` と `/tmp/portfolio-staging.log` を見る
- **古い見た目のまま**: staging の job が skipped（fork からの PR）か、別の PR が後から push された
- **serve.cjs を直した**: 手順2をやり直し、`launchctl kickstart -k gui/$(id -u)/com.wisteria.portfolio-staging`

## 参考
- [開発の流れ](./development-flow.md)
- [Cloudflare Tunnel: configuration file](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/configuration-file/)
