# wisteria-io

藤井 優気 (wisteria) のポートフォリオとブログ。

**https://wisteria-io.com**

要件・判断（ADR）・設計・開発の流れは [docs/](docs/README.md) にまとめている。

## Tech Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- pnpm・Node 24（[ADR-002](docs/adr/adr-002-package-manager.md)・[ADR-012](docs/adr/adr-012-tool-versions.md)）
- 検証: astro check・[Biome](https://biomejs.dev)・ビルド結果の検査・[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- 配信: 自宅の Mac mini から [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) で公開
- CI/CD: GitHub Actions（検証は GitHub のマシン、デプロイは self-hosted runner。[ADR-011](docs/adr/adr-011-pr-and-ci.md)）

## Development

判断は自分が行い、実装は AI エージェント（[Claude Code](https://claude.com/claude-code)）に任せている（[ADR-003](docs/adr/adr-003-ai-assisted-development.md)）。

```bash
pnpm install
pnpm dev
pnpm verify   # 型検査・リント・ビルド・ビルド結果の検査・Lighthouse
```

環境の用意は [docs/guides/setup.md](docs/guides/setup.md)、変更の入れ方は [docs/guides/development-flow.md](docs/guides/development-flow.md)。

## Deploy

ブランチから PR を出し、verify が通ったら squash で `main` に merge する。`main` への merge で verify → deploy が走り、本番に出る。

## License

ソースコードは [MIT License](LICENSE)。ブログ記事（`src/content/`）と画像（`public/`・`src/assets/`）は MIT の対象外で、無断での転載・再利用を禁じる。
