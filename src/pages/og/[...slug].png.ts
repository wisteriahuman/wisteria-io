import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.data.title, tags: post.data.tags },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, tags } = props as { title: string; tags: string[] };

  const fontData = await fetch(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap',
  )
    .then((res) => res.text())
    .then((css) => {
      const url = css.match(
        /src:\s*url\(([^)]+)\)\s*format\('(?:woff2|truetype|opentype)'\)/,
      );
      if (!url) throw new Error('Font URL not found');
      return fetch(url[1]);
    })
    .then((res) => res.arrayBuffer());

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          backgroundColor: '#0f172a',
          fontFamily: 'Noto Sans JP',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                width: '80px',
                height: '4px',
                backgroundColor: '#6366f1',
                marginBottom: '32px',
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: title.length > 30 ? '42px' : '52px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.4,
                marginBottom: '32px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '40px',
              },
              children: tags.map((tag) => ({
                type: 'div',
                props: {
                  style: {
                    fontSize: '18px',
                    color: '#94a3b8',
                    padding: '4px 16px',
                    borderRadius: '9999px',
                    border: '1px solid #334155',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  },
                  children: tag,
                },
              })),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#6366f1',
                    },
                    children: 'wisteria',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '18px',
                      color: '#94a3b8',
                    },
                    children: 'wisteria-io.com',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
