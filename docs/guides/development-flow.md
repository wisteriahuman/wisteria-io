# 開発の流れ

## 概要
要件を詰めてから、判断を ADR に、画面を design に残し、実装を AI エージェントに任せるまでの流れ（→ [ADR-003](../adr/adr-003-ai-assisted-development.md)）。

## 前提条件
- Claude Code と Superpowers（`.claude/settings.json` で有効化済み）
- grilling・ui-grill・ui-ux-pro-max のスキル

## 手順

### 1. 要件を詰める
- `grilling` で、目的・ペルソナ・ストーリーを1問ずつ詰める
- 決まったことは `requirements/` に書く。ペルソナは `personas.md`、見る人の目的は `user-stories.md`、開発する人の目的は `developer-stories.md`

### 2. 判断を ADR に残す
- 技術選定・設計・進め方の判断は、`adr/TEMPLATE.md` をコピーして書く
- 決まっていない判断は「提案中」で書き、決まったら「採用」に変える
- `adr/README.md` の一覧に追加する

### 3. 画面を設計する
- `ui-grill` で、利用者・画面と遷移・状態・見た目を詰める
- 新しいデザインの方向を決めるときは、先にアイデアソンで案を広げる
- `design/TEMPLATE.md` をコピーして書き、`ui-ux-pro-max` で引いたガイドラインを末尾の「Pro Max 参照」に追記する

### 4. 実装を任せる
- 合意した要件と設計を Superpowers に渡し、仕様書・計画・実装・検証を任せる
- AI エージェントは commit・push まで行う

### 5. 確かめる
- 受け入れ条件と指標（`requirements/README.md`）で確かめる
- 判断が変わったら、ADR を「置き換え」にして新しい ADR を書く

## トラブルシューティング
- **AI エージェントの git commit がフックで止まる**: `&&`・改行・`$` を含む複合コマンドは止まる。`git -C <絶対パス> commit -m "..."` のように単発で実行する

## 参考
- [ドキュメントの書き方](../rules/docs.md)
- [コミット規約](../rules/commit-pr.md)
