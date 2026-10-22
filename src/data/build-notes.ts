// 「この部分の作り」の対応表（ADR-017、DS-12）。セクションごとに、決めた ADR とコードのファイルを1か所に書く
// PR はここに書かない。ファイルの git の履歴からビルド時に拾う
export type SectionId = 'top' | 'experience' | 'projects' | 'skills' | 'about' | 'links';

export const buildNotes: Record<SectionId, { adrs: number[]; files: string[] }> = {
  top: {
    adrs: [7, 16, 9, 19],
    files: [
      'src/components/Hero.astro',
      'src/components/Stickers.astro',
      'src/data/profile.ts',
      'src/data/career.ts',
      'src/lib/person.ts',
      'src/layouts/Layout.astro',
    ],
  },
  experience: { adrs: [7, 16], files: ['src/components/Experience.astro', 'src/data/career.ts'] },
  projects: { adrs: [7, 16], files: ['src/components/Projects.astro', 'src/data/projects.ts'] },
  skills: { adrs: [16], files: ['src/components/Skills.astro'] },
  about: { adrs: [8, 16], files: ['src/components/About.astro'] },
  links: {
    adrs: [11, 6, 16, 19],
    files: [
      'src/components/Links.astro',
      'src/components/Stickers.astro',
      'src/components/AskAI.astro',
      'src/pages/llms.txt.ts',
      'serve.cjs',
    ],
  },
};
