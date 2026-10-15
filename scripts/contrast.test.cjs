// global.css の @theme の色から、文字と地のコントラストが WCAG の 4.5:1 以上かを確かめる（ADR-016）
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../src/styles/global.css'), 'utf8');
const theme = css.match(/@theme\s*{([\s\S]*?)}/)?.[1] ?? '';
const color = (name) => {
  const m = theme.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `--color-${name} が @theme に無い`);
  return m[1];
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// 文字の色 × 地の色。罫線と余白線は飾りの線なので対象にしない
const pairs = [
  ['ink', 'paper'],
  ['ink-muted', 'paper'],
  ['pen', 'paper'],
  ['ink', 'marker'],
  ['ink-muted', 'marker'],
  ['pen', 'marker'],
  // 上の固定のナビは机の色の上に載る
  ['ink', 'desk'],
  ['ink-muted', 'desk'],
];

for (const [fg, bg] of pairs) {
  test(`${fg} の文字は ${bg} の地で 4.5:1 以上`, () => {
    const r = ratio(color(fg), color(bg));
    assert.ok(r >= 4.5, `${fg} / ${bg} = ${r.toFixed(2)}`);
  });
}
