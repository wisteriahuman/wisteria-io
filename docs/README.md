# wisteria-io のドキュメント

## 目的

このサイトを見たエンジニアが、この人と一緒に働きたい・話を聞きたいと思う。

就活で使うポートフォリオとして、誰がどの端末で開いてもすぐ読めることを前提に、UI/UX・開発体験（DX/AX）・インフラのすべてを作り込む。

## 方針

- 技術選定・設計・進め方の判断はすべて ADR に残し、理由を説明できる状態にする（→ [ADR-004](./adr/adr-004-documentation-structure.md)）
- 判断は自分、手を動かすのは AI エージェント（→ [ADR-003](./adr/adr-003-ai-assisted-development.md)）
- 見る人のためにユーザーストーリーを、開発する人（自分と AI エージェント）のために開発者ストーリーを書き、UI/UX と開発体験の設計の入力にする

## ドキュメント構成

| ディレクトリ | 用途 | 説明 |
|------------|------|------|
| [requirements/](./requirements/) | 要件 | 目的・指標・ペルソナ・ユーザーストーリー・開発者ストーリー |
| [adr/](./adr/) | Architecture Decision Record | 技術選定・設計・進め方の意思決定とその理由 |
| [design/](./design/) | 設計ドキュメント | ページ・機能ごとの詳細設計 |
| [guides/](./guides/) | 手順書・ガイド | 開発の流れ、環境構築などの手順 |
| [rules/](./rules/) | ルール・規約 | ドキュメントの書き方、コミット規約、コードの置き場所など |
| [superpowers/](./superpowers/) | 実装の仕様書と計画 | AI エージェント（Superpowers）が書く仕様書（`specs/`）と実装計画（`plans/`）。合意した設計を、どのファイルにどう作るかに落とす |

`superpowers/` 以外の各ディレクトリに `TEMPLATE.md` を用意しているので、新規ドキュメント作成時はテンプレートをコピーして使用する。

## 読む順番

1. [requirements/README.md](./requirements/README.md) — 何のためのサイトか
2. [requirements/personas.md](./requirements/personas.md) — 誰が見て、誰が開発するか
3. [adr/README.md](./adr/README.md) — これまでの判断の一覧
4. [guides/development-flow.md](./guides/development-flow.md) — 開発の進め方
5. [design/](./design/) — 各ページの設計
