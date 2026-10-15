import { execFileSync } from 'node:child_process';

// 「この部分の作り」の最近の変更（ADR-017）。main は squash で merge し、件名の末尾に (#N) が付く
const REPO = 'https://github.com/wisteriahuman/wisteria-io';

export type Pr = { number: number; title: string; url: string };

export const fileUrl = (path: string) => `${REPO}/blob/main/${path}`;

// git log の件名（新しい順）から、末尾の (#N) を PR として拾う。同じ PR は1回だけ
export function parsePrs(subjects: string[], limit = 3): Pr[] {
  const seen = new Set<number>();
  const prs: Pr[] = [];
  for (const subject of subjects) {
    const m = subject.match(/^(.*\S)\s+\(#(\d+)\)$/);
    if (!m) continue;
    const number = Number(m[2]);
    if (seen.has(number)) continue;
    seen.add(number);
    prs.push({ number, title: m[1], url: `${REPO}/pull/${number}` });
    if (prs.length === limit) break;
  }
  return prs;
}

// ファイルを変えた PR。git が使えないときは throw してビルドを止める（黙って空にしない）
export function prsFor(files: string[], limit = 3): Pr[] {
  const out = execFileSync('git', ['log', '--format=%s', '--', ...files], { encoding: 'utf8' });
  return parsePrs(out.split('\n').filter(Boolean), limit);
}
