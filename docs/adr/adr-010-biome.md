# ADR-010: リントと整形に Biome を使う

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- リント・整形の仕組みがなく、書き方は書いた人（AI エージェントを含む）に任されていた
- 変更をコマンド1つで検証したい（→ [DS-07](../requirements/developer-stories.md#ds-07-変更をコマンド1つで検証する)）
- 対象は `.astro`（frontmatter・テンプレート・`<script>`）・TypeScript・Tailwind の CSS

## 決定事項 (Decision)
- Biome（2.5）でリントと整形を行う
- `.astro` のテンプレートまで対象にする（`html.experimentalFullSupportEnabled`）。Tailwind の `@theme`・`@apply` を読めるようにする（`css.parser.tailwindDirectives`）
- 書き方は導入前のコードに合わせる: 2スペース、一重引用符、1行120文字
- `pnpm lint`（`biome ci .`）は直さずに確かめるだけ。手元で直すときは `pnpm format`

### 理由 (Reasons)
- 依存が1つで、リントと整形を同じ設定ファイルで扱える
- 導入時に確かめたところ、`.astro` のテンプレートにもアクセシビリティの規則（SVG の title、`button` の type、`href="#"` など）が効き、実際に7件の指摘を直せた
- 速く（32ファイルで約15ms）、手元でも CI でも待ち時間にならない
- 整形の前後でビルド結果が全ファイル同じだったため、見た目を変えずに入れられた

### 受け入れるトレードオフ (Accepted Trade-offs)
- `.astro` の完全対応は「experimental」の設定で、版を上げたときに整形結果が変わる可能性がある
- ESLint のプラグインの生態系（jsx-a11y の細かい規則など）は使えない。アクセシビリティは CI の Lighthouse でも確かめる

## 検討した別の選択肢 (Alternatives Considered)
- **ESLint + Prettier（eslint-plugin-astro・prettier-plugin-astro）**: 長く使われている組み合わせだが、eslint-plugin-astro は自ら実験的な段階と書いており、アクセシビリティの規則には追加のプラグインが要る。依存が5〜6個に増え、設定も2つに分かれる
- **入れない**: 手間はないが、書き方が揃わず、DS-07 を満たせない

## 参考 (References)
- [Biome v2.3 — Astro・Vue・Svelte の完全対応](https://biomejs.dev/blog/biome-v2-3/)
- [eslint-plugin-astro](https://github.com/ota-meshi/eslint-plugin-astro)

## 議論 (Discussion)
- 既定の設定（タブ・二重引用符）では全ファイルが書き換わるため、既存の書き方に合わせた
- 導入時の指摘のうち、`serve.cjs` の `node:` 付きの import は安全でない自動修正の扱いだったため、手で直した
