import { highlights } from './career';

export const profile = {
  name: '藤井 優気',
  handle: 'wisteria',
  affiliation: '28卒・公立はこだて未来大学',
};

// 実績チップの下に小さく出す
export const ratings = ['AtCoder 水色', 'paiza Sランク'];

// description に使う。姿勢の一行は置かず、所属と実績の事実だけで書く
export const summary = `${profile.affiliation}。${highlights.map((h) => h.label).join('・')}`;
