import type { APIRoute } from 'astro';
import { renderOgImage, ogText } from '../lib/og';
import { profile } from '../data/profile';
import { highlights } from '../data/career';

const { div, colors } = ogText;

export const GET: APIRoute = () =>
  renderOgImage([
    div({ fontSize: '72px', fontWeight: 700, color: colors.white }, profile.name),
    div({ marginTop: '12px', fontSize: '44px', fontWeight: 700, color: colors.text }, profile.tagline),
    div({ marginTop: '16px', fontSize: '28px', color: colors.muted }, profile.affiliation),
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
  ]);
