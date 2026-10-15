import { execSync } from 'node:child_process';

// ページの上の「Date」の欄に書く、最後に更新した日（ADR-016）。git が使えないときはビルドを止める
export const lastUpdated = execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim().replaceAll('-', '.');

// 日付をノートの Date の欄の書き方（2026.03.29）にする
export const noteDate = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
