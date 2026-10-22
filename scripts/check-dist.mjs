// ビルド結果（dist/）が段階①の仕様を満たすか確かめる。pnpm build の後に pnpm check で実行する
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../dist/${path}`, import.meta.url));

const html = read('index.html');
const summary =
  '藤井 優気（wisteria）のポートフォリオ。28卒・公立はこだて未来大学。Go College ベストエンジニアリング賞・ハッカソン受賞3回・ICPC 2025 横浜';

check(html.includes('<title>藤井 優気 (wisteria) | ポートフォリオ</title>'), 'title');
check(html.includes(`<meta name="description" content="${summary}"`), 'description');
// 画像の URL に版を付け、Cloudflare の中継や SNS が古い画像を出し続けないようにする
check(
  /<meta property="og:image" content="https:\/\/wisteria-io\.com\/og\.png\?v=[0-9a-f]{7,}"/.test(html),
  'og:image に版が付いていない',
);
check(
  /<meta property="og:image" content="https:\/\/wisteria-io\.com\/og\/hello-world\.png\?v=[0-9a-f]{7,}"/.test(
    read('blog/hello-world/index.html'),
  ),
  '記事の og:image に版が付いていない',
);
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

check(
  html.includes('FISH 優勝・P2HACKS 2025 Directorz賞・P2HACKS 2024 サイバーエージェント賞'),
  '経歴にハッカソンの内訳',
);
check(html.includes('2026/2 〜 2026/7'), 'アルゴ式の期間');

const projects = html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] ?? '';
check((projects.match(/data-project/g) ?? []).length === 5, '作品が5件');
check(projects.includes('FUN Developers Hub'), '作品に FUN Developers Hub');
check(!html.includes('yajiuma'), 'yajiuma.nvim が載っている');

const order = ['experience', 'projects', 'skills', 'about', 'links'].map((id) => html.indexOf(`<section id="${id}"`));
check(
  order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])),
  `セクションの順番（${order}）`,
);

const about = html.match(/<section id="about"[\s\S]*?<\/section>/)?.[0] ?? '';
check(!about.includes('3年'), 'About に「3年」');
check(about.includes('Ubuntu Server'), 'About に Ubuntu Server');

// © などの記号は除き、絵文字として表示される文字だけを見る
check(
  !/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u.test(html.replace(/<script[\s\S]*?<\/script>/g, '')),
  'トップに絵文字が残っている',
);
check(!html.includes('family=Noto+Sans+JP'), 'ページで Noto Sans JP を読み込んでいる');
check(/<noscript>[\s\S]*fonts\.googleapis\.com[\s\S]*<\/noscript>/.test(html), 'noscript のフォント読み込み');

const slugs = [
  'hello-world',
  'neovim-intro-part1',
  'neovim-intro-part2',
  'neovim-intro-part3',
  'golangci-lint',
  'errors-are-values',
  'ca-go-college-2026',
];
for (const slug of slugs) {
  check(exists(`blog/${slug}/index.html`), `/blog/${slug} が無い`);
  check(exists(`og/${slug}.png`), `/og/${slug}.png が無い`);
}

// 図はビルド時に SVG にし、閲覧時に mermaid を読み込まない（ADR-014）
for (const [slug, count] of [
  ['neovim-intro-part1', 3],
  ['neovim-intro-part2', 2],
  ['neovim-intro-part3', 2],
]) {
  const post = read(`blog/${slug}/index.html`);
  const figures = (post.match(/<figure class="mermaid"[^>]*><svg/g) ?? []).length;
  check(figures === count, `/blog/${slug} の図が${count}つ（実際: ${figures}）`);
  check(!post.includes('mermaid.min.js'), `/blog/${slug} で mermaid を読み込んでいる`);
}

// 大学ノートの見た目（ADR-016）。ノートに無い部品（角の丸い面・枠・影・前の配色・浮き上がる動き）を残さない
const notNotebook = [
  'rounded',
  'border',
  'shadow',
  'ring',
  'backdrop-',
  'bg-surface',
  'bg-wisteria',
  'text-wisteria',
  'font-serif',
  'reveal',
  'paper-lines',
  'text-white',
  'bg-white',
  'bg-bg-',
  'text-text-',
  'text-accent',
  'bg-primary',
  'text-primary',
];
for (const page of [
  'index.html',
  'blog/index.html',
  'blog/errors-are-values/index.html',
  'blog/neovim-intro-part1/index.html',
]) {
  const body = read(page);
  const classes = [...body.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
  // hover: などの前置きを外して比べる
  const left = notNotebook.filter((t) => classes.some((c) => c.replace(/^([a-z0-9-]+:)+/, '').startsWith(t)));
  check(left.length === 0, `${page} にノートに無い部品のクラスが残っている: ${left.join(', ')}`);
  // 切り取ったリングノートのページを、セクションごとに1枚ずつ台紙に貼る
  check(/<main class="pad\b/.test(body), `${page} の本文がノートの紙の束（.pad）に載っていない`);
  const sheets = (body.match(/class="page[\s"]/g) ?? []).length;
  check(sheets >= (page === 'index.html' ? 6 : 1), `${page} の紙が足りない（${sheets}枚）`);
  check(!/page-left|page-right|class="spread/.test(body), `${page} に見開きが残っている`);
}
check(!/\.reveal\b/.test(html), '浮き上がる動きが残っている');
// 破り取ったページを台紙に貼った形（ADR-016）。貼った紙は動かさず、リングも描かない
check(!/animation-timeline/.test(html), '紙が動く指定が残っている');
check(!/--color-ring/.test(html), 'リングが残っている');
// 紙の上の端には、リングから破り取ったちぎれ跡を残す
check(/\.page:before\{[^}]*url\("?data:image\/svg\+xml/.test(html), '紙の上の端に破り取った跡が無い');
// GitHub・X・AtCoder へのリンクは紙に貼ったシール。ロゴだけのシールにも名前を付ける
for (const [where, part] of [
  ['最初の画面', hero],
  ['リンク', html.match(/<section id="links"[\s\S]*?<\/section>/)?.[0] ?? ''],
]) {
  const stickers = [...part.matchAll(/<a [^>]*class="sticker[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  check(stickers.length === 3, `${where}のシールが3枚（実際: ${stickers.length}）`);
  for (const s of stickers) check(/aria-label="[^"]+"|>\s*[A-Za-z]/.test(s), `${where}のシールに名前が無い`);
}
// 作品の受賞は朱色の判子（優勝・Directorz賞・サイバーエージェント賞）
check((projects.match(/class="stamp"/g) ?? []).length === 3, '作品の受賞の判子が3つ');
// 英字だけ手書きの書体。紙の上の欄の番号と日付に使う
check(html.includes('family=Caveat'), '手書きの書体（Caveat）を読み込んでいない');
check(
  /class="[^"]*\bfont-hand\b[^"]*">\d{4}\.\d{2}\.\d{2}</.test(html),
  '紙の上の Date が手書きの書体で書かれていない',
);
// 破れ方は紙ごとに違う（同じ形の繰り返しは機械が作ったように見える）
const torn = new Set([...html.matchAll(/--torn:\s*url\(([^)]*)\)/g)].map((m) => m[1]));
check(torn.size >= 6, `破り取った跡が紙ごとに違わない（${torn.size}通り）`);
// この部分の作り（ADR-017）。トップの6枚すべての最後にあり、ADR のリンクが1つ以上ある
const notes = [...html.matchAll(/<details class="build-note"[\s\S]*?<\/details>/g)].map((m) => m[0]);
check(notes.length === 6, `この部分の作りが6つ（実際: ${notes.length}）`);
for (const n of notes) check(/\/docs\/adr\/adr-\d{3}-/.test(n), 'この部分の作りに ADR のリンクが無い');
// PR は git の履歴から拾う。浅い clone だとほとんど空になる
check(
  notes.filter((n) => /\/pull\/\d+/.test(n)).length >= 5,
  'この部分の作りの多くに PR のリンクが無い（git の履歴が浅い？）',
);
// 改訂した ADR は、前の題を取り消し線で残す
check(/<s>紙の質感<\/s>/.test(html), '改訂した ADR-016 の前の題が取り消し線で残っていない');
// 記事の最後に、この記事の履歴
check(
  /<details class="build-note"[\s\S]*?この記事の履歴/.test(read('blog/hello-world/index.html')),
  '記事にこの記事の履歴が無い',
);
// PR が無いときの文言は事実どおりに（PR の運用より前のコミットはある）
const hello = read('blog/hello-world/index.html');
check(
  !html.includes('まだ変更の記録がない') && !hello.includes('まだ変更の記録がない'),
  '「まだ変更の記録がない」が残っている',
);
check(hello.includes('PR を通した変更はまだない'), '記事に「PR を通した変更はまだない」が無い');
// ADR のリンクは題名つき（読み上げのリンクの一覧で中身が分かる）
check(
  /<a href="[^"]*\/docs\/adr\/adr-016-[^"]*"[^>]*>\s*ADR-016 [^<]*<s>紙の質感<\/s>[^<]*見た目を/.test(html),
  'ADR のリンクに題名が入っていない',
);
// 赤い余白線は日本の大学ノートに無い。蛍光ペンの見本の切り替えは色を決めたので消す
check(!/--color-margin|data-marker|marker=yellow/.test(html), '赤い余白線か蛍光ペンの見本の切り替えが残っている');
check(/Date \d{4}\.\d{2}\.\d{2}/.test(html.replace(/<[^>]+>/g, '')), 'トップに Date の欄が無い');
check(/No\. \d+/.test(read('blog/hello-world/index.html').replace(/<[^>]+>/g, '')), '記事に No. の欄が無い');

// 記事の RSS（ADR-018）。プロフィールの README が、新しい記事の title・link・pubDate を読む
const feed = exists('rss.xml') ? read('rss.xml') : '';
check(feed.startsWith('<?xml') && feed.includes('<rss version="2.0"'), '/rss.xml が RSS 2.0 でない');
const feedItems = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const blogDir = new URL('../src/content/blog/', import.meta.url);
const published = readdirSync(blogDir).filter(
  (f) => /\.mdx?$/.test(f) && !/^draft:\s*true\s*$/m.test(readFileSync(new URL(f, blogDir), 'utf8')),
).length;
check(feedItems.length === published, `RSS の記事が公開中の${published}件でない（${feedItems.length}件）`);
check(
  feedItems.every((item) => ['title', 'link', 'pubDate', 'description'].every((tag) => item.includes(`<${tag}>`))),
  'RSS の記事に title・link・pubDate・description のどれかが無い',
);
check(
  feedItems.every((item) => /<link>https:\/\/wisteria-io\.com\/blog\/[\w-]+\/?<\/link>/.test(item)),
  'RSS の記事の link が記事の絶対 URL でない',
);
const feedDates = feedItems.map((item) => Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? ''));
check(
  feedDates.every((d, i) => !Number.isNaN(d) && (i === 0 || feedDates[i - 1] >= d)),
  'RSS の記事が新しい順でない',
);
check(
  /<link rel="alternate" type="application\/rss\+xml"[^>]*href="https:\/\/wisteria-io\.com\/rss\.xml"/.test(html),
  'head に RSS の link が無い',
);

// 検索と AI への入口（ADR-019）。生成された全 HTML とリンク先の実体を検査する。
const sitemap = read('sitemap-0.xml');
const llms = read('llms.txt');
const searchPages = [
  'index.html',
  'blog/index.html',
  ...readdirSync(new URL('../dist/blog', import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `blog/${entry.name}/index.html`),
];
const personData = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '{}');
check(
  personData['@type'] === 'ProfilePage' && personData.mainEntity?.['@type'] === 'Person',
  'トップの ProfilePage / Person',
);
const person = personData.mainEntity ?? {};
check(person.name === '藤井 優気' && person.affiliation?.name === '公立はこだて未来大学', 'Person の実名・所属');
check(
  person.url === 'https://wisteria-io.com/' &&
    person.image === 'https://wisteria-io.com/avatar.jpg' &&
    exists('avatar.jpg'),
  'Person の本人 URL・画像',
);
check(
  ['藤井優気', 'wisteria', 'wisteriahuman', 'ふじい ゆうき'].every((name) => person.alternateName?.includes(name)),
  'Person の別名',
);
check(
  person.sameAs?.length === 3 && person.sameAs.every((url) => html.includes(`href="${url}"`)),
  'sameAs が画面の外部プロフィールと一致しない',
);
check(hero.includes('ふじい ゆうき') && hero.includes('wisteriahuman'), '読み・アカウント名が画面に無い');
for (const file of searchPages) {
  const body = read(file);
  const path = file.replace(/index\.html$/, '');
  const canonical = `https://wisteria-io.com/${path}`;
  check(body.includes(`<link rel="canonical" href="${canonical}"`), `${file} の canonical`);
  check(body.includes(`<meta property="og:url" content="${canonical}"`), `${file} の og:url`);
  check(sitemap.includes(`<loc>${canonical}</loc>`), `${file} が sitemap に無い`);
  check(
    /^<!doctype html><!--[\s\S]*?作りは GitHub と docs\/ にあります[\s\S]*?--><html/i.test(body),
    `${file} の先頭コメント`,
  );
  check(!/<meta[^>]+(?:noindex|nosnippet)/i.test(body), `${file} に検索よけがある`);
  const links = [...body.matchAll(/href="(https:\/\/(?:claude\.ai\/new|chatgpt\.com\/)\?q=[^"]+)"/g)].map(
    (match) => new URL(match[1]),
  );
  const isArticle = file.startsWith('blog/') && file !== 'blog/index.html';
  check(links.length === (file === 'blog/index.html' ? 0 : 2), `${file} の AI リンク数`);
  for (const link of links)
    check(
      link.searchParams.get('q')?.includes(isArticle ? canonical : 'https://wisteria-io.com/llms.txt'),
      `${file} の AI 質問に対象 URL が無い`,
    );
  if (isArticle) {
    const article = JSON.parse(body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '{}');
    check(
      article['@type'] === 'BlogPosting' &&
        article.author?.['@id'] === person['@id'] &&
        article.author?.name === person.name,
      `${file} の著者の対応`,
    );
    check(article.mainEntityOfPage === canonical && body.includes('rel="author"'), `${file} の記事 URL・著者リンク`);
    check(llms.includes(canonical), `${file} が llms.txt に無い`);
  }
}
check(
  (llms.match(/https:\/\/wisteria-io\.com\/blog\/[\w-]+\//g) ?? []).length === published,
  'llms.txt の記事数が公開記事数と違う',
);
for (const match of llms.matchAll(/\]\((https:\/\/wisteria-io\.com\/[^)]*)\)/g)) {
  const url = new URL(match[1]);
  const file = url.pathname === '/' ? 'index.html' : `${url.pathname.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
  check(exists(file), `llms.txt のリンク先が無い: ${url.href}`);
  if (url.hash) check(read(file).includes(`id="${url.hash.slice(1)}"`), `llms.txt のアンカーが無い: ${url.href}`);
}

if (failures.length) {
  console.error(`NG ${failures.length}件:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
