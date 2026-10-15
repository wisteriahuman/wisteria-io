# 開発環境の用意

## 概要
新しい機械で、このリポジトリを開発・検証できる状態にする手順（→ [DS-05](../requirements/developer-stories.md#ds-05-どの機械でも開発環境を再現できる)）。バージョンの決め方は [ADR-012](../adr/adr-012-tool-versions.md) を参照。

## 前提条件
- Git
- Node のバージョン管理の道具（mise・fnm・Volta など、`.node-version` を読めるもの）
- Google Chrome（記事の図をビルド時に描くのと、Lighthouse に使う）

## 手順

### 1. Node のバージョンを合わせる
使う Node は `.node-version` に書いてある（24）。mise の場合は、`.node-version` を読む設定を1回だけ入れる。

```bash
mise settings add idiomatic_version_file_enable_tools node
```

リポジトリに入って `node -v` が 24 系になっていれば完了。

### 2. pnpm を用意して依存を入れる
pnpm のバージョンは `package.json` の `packageManager` で固定している。corepack か mise で同じ版を入れる。

```bash
corepack enable
pnpm install
```

### 3. 開発サーバーを起動する

```bash
pnpm dev
```

### 4. 変更を検証する
型検査・リント・ビルド・ビルド結果の検査・単体の検査・Lighthouse を順に走らせる。CI も同じコマンドを使う。

```bash
pnpm verify
```

## トラブルシューティング
- **`node -v` が 24 にならない**: mise の設定が入っていないか、別の Node（Homebrew など）が PATH の先にある。`mise ls --current` で `.node-version` が読まれているか確かめる
- **`pnpm lighthouse` が Chrome を見つけられない**: Chrome を入れるか、`CHROME_PATH` に実行ファイルのパスを入れる
- **`pnpm build` が `chrome` の起動で失敗する**: 記事の図を描くのに Google Chrome の安定版を使う（Playwright のブラウザは入れない）。Chrome を入れる

## 参考
- [開発の流れ](./development-flow.md)
- [mise: Idiomatic version files](https://mise.jdx.dev/configuration.html#idiomatic-version-files)
