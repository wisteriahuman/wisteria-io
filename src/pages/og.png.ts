import type { APIRoute } from 'astro';
import { highlights } from '../data/career';
import { profile, ratings } from '../data/profile';
import { lastUpdated } from '../lib/last-updated';
import { ogText, renderOgImage } from '../lib/og';

const { div, marked, colors, LINE } = ogText;

// トップの最初の紙（No. 1）と同じ中身。実績は蛍光ペンを引いた行（ADR-016）
export const GET: APIRoute = () =>
  renderOgImage(
    [
      div({ fontSize: '64px', fontWeight: 700, color: colors.ink, lineHeight: `${LINE * 2}px` }, profile.name),
      div({ fontSize: '30px', color: colors.ink, lineHeight: `${LINE}px` }, profile.affiliation),
      div({ flexDirection: 'column', marginTop: `${LINE}px` }, [
        ...highlights.map((h) =>
          marked(h.label, { fontSize: '28px', fontWeight: 700, color: colors.ink, lineHeight: `${LINE}px` }),
        ),
        div({ fontSize: '26px', color: colors.muted, lineHeight: `${LINE}px` }, ratings.join('・')),
      ]),
    ],
    { no: 1, date: lastUpdated, seed: 1 },
  );
