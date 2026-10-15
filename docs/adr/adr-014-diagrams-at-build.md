# ADR-014: 記事の図はビルド時に SVG にする

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- neovim 入門の記事は mermaid で図を書いている。これまでは閲覧時に CDN から mermaid（約850KB）を読み込み、ブラウザで図を描いていた
- 図が最初の画面にある Part 1・Part 2 は、Lighthouse（モバイル）の Performance が 91・93 で、目標の 100 に届かなかった（[ADR-009](./adr-009-web-fonts.md) の対策の後に残った分）
- 閲覧時に描くと、描き終わるまで図の場所が空になり、スマホ幅では Part 2 の図が画面からはみ出して横にスクロールできてしまっていた

## 決定事項 (Decision)
- `rehype-mermaid` で、ビルド時に図を SVG にしてページに埋め込む。閲覧時には mermaid を読み込まない
- 図を描くブラウザは、手元と GitHub のマシンにある Google Chrome を使う（`channel: 'chrome'`）。Playwright のブラウザは入れない
- ラベルは HTML ではなく SVG の文字で描く（`htmlLabels: false`）
- 記事は今まで通り ` ```mermaid ` で書く。SVG は `src/lib/rehype-wrap-mermaid.ts` で `<figure class="mermaid">` に包み、枠を付ける
- CI では、日本語のフォントが無ければ入れてからビルドする
- `pnpm verify` の Lighthouse に Part 1 を加え、`pnpm check` で図が SVG になっていることと mermaid を読み込んでいないことを確かめる

### 理由 (Reasons)
- 閲覧時の JavaScript が無くなり、Part 1〜3 の Lighthouse が4項目とも 100 になった（手元の計測）
- 図が HTML に含まれるので、読み込み直後から表示され、場所も確定している
- 記事は Markdown 1ファイルで完結したまま書ける（[コードの置き場所](../rules/code-structure.md)）
- HTML のラベルは記事の CSS（段落の余白など）の影響を受け、`<br>` も二重になって文字が欠けた。SVG の文字ならその影響を受けない

### 受け入れるトレードオフ (Accepted Trade-offs)
- ビルドに Google Chrome が要る。無い機械では `pnpm build` が失敗する（[開発環境の用意](../guides/setup.md) に書いた）
- 文字の幅はビルドした機械のフォントで測る。閲覧する端末のフォントと幅が少し違い、枠の余白がずれることがある
- ビルドが数秒長くなり、図のある記事の HTML が1図あたり十数KB 大きくなる
- 開発用の依存に `rehype-mermaid`・`playwright`・`@types/hast` が増える

## 検討した別の選択肢 (Alternatives Considered)
- **閲覧時に描くまま、読み込みを遅らせる**: すでに図が画面に近づいてから読み込むようにしていたが、図が最初の画面にある記事では効かない
- **図を手で SVG に書き出してリポジトリに置く**: ビルドにブラウザが要らないが、記事が Markdown 1ファイルで完結しなくなり、図を直すたびに書き出し直す手間がかかる
- **Playwright のブラウザを入れる**: 手元と CI で同じブラウザになるが、ダウンロードが数百MB 増え、CI も遅くなる。Chrome はどちらの機械にもすでにある
- **図を画像（`<img>`）で埋め込む**: HTML は軽くなるが、文字を選択・検索できず、暗い背景に合わせた色の調整もしにくい

## 参考 (References)
- [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid)
- [Astro: syntaxHighlight.excludeLangs](https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight)

## 議論 (Discussion)
- 段階①の後に残った課題として、段階②-b の続きで対応した
