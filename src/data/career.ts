import { projects } from './projects';

export type CareerItem = {
  // アンカー（#career-<id>）に使う
  id: string;
  period: string;
  title: string;
  subtitle: string;
  desc: string;
};

// 受賞の件数と内訳は作品の受賞から作る。受賞が増えたら projects.ts だけを直す
const awarded = projects.filter((p) => p.award);
const hackathonTitle = `ハッカソン受賞${awarded.length}回`;
const awardYears = awarded.map((p) => Number(p.period.slice(0, 4)));
const hackathonPeriod = `${Math.min(...awardYears)} 〜 ${Math.max(...awardYears)}`;

export const career: CareerItem[] = [
  {
    id: 'algo-method',
    period: '2026/2 〜 2026/7',
    title: '株式会社アルゴ式',
    subtitle: 'インターン',
    desc: '',
  },
  {
    id: 'go-college',
    period: '2026/2 〜 2026/3',
    title: 'サイバーエージェント Go College 2026',
    subtitle: 'インターン — ベストエンジニアリング賞',
    desc: 'Go言語でのサーバーサイド開発。アーキテクチャ設計とADRによるドキュメント整備を評価いただいた。',
  },
  {
    id: 'hakoreco',
    period: '2025/9 〜 現在',
    title: 'ハコレコドットコム株式会社',
    subtitle: 'アルバイト — Webエンジニア',
    desc: 'Next.js / React を用いたWeb制作・保守運用を担当。',
  },
  {
    id: 'icpc',
    period: '2025',
    title: 'ICPC 2025 アジア横浜大会',
    subtitle: '競技プログラミング',
    desc: 'ICPC アジア横浜地区大会に出場。',
  },
  {
    id: 'hackathons',
    period: hackathonPeriod,
    title: hackathonTitle,
    subtitle: 'バックエンド担当',
    desc: awarded.map((p) => `${p.event} ${p.award}`).join('・'),
  },
  {
    id: 'university',
    period: '2024/4 〜 現在',
    title: '公立はこだて未来大学',
    subtitle: 'システム情報科学部 情報アーキテクチャ学科 情報システムコース',
    desc: '大学からプログラミングに触れる。',
  },
  {
    id: 'high-school',
    period: '〜 2024/3',
    title: '不来方高等学校',
    subtitle: 'ハンドボール部 GK',
    desc: '',
  },
];

export type Highlight = {
  // career の id
  id: string;
  label: string;
};

// 最初の画面のチップとトップの OGP に、この順で出す
export const highlights: Highlight[] = [
  { id: 'go-college', label: 'Go College ベストエンジニアリング賞' },
  { id: 'hackathons', label: hackathonTitle },
  { id: 'icpc', label: 'ICPC 2025 横浜' },
];
