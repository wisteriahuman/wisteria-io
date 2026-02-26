// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://wisteria-io.com',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    server: {
      allowedHosts: ['wisteria-io.com', 'www.wisteria-io.com'],
    },

    plugins: [tailwindcss()],
  },
});