# ADR 一覧

| 番号 | タイトル | ステータス |
|---|---|---|
| [ADR-001](./adr-001-astro.md) | 作り直しでも Astro を続投する | 提案中 |
| [ADR-002](./adr-002-package-manager.md) | パッケージマネージャを pnpm に統一する | 採用 |
| [ADR-003](./adr-003-ai-assisted-development.md) | 判断は自分、実装は AI エージェントに任せる | 採用 |
| [ADR-004](./adr-004-documentation-structure.md) | ドキュメントを用途別に分け、テンプレートで書く | 採用 |
| [ADR-005](./adr-005-japanese-only.md) | 日本語のみで作る | 採用 |
| [ADR-006](./adr-006-hosting-direction.md) | 自宅の k8s を主に、AWS を予備にする | 提案中 |
| [ADR-007](./adr-007-phased-release.md) | 段階的に公開する | 採用 |
| [ADR-008](./adr-008-goal-visibility.md) | 目標の構造をどこまで見せるか | 採用 |
| [ADR-009](./adr-009-web-fonts.md) | Web フォントで描画を止めない | 採用 |
| [ADR-010](./adr-010-biome.md) | リントと整形に Biome を使う | 採用 |
| [ADR-011](./adr-011-pr-and-ci.md) | 変更は PR で入れ、検証は GitHub のマシン、デプロイは自宅で行う | 採用 |
| [ADR-012](./adr-012-tool-versions.md) | ツールのバージョンを .node-version と packageManager で固定する | 採用 |
| [ADR-013](./adr-013-license.md) | コードは MIT、記事と画像は対象外にする | 採用 |
| [ADR-014](./adr-014-diagrams-at-build.md) | 記事の図はビルド時に SVG にする | 採用 |
| [ADR-015](./adr-015-staging.md) | 本番の前の確認に、PR ごとの staging を使う | 採用 |
| [ADR-016](./adr-016-paper-look.md) | 見た目を大学ノートにする | 採用 |
| [ADR-017](./adr-017-build-notes-from-git.md) | 「この部分の作り」の PR は、ビルド時に git の履歴から拾う | 採用 |

新しい ADR は [TEMPLATE.md](./TEMPLATE.md) をコピーして作り、この表に追加する。
