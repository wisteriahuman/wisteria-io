# 段階②-b リポジトリの整備 実装仕様

- 日付: 2026-10-15
- 入力: [DS-05〜08](../../requirements/developer-stories.md)、grilling での合意（2026-10-15）
- 前提: pnpm への統一は済み（[ADR-002](../../adr/adr-002-package-manager.md)）

## 目的
AI エージェントと自分が、どの機械からでも同じ手順で開発し、コマンド1つで検証し、PR を通して本番に出せるようにする。面接官がリポジトリを見たとき、その流れ自体が作り方の証拠になる状態にする。

## 範囲

やる:
- `pnpm verify` で 型検査 → リント・整形 → ビルド → check-dist → Lighthouse を走らせる（DS-07）
- 検証を GitHub のマシンで PR と push の両方に走らせ、デプロイは検証の後に Mac mini で行う（DS-07、issue #1 の懸念）
- main を保護し、変更はブランチと PR で入れる
- Node のバージョンを `.node-version` で固定し、手元の手順を `guides/setup.md` に書く（DS-05）
- コンポーネント・データ・ページの置き場所の規則を `rules/` に書く（DS-06）
- `docs/superpowers/` を docs の構成に加える
- GitHub の説明・URL・topics と、ライセンスを整える
- ADR-010〜013

やらない:
- 配信基盤・k8s・Terraform（段階②-c）
- 図（mermaid）のビルド時の画像化
- Nix の devShell

## 検証のコマンド

`package.json` の scripts:

| script | 中身 |
|---|---|
| `typecheck` | `astro check` |
| `lint` | `biome ci .`（リントと整形の差分の両方を見る。直さない） |
| `format` | `biome check --write .`（手元で直すとき用） |
| `build` | `astro build`（今のまま） |
| `check` | `node scripts/check-dist.mjs`（今のまま） |
| `lighthouse` | `lhci autorun` |
| `verify` | `typecheck` → `lint` → `build` → `check` → `lighthouse` を順に。どこかで失敗したら止まる |

- 依存を足す: `@astrojs/check`・`typescript`・`@biomejs/biome`（2.3 以上）・`@lhci/cli`。すべて devDependencies
- Biome は導入時に、手元の `.astro` ファイルでリントと整形が動くことを確かめる。動かない部分があれば、その範囲を設定で外し、ADR-010 に書く
- 初回の整形で全体に差分が出るため、整形だけのコミットを分ける

### Lighthouse
- `lighthouserc.json` で `collect.staticDistDir: "./dist"` を使い、ビルド結果をそのまま配る（プレビューサーバーを立てない）
- 対象: `/`・`/blog/`・`/blog/errors-are-values/`
- 1ページ3回測り、中央値で判定する
- 合格ライン: Accessibility・Best Practices・SEO は 1.0（100）、Performance は 0.95 以上
- 計測はモバイル（Lighthouse の既定）

## CI

`.github/workflows/` を次の形にする。

- `verify.yml`（新規）: `pull_request` と `push`（main）で動く。`runs-on: ubuntu-latest`。`pnpm/action-setup` → `actions/setup-node`（`node-version-file: .node-version`、pnpm のキャッシュ）→ `pnpm install --frozen-lockfile` → `pnpm verify`。push のときはビルド結果（`dist/`）を artifact として上げる
- `deploy.yml`（変更）: `workflow_run` は使わない。`verify.yml` の中に deploy の job を置き、`needs: verify`・`if: github.event_name == 'push'`・`runs-on: self-hosted` にする。deploy の job は artifact の `dist/` を受け取って配置するだけで、Mac mini ではビルドしない。結果として `deploy.yml` は消し、workflow は1つにする
- self-hosted の job は、push（main）のときしか動かない。外部の PR のコードは Mac mini で動かない

## ブランチと PR
- main の保護（GitHub の branch protection）: 必須の status check は verify の job。承認は不要。管理者にも適用する。force push と削除は禁止
- merge は squash だけを許す。PR のタイトルはコミット規約（`<種類>: <内容>`）に従う
- AI エージェントは `feat/…`・`fix/…`・`docs/…`・`chore/…` のブランチを切り、PR を作り、verify が通ったら merge する
- `guides/development-flow.md` と `rules/commit-pr.md` に、この流れを書く

## バージョンの固定
- `.node-version` に `24` を書く。pnpm は `packageManager`（`pnpm@10.33.0`）のまま
- `package.json` の `engines.node` を `>=24` にする
- `guides/setup.md`（新規）: mise で `.node-version` を読む設定（`idiomatic_version_file_enable_tools` に `node`）、`pnpm install`、`pnpm dev`、`pnpm verify` までの手順

## 置き場所の規則
`docs/rules/code-structure.md`（新規）:
- `src/data/`: 実績・経歴・作品・名前など、画面に出る事実。画面や OGP はここを読む（DS-02）
- `src/components/`: 画面の部品。データを持たず、`src/data/` から読む
- `src/lib/`: 画面以外の処理（OGP の描画など）
- `src/pages/`: ルーティング。`og.png.ts` と `og/` は OGP 画像
- `src/content/blog/`: 記事。Markdown 1ファイルで完結する
- `scripts/`: ビルド結果の検査など、開発用のスクリプト
- アイコンは `Icon.astro` に足す。絵文字をアイコンに使わない

## docs の構成
- `docs/README.md` の構成表に `superpowers/`（仕様書 `specs/` と実装計画 `plans/`）を加える
- ADR-004 の議論に、Superpowers の仕様書と計画の置き場所を追記する

## リポジトリの情報とライセンス
- GitHub: description `藤井 優気 (wisteria) のポートフォリオとブログ`、homepage `https://wisteria-io.com`、topics `astro`・`portfolio`・`tailwindcss`・`adr`・`github-actions`
- `LICENSE`: MIT。対象はコード
- README に「`src/content/`（記事）と画像（`public/`・`src/assets/`）は MIT の対象外で、無断での再利用を禁じる」と書く

## ADR
- ADR-010: リント・整形に Biome を使う（別の選択肢: ESLint + Prettier）
- ADR-011: 変更は PR で入れ、検証は GitHub のマシン、デプロイは自宅で行う（別の選択肢: main に直接 push、全部 self-hosted）
- ADR-012: ツールのバージョンを `.node-version` と `packageManager` で固定する（別の選択肢: Nix の devShell、mise の設定ファイル）
- ADR-013: コードは MIT、文章と画像は対象外にする（別の選択肢: すべて MIT、ライセンスなし）

## 確かめ方
1. 手元で `pnpm verify` が通る
2. わざと壊した変更（例: アクセシビリティを落とす）で `pnpm verify` が失敗することを1回確かめる
3. この作業自体を PR で出し、GitHub 上で verify が通ること、self-hosted の job が PR では動かないことを確かめる
4. merge 後、push で verify → deploy の順に動き、本番が更新されることを確かめる
5. main に直接 push しようとすると拒否されることを確かめる

## 進め方の注意
- branch protection は、この作業の PR を merge した後に有効にする（有効にする前の main には verify の job がないため）
- 最初の PR だけは、protection がない状態で merge する
