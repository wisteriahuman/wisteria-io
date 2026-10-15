// 紙の上の端の、リングから破り取った跡（ADR-016）。紙の番号を種にした乱数で、紙ごとに違う破れ方をビルド時に作る。
// 穴は機械で開けるので等間隔のまま、ちぎれ方（穴の深さ・間の切れ端の高さとギザギザ）だけを変える。
// 色は src/styles/global.css の --color-paper と --color-desk と同じ値

const PAPER = '#fdfdfa';
const DESK = '#e7e5df';
// 幅 900・高さ 20 の絵。紙の上端は y = 12。CSS で 56.25rem × 1.25rem に描く
const WIDTH = 900;
const EDGE = 12;
const PITCH = 28;

// 種が同じなら毎回同じ並びを返す乱数（mulberry32）
const random = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const n = (v: number) => Math.round(v * 10) / 10;

export function tornEdge(seed: number): string {
  const rand = random(seed);
  const holes: { x: number; r: number }[] = [];
  for (let x = PITCH / 2; x < WIDTH + PITCH; x += PITCH) {
    // 深くちぎれた穴・浅い穴が混ざる
    holes.push({ x, r: rand() < 0.15 ? 2.2 + rand() : 3.6 + rand() * 1.4 });
  }

  let shapes = '';
  for (let i = 0; i < holes.length - 1; i++) {
    // 穴の幅より外から切れ端を始め、穴が上へ開いて見えるようにする
    const from = holes[i].x + holes[i].r * 1.05;
    const to = holes[i + 1].x - holes[i + 1].r * 1.05;
    // 間の切れ端。ときどき根元から取れてほとんど残らない、ときどき長い切れ端が立つ
    const kind = rand();
    const base = kind < 0.08 ? 1 : 3 + rand() * 4;
    const steps = 3 + Math.floor(rand() * 4);
    const points = [`${n(from)},${EDGE}`];
    for (let k = 0; k <= steps; k++) {
      const x = from + ((to - from) * k) / steps + (rand() - 0.5) * 1.5;
      let h = base + (rand() - 0.5) * 3;
      if (kind > 0.9 && k === Math.floor(steps / 2)) h = 9 + rand() * 2;
      // 穴の際では、紙は穴へ向かって低くちぎれている
      if (k === 0 || k === steps) h *= 0.4;
      points.push(`${n(x)},${n(EDGE - Math.max(0.5, h))}`);
    }
    points.push(`${n(to)},${EDGE}`);
    shapes += `<polygon points='${points.join(' ')}' fill='${PAPER}'/>`;
  }
  for (const h of holes) {
    shapes += `<circle cx='${n(h.x + (rand() - 0.5) * 0.8)}' cy='${n(EDGE + (rand() - 0.5) * 1.2)}' r='${n(h.r)}' fill='${DESK}'/>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${WIDTH}' height='20' viewBox='0 0 ${WIDTH} 20'>${shapes}</svg>`;
  return `url("data:image/svg+xml,${svg.replaceAll('#', '%23').replaceAll('<', '%3C').replaceAll('>', '%3E')}")`;
}
