import { readdirSync, readFileSync } from 'node:fs';
import { fileUrl } from './history.ts';

// ADR の題名は docs/adr/ のファイルの1行目から作り、手で書かない（ADR-017）
const dir = new URL('../../docs/adr/', import.meta.url);

export type Adr = { no: number; title: string; previous?: string; url: string };

export function adr(no: number): Adr {
  const prefix = `adr-${String(no).padStart(3, '0')}-`;
  const file = readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) throw new Error(`ADR-${no} のファイルが docs/adr/ に無い`);
  const text = readFileSync(new URL(file, dir), 'utf8');
  const title = text
    .split('\n')[0]
    .replace(/^#\s*ADR-\d+:\s*/, '')
    .trim();
  // 日付の行の「（2026-10-16 に「紙の質感」から改訂）」から、改訂前の題を拾う
  const previous = text.match(/^- 日付:.*「([^」]+)」から改訂/m)?.[1];
  return { no, title, previous, url: fileUrl(`docs/adr/${file}`) };
}
