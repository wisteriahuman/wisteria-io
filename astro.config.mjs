// @ts-check

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';
import rehypeWrapMermaid from './src/lib/rehype-wrap-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://wisteria-io.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  // CSS は 5KB ほどなので HTML に埋め込み、描画前の往復を1回減らす（ADR-009）
  build: { inlineStylesheets: 'always' },
  markdown: {
    // 図はビルド時に SVG にし、閲覧時に mermaid を読み込まない（ADR-014）
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          // Playwright のブラウザを別に入れず、手元と GitHub のマシンにある Chrome を使う
          launchOptions: { channel: 'chrome' },
          mermaidConfig: {
            // HTML のラベルは記事の CSS の影響を受けて崩れるため、SVG の文字で描く
            htmlLabels: false,
            flowchart: { htmlLabels: false },
            theme: 'base',
            // 色は src/styles/global.css のトークンと同じ値にする（ADR-016）
            themeVariables: {
              background: '#fdfdfa',
              primaryColor: '#fdfdfa',
              primaryTextColor: '#1d1f24',
              primaryBorderColor: '#24489a',
              secondaryColor: '#fdfdfa',
              secondaryTextColor: '#1d1f24',
              secondaryBorderColor: '#24489a',
              tertiaryColor: '#fdfdfa',
              lineColor: '#4f5560',
              textColor: '#1d1f24',
              fontFamily: 'Inter, Hiragino Sans, Noto Sans CJK JP, system-ui, sans-serif',
              fontSize: '14px',
              nodeBorder: '#24489a',
              nodeTextColor: '#1d1f24',
              edgeLabelBackground: '#fdfdfa',
              clusterBkg: '#fdfdfa',
              clusterBorder: '#b9d4ea',
            },
          },
        },
      ],
      rehypeWrapMermaid,
    ],
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
