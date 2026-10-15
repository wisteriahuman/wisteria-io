// @ts-check

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://wisteria-io.com',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  // CSS は 5KB ほどなので HTML に埋め込み、描画前の往復を1回減らす（ADR-009）
  build: { inlineStylesheets: 'always' },
  markdown: {
    shikiConfig: {
      // github-dark はコメントの色のコントラストが足りないため、github-dark-default を使う
      theme: 'github-dark-default',
    },
  },
  vite: {
    server: {
      allowedHosts: ['wisteria-io.com', 'www.wisteria-io.com'],
    },

    plugins: [tailwindcss()],
  },
});
