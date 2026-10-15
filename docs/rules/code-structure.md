# コードの置き場所

## 目的
自分も AI エージェントも、既存のパターンを見つけて正しい場所に足せるようにする（→ [DS-06](../requirements/developer-stories.md#ds-06-既存のパターンを見つけて正しい場所に追加する)）。

## ルール

| 場所 | 置くもの | 決まりごと |
|---|---|---|
| `src/data/` | 名前・経歴・実績・作品など、画面に出る事実 | 画面・OGP・メタはここを読む。同じ事実を2か所に書かない（→ [DS-02](../requirements/developer-stories.md#ds-02-実績を1か所直せば全体に反映される)）。件数や内訳は手で書かず、元のデータから作る |
| `src/components/` | 画面の部品（`.astro`） | 事実のデータを持たず、`src/data/` から読む。アイコンは `Icon.astro` に足して名前で使う |
| `src/layouts/` | ページの骨組み（`<head>`・メタ・共通のスクリプト） | メタの既定値は `src/data/profile.ts` から作る |
| `src/lib/` | 画面以外の処理 | 例: OGP の描画（`og.ts`） |
| `src/pages/` | ルーティング | `og.png.ts` と `og/` は OGP 画像。ブログ記事の URL（`/blog/<slug>`）と OGP 画像の URL（`/og/<slug>.png`）は変えない |
| `src/content/blog/` | ブログ記事 | Markdown 1ファイルで完結させる。OGP 画像は自動で作られる |
| `src/styles/` | 全体の CSS と色のトークン（`@theme`） | 色はトークンを使い、直接の色コードを部品に書かない |
| `src/assets/` | ビルド時に最適化する画像 | `astro:assets` の `<Image />` で使う |
| `public/` | そのまま配る静的ファイル | 外部から URL で参照されうるので、消す前に確かめる |
| `scripts/` | 開発用のスクリプト | 例: ビルド結果の検査（`check-dist.mjs`）。仕様を変えたら検査も直す |
| `docs/` | 要件・判断・設計・手順・ルール | 構成は [docs/README.md](../README.md) |

- 絵文字をアイコンに使わない。SVG を `Icon.astro` に足す
- 書き方は Biome に従う（`pnpm format`）

## 良い例

```
ハッカソンの受賞が増えた
→ src/data/projects.ts の award を書く
→ 経歴・最初の画面のチップ・トップの OGP の「受賞N回」が変わる
```

## 悪い例

```
Hero.astro のチップの文言を「ハッカソン受賞4回」に書き換える
→ 経歴と OGP は3回のまま食い違う
```

## 例外
- なし
