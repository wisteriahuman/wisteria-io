import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { ogText, renderOgImage } from '../../lib/og';

const { div, colors } = ogText;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.data.title },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };

  return renderOgImage([
    div(
      {
        fontSize: title.length > 30 ? '48px' : '60px',
        fontWeight: 700,
        color: colors.white,
        lineHeight: 1.4,
        // 長いタイトルでも下の名前と URL を押し出さないよう3行で切る
        display: 'block',
        lineClamp: 3,
      },
      title,
    ),
  ]);
};
