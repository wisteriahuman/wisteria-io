export type Project = {
  id: string;
  title: string;
  // 受賞の表記（経歴・最初の画面・OGP）に使う大会名
  event: string;
  desc: string;
  tech: string[];
  award: string | null;
  period: string;
  github?: string;
  link?: string;
};

// 受賞の強い順に並べる
export const projects: Project[] = [
  {
    id: 'fish-2024',
    title: 'ルート√X / 廃人X / 学内ハッカソン FISH',
    event: 'FISH',
    desc: '学内課題解決ハッカソン。バックエンド担当。来訪者向けルート検索APIを実装。優勝後、運用に向けて開発を継続中。',
    tech: ['Python', 'Flask', 'FastAPI'],
    award: '優勝',
    period: '2024/10/18 - 2024/10/20',
    link: 'https://www.fun.ac.jp/activity/25782',
  },
  {
    id: 'p2hacks-2025',
    title: 'リフレクト新世界 / FUtureNova / P2HACKS 2025',
    event: 'P2HACKS 2025',
    desc: 'チーム「FUtureNova」として学内ハッカソン「P2HACKS2025」に参加。バックエンド担当。DB設計およびAI画像生成バッチ処理を実装。GPT-4.1とGeminiを組み合わせたマルチLLMワークフローを構築。',
    tech: ['TypeScript', 'Hono', 'Supabase', 'Drizzle ORM', 'OpenAI API', 'Gemini API'],
    award: 'Directorz賞',
    period: '2025/12/13 - 2025/12/21',
    github: 'https://github.com/p2hacks2025/pre-03',
  },
  {
    id: 'p2hacks-2024',
    title: 'ぴこるー / #TweetAvalanche / P2HACKS 2024',
    event: 'P2HACKS 2024',
    desc: 'チーム「#TweetAvalanche」として学内ハッカソン「P2HACKS2024」に参加。バックエンド担当。画像解析APIの実装を担当。',
    tech: ['Python', 'Flask'],
    award: 'サイバーエージェント賞',
    period: '2024/12/7 - 2024/12/15',
    github: 'https://github.com/p2hacks2024/pre-03',
  },
  {
    id: 'jphacks-2025',
    title: 'パキッとクネクネタスク / FUtureNova / JPHACKS 2025',
    event: 'JPHACKS 2025',
    desc: 'チーム「FUtureNova」として国内最大級のハッカソン「JPHACKS 2025」札幌に参加。バックエンド担当。DB設計（共同）およびAPI実装。',
    tech: ['TypeScript', 'tRPC', 'Next.js'],
    award: null,
    period: '2025/10/18 - 2025/10/19',
    github: 'https://github.com/jphacks/sp_2502',
  },
  {
    id: 'fun-developers-hub',
    title: 'FUN Developers Hub / 高度ICT演習',
    event: '高度ICT演習',
    desc: '学内演習。Go + Echoを用いたバックエンド開発に参加。エラーハンドリング改善やロガー実装に取り組んだ。',
    tech: ['Go', 'Echo', 'zerolog'],
    award: null,
    period: '2025/4 - 現在',
    github: 'https://github.com/fun-developers-hub',
  },
];
