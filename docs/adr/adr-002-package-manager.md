# ADR-002: パッケージマネージャを pnpm に統一する

- ステータス: 提案中
- 日付: 2026-10-14

## 背景・課題 (Background/Problem)
- パッケージマネージャが3つ混在している
  - README は `bun install` を案内している
  - CI（`.github/workflows/deploy.yml`）は `npm ci` を使っている
  - `bun.lock` と `package-lock.json` が両方コミットされている
- 手元と本番で依存の解決が別々に行われ、ずれても気づけない

## 決定事項 (Decision)
- pnpm に統一する
- `package.json` の `packageManager` でバージョンを固定する

### 理由 (Reasons)
- package.json に書いていない依存は解決されず、幽霊依存を防げる
- 実行は Node のままなので、入れる道具と動かす道具が一致する
- Astro の公式ドキュメントや周辺の情報も pnpm 前提のものが多い

### 受け入れるトレードオフ (Accepted Trade-offs)
- CI のランナーで pnpm を使えるようにする手間がある
- bun に比べてインストールは遅い（依存は6個なので実害はない）

## 検討した別の選択肢 (Alternatives Considered)
- **bun**: インストールが速く、配信サーバーを `Bun.serve` に置き換えれば実行環境まで揃う。ただし Astro の実行は Node のままで、入れるのは bun・動かすのは Node の二重構成になる
- **npm**: Node に同梱され追加の準備が要らないが、依存の解決が緩く幽霊依存を防げない

## 参考 (References)
- [pnpm](https://pnpm.io)

## 議論 (Discussion)
- 配信サーバーを bun にするかは、ホスティングの ADR で改めて決める
- 移行作業: `bun.lock` と `package-lock.json` を削除し `pnpm-lock.yaml` だけを置く。CI を `pnpm install --frozen-lockfile` と `pnpm build` に変える。README の手順を書き換える
