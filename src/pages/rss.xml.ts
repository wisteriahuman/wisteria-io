import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

// 記事の RSS。プロフィールの README が毎日読み、新しい3件を「最近書いた記事」に出す（ADR-018）
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  return rss({
    title: 'wisteria のブログ',
    description: '技術的なメモや振り返りを書いています',
    site: context.site ?? 'https://wisteria-io.com',
    items: posts.map((post) => ({
      title: post.data.title,
      link: `/blog/${post.slug}/`,
      pubDate: post.data.pubDate,
      description: post.data.description,
    })),
    customData: '<language>ja</language>',
  });
}
