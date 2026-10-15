// @ts-check

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';
import rehypeWrapMermaid from './src/lib/rehype-wrap-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://wisteria-io.com',
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
            themeVariables: {
              background: '#1e293b',
              primaryColor: '#334155',
              primaryTextColor: '#e2e8f0',
              primaryBorderColor: '#6366f1',
              secondaryColor: '#1e293b',
              secondaryTextColor: '#e2e8f0',
              secondaryBorderColor: '#818cf8',
              tertiaryColor: '#1e293b',
              lineColor: '#94a3b8',
              textColor: '#e2e8f0',
              fontFamily: 'Inter, Hiragino Sans, Noto Sans CJK JP, system-ui, sans-serif',
              fontSize: '14px',
              nodeBorder: '#6366f1',
              nodeTextColor: '#e2e8f0',
              edgeLabelBackground: '#1e293b',
              clusterBkg: '#1e293b',
              clusterBorder: '#334155',
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
