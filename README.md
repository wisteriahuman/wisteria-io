# wisteria-io

wisteria のポートフォリオサイト。

🔗 **https://wisteria-io.com**

## Tech Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- Self-hosted on Mac mini via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- CI/CD: GitHub Actions (self-hosted runner)

## Development

このサイトは [Claude](https://claude.ai) (Anthropic) を活用して開発しました。

```bash
pnpm install
pnpm dev
```

ビルド結果が段階①の仕様を満たすかは `pnpm build && pnpm check` で確かめる。

## Deploy

`main` ブランチへの push で GitHub Actions が自動ビルド・検査・デプロイします。
