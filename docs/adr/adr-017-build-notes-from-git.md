# ADR-017: 「この部分の作り」の PR は、ビルド時に git の履歴から拾う

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- 各セクションの「この部分の作り」に、そのセクションを変えた最近の PR を出す（→ [設計](../design/redesign.md)）
- 手で書くと書き漏れて、作りの証拠が嘘になる（→ DS-12）

## 決定事項 (Decision)
- main は squash で merge し、件名の末尾に `(#N)` が付く。ビルド時にファイルごとの `git log` から `(#N)` を拾い、新しい順に3件出す
- セクションと ADR・ファイルの対応は `src/data/build-notes.ts` の1か所に書き、`pnpm check` で抜けを検出する
- git が使えないときはビルドを失敗させる
- CI はチェックアウトの履歴を全部取る（`fetch-depth: 0`）

### 理由 (Reasons)
- GitHub の API を使わないので、ビルドがネットワークとトークンに依存しない
- squash の決まり（ADR-011）が、そのまま材料になる
- 黙って空にすると、証拠が消えたことに気づけない

### 受け入れるトレードオフ (Accepted Trade-offs)
- CI のチェックアウトが少し遅くなる
- PR を経ずに入った昔のコミットは出ない

## 検討した別の選択肢 (Alternatives Considered)
- **GitHub の API**: PR の本文やラベルも取れるが、ビルドにトークンとネットワークが要る
- **手で書く**: 書き漏れる

## 参考 (References)
- [ADR-011](./adr-011-pr-and-ci.md)
- [開発者ストーリー DS-12](../requirements/developer-stories.md)

## 議論 (Discussion)
- なし
