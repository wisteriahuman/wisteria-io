// ビルド結果（dist/）が段階①の仕様を満たすか確かめる。pnpm build の後に pnpm check で実行する
import { readFileSync, existsSync } from 'node:fs';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../dist/${path}`, import.meta.url));

const html = read('index.html');
const summary = '28卒・公立はこだて未来大学。Go College ベストエンジニアリング賞・ハッカソン受賞3回・ICPC 2025 横浜';

check(html.includes('<title>藤井 優気 (wisteria) | ポートフォリオ</title>'), 'title');
check(html.includes(`<meta name="description" content="${summary}"`), 'description');
check(html.includes('<meta property="og:image" content="https://wisteria-io.com/og.png"'), 'og:image');
check(exists('og.png'), '/og.png が無い');

const hero = html.match(/<section id="top"[\s\S]*?<\/section>/)?.[0] ?? '';
check(hero.includes('藤井 優気'), 'Hero に名前');
// 姿勢の一行は置かない（事実だけで伝える）
check(!html.includes('作りきる'), '一行が残っている');
const heroText = hero.replace(/<[^>]+>/g, '');
check(heroText.includes('AtCoder 水色') && heroText.includes('paiza Sランク'), 'Hero に AtCoder 水色・paiza Sランク');
check(hero.includes('28卒・公立はこだて未来大学'), 'Hero に所属');
const chips = [...hero.matchAll(/href="#(career-[\w-]+)"/g)].map((m) => m[1]);
check(chips.length === 3, `チップが3つ（実際: ${chips.length}）`);
for (const id of chips) check(html.includes(`id="${id}"`), `チップの行き先 #${id} が無い`);
check(hero.includes('ハッカソン受賞3回'), 'チップ「ハッカソン受賞3回」');

check(html.includes('FISH 優勝・P2HACKS 2025 Directorz賞・P2HACKS 2024 サイバーエージェント賞'), '経歴にハッカソンの内訳');
check(html.includes('2026/2 〜 2026/7'), 'アルゴ式の期間');

const projects = html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] ?? '';
check((projects.match(/data-project/g) ?? []).length === 5, '作品が5件');
check(projects.includes('FUN Developers Hub'), '作品に FUN Developers Hub');
check(!html.includes('yajiuma'), 'yajiuma.nvim が載っている');

const order = ['experience', 'projects', 'skills', 'about', 'links'].map((id) => html.indexOf(`<section id="${id}"`));
check(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), `セクションの順番（${order}）`);

const about = html.match(/<section id="about"[\s\S]*?<\/section>/)?.[0] ?? '';
check(!about.includes('3年'), 'About に「3年」');
check(about.includes('Ubuntu Server'), 'About に Ubuntu Server');

// © などの記号は除き、絵文字として表示される文字だけを見る
check(!/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'トップに絵文字が残っている');
check(!html.includes('family=Noto+Sans+JP'), 'ページで Noto Sans JP を読み込んでいる');
check(/<noscript>[^]*fonts\.googleapis\.com[^]*<\/noscript>/.test(html), 'noscript のフォント読み込み');

const slugs = ['hello-world', 'neovim-intro-part1', 'neovim-intro-part2', 'neovim-intro-part3', 'golangci-lint', 'errors-are-values', 'ca-go-college-2026'];
for (const slug of slugs) {
  check(exists(`blog/${slug}/index.html`), `/blog/${slug} が無い`);
  check(exists(`og/${slug}.png`), `/og/${slug}.png が無い`);
}

if (failures.length) {
  console.error(`NG ${failures.length}件:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
