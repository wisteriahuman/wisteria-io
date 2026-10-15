import satori from 'satori';
import sharp from 'sharp';
import { profile } from '../data/profile';
import { tornEdgeSvg } from './torn-edge';

export type SatoriNode = {
  type: string;
  props: Record<string, unknown>;
};

// 色は src/styles/global.css のトークンと同じ値にする（ADR-016）
const colors = {
  paper: '#fdfdfa',
  desk: '#e7e5df',
  rule: '#b9d4ea',
  pen: '#24489a',
  marker: '#fbef9f',
  ink: '#1d1f24',
  muted: '#4f5560',
};

// サイトの 28px の罫線を、OGP の大きさ（1200×630）に合わせて 1.5 倍にする
const LINE = 42;

// フォントはビルド中に1回だけ取得し、全ての OGP 画像で使い回す。手書きは英字だけ（Caveat）
type Font = { name: string; weight: 400 | 700; data: ArrayBuffer };
let fontsPromise: Promise<Font[]> | undefined;

async function fetchFont(family: string, weight: 400 | 700): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`).then(
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
  fontsPromise ??= Promise.all([
    ...([400, 700] as const).map(async (weight) => ({
      name: 'Noto Sans JP',
      weight,
      data: await fetchFont('Noto+Sans+JP', weight),
    })),
    (async () => ({ name: 'Caveat', weight: 700 as const, data: await fetchFont('Caveat', 700) }))(),
  ]);
  return fontsPromise;
}

const div = (style: Record<string, unknown>, children?: unknown): SatoriNode => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

// 蛍光ペンを引いた1行
const marked = (text: string, style: Record<string, unknown> = {}) =>
  div({ ...style }, [
    div(
      { backgroundImage: `linear-gradient(to bottom, transparent 55%, ${colors.marker} 55%)`, padding: '0 2px' },
      text,
    ),
  ]);

// 紙の上の欄。印刷の「No.」「Date」に、手書きで書き込む
const pageHead = (no: number | undefined, date: string) =>
  div({ justifyContent: 'flex-end', alignItems: 'flex-end', height: `${LINE}px`, gap: '28px', color: colors.muted }, [
    ...(no === undefined
      ? []
      : [
          div({ alignItems: 'flex-end', gap: '8px', fontSize: '22px' }, [
            'No.',
            div({ fontFamily: 'Caveat', fontSize: '34px', color: colors.pen, lineHeight: 1 }, String(no)),
          ]),
        ]),
    div({ alignItems: 'flex-end', gap: '8px', fontSize: '22px' }, [
      'Date',
      div({ fontFamily: 'Caveat', fontSize: '34px', color: colors.pen, lineHeight: 1 }, date),
    ]),
  ]);

export const ogText = { div, marked, colors, LINE };

// 台紙に、リングノートから破り取った紙を1枚貼った絵（ADR-016）。紙の上に No.・Date を書き、body を紙の中に書く
export async function renderOgImage(
  body: SatoriNode[],
  page: { no?: number; date: string; seed: number },
): Promise<Response> {
  const fonts = await loadFonts();
  const torn = `data:image/svg+xml,${encodeURIComponent(tornEdgeSvg(page.seed))}`;

  const svg = await satori(
    div(
      { width: '100%', height: '100%', backgroundColor: colors.desk, padding: '0 60px', fontFamily: 'Noto Sans JP' },
      [
        div(
          {
            position: 'relative',
            flexDirection: 'column',
            width: '100%',
            marginTop: '48px',
            padding: `${LINE}px 64px 0`,
            backgroundColor: colors.paper,
            backgroundImage: `linear-gradient(to bottom, transparent ${LINE - 2}px, ${colors.rule} ${LINE - 2}px)`,
            backgroundSize: `100% ${LINE}px`,
            color: colors.ink,
          },
          [
            // 紙の上の端の破り取った跡。絵の高さ 20 のうち、紙の上端は 12
            {
              type: 'img',
              props: { src: torn, width: 1080, height: 24, style: { position: 'absolute', top: '-14.4px', left: 0 } },
            },
            pageHead(page.no, page.date),
            div({ flexDirection: 'column', marginTop: `${LINE}px` }, body),
            div(
              {
                position: 'absolute',
                top: `${LINE * 12}px`,
                left: '64px',
                alignItems: 'flex-end',
                gap: '16px',
                height: `${LINE}px`,
              },
              [
                div({ fontSize: '24px', fontWeight: 700, color: colors.pen }, `${profile.name} (${profile.handle})`),
                div({ fontSize: '22px', color: colors.muted }, 'wisteria-io.com'),
              ],
            ),
          ],
        ),
      ],
    ) as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: fonts.map(({ name, weight, data }) => ({ name, data, weight, style: 'normal' as const })),
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
