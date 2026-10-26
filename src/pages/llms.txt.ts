import { getCollection } from 'astro:content';
import { career } from '../data/career';
import { profile, ratings, socialLinks, summary } from '../data/profile';
import { projects } from '../data/projects';

// ビルド時に画面と同じデータから作る。Google 向けの特別な指示ではない（ADR-019）。
export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const text = [
    `# ${profile.name}（${profile.handle}）`,
    '',
    `> ${summary}`,
    '',
    `読み: ${profile.reading}。アカウント名: ${profile.account}。`,
    '本人のポートフォリオに掲載している情報の案内です。詳細と文脈はリンク先の本文で確認できます。',
    '',
    '## プロフィール',
    `- [ポートフォリオ](${profile.url}): 所属・経歴・作品・技術・自己紹介`,
    `- ${ratings.join('・')}`,
    ...Object.entries(socialLinks).map(([name, url]) => `- [${name}](${url})`),
    '',
    '## 経歴',
    ...career.map((item) => `- ${item.period}: ${item.title}。${item.subtitle}。${item.desc}`),
    '',
    '## 作品',
    ...projects.flatMap((project) => [
      `- [${project.title}](${profile.url}#project-${project.id}): ${project.desc}${project.award ? ` ${project.award}。` : ''}`,
      ...(project.github ? [`  - [リポジトリ](${project.github})`] : []),
      ...(project.report
        ? [`  - [${project.report.publisher}の開催・受賞報告：${project.report.title}](${project.report.url})`]
        : []),
      ...(project.link ? [`  - [関連ページ](${project.link})`] : []),
    ]),
    '',
    '## 記事',
    `- [記事一覧](${profile.url}blog/)`,
    ...posts.map((post) => `- [${post.data.title}](${profile.url}blog/${post.slug}/): ${post.data.description}`),
    '',
    '## サイトの作り',
    '- [GitHub](https://github.com/wisteriahuman/wisteria-io)',
    '- [設計と判断の記録](https://github.com/wisteriahuman/wisteria-io/tree/main/docs)',
    '',
  ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
