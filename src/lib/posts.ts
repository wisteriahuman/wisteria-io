import type { CollectionEntry } from 'astro:content';

// 記事の No. は、公開日の古い順に何本目か（ADR-016）。記事のページと OGP 画像の両方で使う
export function postNumbers(posts: CollectionEntry<'blog'>[]): Map<string, number> {
  const ordered = [...posts].sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
  return new Map(ordered.map((post, i) => [post.slug, i + 1]));
}
