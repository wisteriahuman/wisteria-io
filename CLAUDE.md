# CLAUDE.md

作業の前に [docs/README.md](docs/README.md) を読む。目的・ペルソナ・これまでの判断（ADR）・設計・開発の流れはすべて `docs/` にある。

- 判断を伴う変更には ADR の追加・更新を伴わせる（[docs/rules/docs.md](docs/rules/docs.md)）
- このリポジトリは公開されている。選考中の企業名・日程・選考上の目標は書かない
- git・gh の書き込み（commit・push・PR）は `git -C <絶対パス> ...` のような単発で実行する。`&&`・パイプ・リダイレクト・`$` を含むとフックで止まる。PR の本文は `--body-file` で渡す
- main には直接 push しない。ブランチ → PR → verify → squash merge の順で入れる。main への merge が本番へのデプロイになる
- 変更の検証は `pnpm verify`（型検査・リント・ビルド・ビルド結果の検査・Lighthouse）
- `astro.config.mjs` の `vite.server.allowedHosts` に `wisteria-io.com` が必要
