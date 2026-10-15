import type { APIRoute } from 'astro';
import { highlights } from '../data/career';
import { profile, ratings } from '../data/profile';
import { ogText, renderOgImage } from '../lib/og';

const { div, colors } = ogText;

export const GET: APIRoute = () =>
  renderOgImage([
    div({ fontSize: '72px', fontWeight: 700, color: colors.white }, profile.name),
    div({ marginTop: '16px', fontSize: '34px', color: colors.text }, profile.affiliation),
    div(
      { marginTop: '40px', flexWrap: 'wrap', gap: '14px' },
      highlights.map((h) =>
        div(
          {
            fontSize: '26px',
            color: colors.white,
            padding: '8px 22px',
            borderRadius: '9999px',
            border: `2px solid ${colors.primary}`,
            backgroundColor: 'rgba(99,102,241,0.25)',
          },
          h.label,
        ),
      ),
    ),
    div({ marginTop: '24px', fontSize: '26px', color: colors.muted }, ratings.join('・')),
  ]);
