# CLAUDE.md

作業の前に [docs/README.md](docs/README.md) を読む。目的・ペルソナ・これまでの判断（ADR）・設計・開発の流れはすべて `docs/` にある。

- 判断を伴う変更には ADR の追加・更新を伴わせる（[docs/rules/docs.md](docs/rules/docs.md)）
- このリポジトリは公開されている。選考中の企業名・日程・選考上の目標は書かない
- git は `git -C <絶対パス> ...` の単発で実行する。`&&` や改行を含む複合コマンドはフックで止まる
- main への push は本番へのデプロイになる
- `astro.config.mjs` の `vite.server.allowedHosts` に `wisteria-io.com` が必要
