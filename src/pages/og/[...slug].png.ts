import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { noteDate } from '../../lib/last-updated';
import { ogText, renderOgImage } from '../../lib/og';
import { postNumbers } from '../../lib/posts';

const { div, colors, LINE } = ogText;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const numbers = postNumbers(posts);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.data.title, no: numbers.get(post.slug) ?? 0, date: noteDate(post.data.pubDate) },
  }));
};

// 記事の紙。記事のページと同じ No.・Date と、破り取った跡（記事のページと同じ種）
export const GET: APIRoute = async ({ props }) => {
  const { title, no, date } = props as { title: string; no: number; date: string };

  return renderOgImage(
    [
      div(
        {
          fontSize: '52px',
          fontWeight: 700,
          color: colors.ink,
          lineHeight: `${LINE * 2}px`,
          // 長いタイトルでも下の名前と URL を押し出さないよう3行で切る
          display: 'block',
          lineClamp: 3,
        },
        title,
      ),
    ],
    { no, date, seed: 200 + no },
  );
};
