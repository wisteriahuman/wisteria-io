import satori from 'satori';
import sharp from 'sharp';
import { profile } from '../data/profile';

export type SatoriNode = {
  type: string;
  props: Record<string, unknown>;
};

// 色は src/styles/global.css のトークンと同じ値にする（ADR-016）
const colors = {
  bg: '#fbf8f1',
  primary: '#5a4a8c',
  soft: '#ece6f2',
  ink: '#1f1d1a',
  text: '#1f1d1a',
  muted: '#5c5650',
};

// フォントはビルド中に1回だけ取得し、全ての OGP 画像で使い回す
let fontsPromise: Promise<{ weight: 400 | 700; data: ArrayBuffer }[]> | undefined;

async function fetchFont(weight: 400 | 700): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&display=swap`).then(
    (res) => {
      if (!res.ok) throw new Error(`Google Fonts の CSS を取得できない: ${res.status}`);
      return res.text();
    },
  );
  const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:woff2|truetype|opentype)'\)/);
  if (!url) throw new Error('Font URL not found');
  return fetch(url[1]).then((res) => {
    if (!res.ok) throw new Error(`フォントを取得できない: ${res.status}`);
    return res.arrayBuffer();
  });
}

function loadFonts() {
  fontsPromise ??= Promise.all(
    ([400, 700] as const).map(async (weight) => ({ weight, data: await fetchFont(weight) })),
  );
  return fontsPromise;
}

const div = (style: Record<string, unknown>, children?: unknown): SatoriNode => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

export const ogText = { div, colors };

// 背景・上の線・下の名前と URL を共通で描き、body を中央に置いた PNG を返す
export async function renderOgImage(body: SatoriNode[]): Promise<Response> {
  const fonts = await loadFonts();

  const svg = await satori(
    div(
      {
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        padding: '64px 80px',
        backgroundColor: colors.bg,
        fontFamily: 'Noto Sans JP',
      },
      [
        div({ width: '80px', height: '4px', backgroundColor: colors.primary }),
        div({ flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }, body),
        div({ alignItems: 'center', gap: '16px' }, [
          div({ fontSize: '26px', fontWeight: 700, color: colors.primary }, `${profile.name} (${profile.handle})`),
          div({ fontSize: '22px', color: colors.muted }, 'wisteria-io.com'),
        ]),
      ],
    ) as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: fonts.map(({ weight, data }) => ({ name: 'Noto Sans JP', data, weight, style: 'normal' as const })),
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
