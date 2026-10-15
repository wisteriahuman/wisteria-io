# コードの置き場所

## 目的
自分も AI エージェントも、既存のパターンを見つけて正しい場所に足せるようにする（→ [DS-06](../requirements/developer-stories.md#ds-06-既存のパターンを見つけて正しい場所に追加する)）。

## ルール

| 場所 | 置くもの | 決まりごと |
|---|---|---|
| `src/data/` | 名前・経歴・実績・作品など、画面に出る事実 | 画面・OGP・メタはここを読む。同じ事実を2か所に書かない（→ [DS-02](../requirements/developer-stories.md#ds-02-実績を1か所直せば全体に反映される)）。件数や内訳は手で書かず、元のデータから作る |
| `src/components/` | 画面の部品（`.astro`） | 事実のデータを持たず、`src/data/` から読む。見た目は大学ノートの書き方にそろえる（[ADR-016](../adr/adr-016-paper-look.md)） |
| `src/layouts/` | ページの骨組み（`<head>`・メタ・共通のスクリプト） | メタの既定値は `src/data/profile.ts` から作る |
| `src/lib/` | 画面以外の処理 | 例: OGP の描画（`og.ts`）、Markdown の変換（`rehype-*.ts`） |
| `src/pages/` | ルーティング | `og.png.ts` と `og/` は OGP 画像。ブログ記事の URL（`/blog/<slug>`）と OGP 画像の URL（`/og/<slug>.png`）は変えない |
| `src/content/blog/` | ブログ記事 | Markdown 1ファイルで完結させる。OGP 画像は自動で作られる。図は ` ```mermaid ` で書けばビルド時に SVG になる |
| `src/styles/` | 全体の CSS と色のトークン（`@theme`） | 色はトークンを使い、直接の色コードを部品に書かない |
| `src/assets/` | ビルド時に最適化する画像 | `astro:assets` の `<Image />` で使う |
| `public/` | そのまま配る静的ファイル | 外部から URL で参照されうるので、消す前に確かめる |
| `scripts/` | 開発用のスクリプト | 例: ビルド結果の検査（`check-dist.mjs`）。仕様を変えたら検査も直す |
| `deploy/` | 自宅の機械に入れる設定 | 例: 本番と staging の launchd の設定（`deploy/launchd/`）。入れ方は [staging](../guides/staging.md) |
| `docs/` | 要件・判断・設計・手順・ルール | 構成は [docs/README.md](../README.md) |

- 絵文字もアイコンも使わない。箱・札・角の丸い面・枠・影を足さず、罫線の上に文字で書く（ADR-016。`pnpm check` が止める）
- 縦の寸法は罫線の間隔（`1.75rem` = 28px）の倍数にする（`pnpm check:grid` が止める）
- 書き方は Biome に従う（`pnpm format`）

## 良い例

```
ハッカソンの受賞が増えた
→ src/data/projects.ts の award を書く
→ 経歴・最初の画面の実績・トップの OGP の「受賞N回」が変わる
```

## 悪い例

```
Hero.astro の実績の文言を「ハッカソン受賞4回」に書き換える
→ 経歴と OGP は3回のまま食い違う
```

## 例外
- なし
