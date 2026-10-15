import { execSync } from 'node:child_process';

// 日付をノートの Date の欄の書き方（2026.03.29）にする。CI は UTC で動くので、日本の日付にそろえる
export const noteDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date)
    .replaceAll('-', '.');

// ページの上の「Date」の欄に書く、最後に更新した日（ADR-016）。git が使えないときはビルドを止める
export const lastUpdated = noteDate(new Date(Number(execSync('git log -1 --format=%ct', { encoding: 'utf8' })) * 1000));

// ビルドした commit の短い hash。OGP 画像の URL に付け、配るたびに URL を変える（Cloudflare の中継と SNS が古い画像を出さないように）
export const buildVersion = execSync('git log -1 --format=%h', { encoding: 'utf8' }).trim();
