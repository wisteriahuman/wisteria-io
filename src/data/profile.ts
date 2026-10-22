import { highlights } from './career';

export const profile = {
  name: '藤井 優気',
  handle: 'wisteria',
  account: 'wisteriahuman',
  reading: 'ふじい ゆうき',
  university: '公立はこだて未来大学',
  url: 'https://wisteria-io.com/',
  image: '/avatar.jpg',
  affiliation: '28卒・公立はこだて未来大学',
};

// 実績チップの下に小さく出す
export const ratings = ['AtCoder 水色', 'paiza Sランク'];

// description に使う。姿勢の一行は置かず、所属と実績の事実だけで書く
export const summary = `${profile.name}（${profile.handle}）のポートフォリオ。${profile.affiliation}。${highlights.map((h) => h.label).join('・')}`;

// 画面のシールと構造化データ、llms.txt で共用する本人のアカウント
export const socialLinks = {
  github: 'https://github.com/wisteriahuman',
  x: 'https://x.com/wisteria_man',
  atcoder: 'https://atcoder.jp/users/wisteriahuman',
};
