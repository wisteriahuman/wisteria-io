// 「この部分の作り」の対応表と、ADR・PR を読む処理（ADR-017、DS-12）
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { buildNotes } from '../src/data/build-notes.ts';
import { adr } from '../src/lib/adr.ts';
import { parsePrs, prsFor } from '../src/lib/history.ts';

test('件名の末尾の (#N) から PR を拾う', () => {
  assert.deepEqual(parsePrs(['feat: 見た目を大学ノートにする (#12)']), [
    {
      number: 12,
      title: 'feat: 見た目を大学ノートにする',
      url: 'https://github.com/wisteriahuman/wisteria-io/pull/12',
    },
  ]);
});

test('(#N) の無い件名は捨てる（PR のビルドの merge commit など）', () => {
  assert.deepEqual(parsePrs(['Merge abc into def', 'fix: 直す']), []);
});

test('件名の途中の (#N) は PR にしない', () => {
  assert.deepEqual(parsePrs(['docs: (#3) の続き']), []);
});

test('同じ PR は1回だけ、新しい順に3件まで', () => {
  const prs = parsePrs(['a (#5)', 'b (#5)', 'c (#4)', 'd (#3)', 'e (#2)']);
  assert.deepEqual(
    prs.map((p) => p.number),
    [5, 4, 3],
  );
});

test('git の履歴から PR を拾える', () => {
  const prs = prsFor(['src/styles/global.css']);
  assert.ok(prs.length > 0, 'global.css を変えた PR が見つからない');
});

test('ADR の題名と、改訂前の題をファイルから読む', () => {
  const a = adr(16);
  assert.match(a.title, /^見た目を/);
  assert.equal(a.previous, '紙の質感');
  assert.equal(adr(17).previous, undefined);
  assert.match(a.url, /\/blob\/main\/docs\/adr\/adr-016-paper-look\.md$/);
});

test('対応表の ADR とファイルがすべて実在する', () => {
  for (const [id, note] of Object.entries(buildNotes)) {
    assert.ok(note.adrs.length > 0, `${id} に ADR が無い`);
    for (const no of note.adrs) assert.doesNotThrow(() => adr(no), `${id} の ADR-${no} が無い`);
    for (const f of note.files) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${id} の ${f} が無い`);
  }
});
