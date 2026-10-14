# ADR-009: Web フォントで描画を止めない

- ステータス: 採用
- 日付: 2026-10-14

## 背景・課題 (Background/Problem)
- 要件の「いつでも誰でも速く見られる」で、Lighthouse（モバイル）4項目100を目標にしている（→ [要件](../requirements/README.md)）
- 段階①の着手前に測ると Performance は 64 だった。Google Fonts の CSS（Inter・Noto Sans JP・JetBrains Mono）が描画を約3.7秒止めていた
- Noto Sans JP は文字数が多く、CSS だけで約90KB あり、ほとんどが使われていなかった

## 決定事項 (Decision)
- ページでは Noto Sans JP の Web フォントを読み込まない。日本語は端末のフォント（iOS・Mac はヒラギノ、Android は Noto Sans CJK、Windows は游ゴシック）で描く
- Inter と JetBrains Mono は `rel="preload"` で取得し、読み込み後に stylesheet に切り替える。JS が無い環境のために `<noscript>` で通常の読み込みを残す
- OGP 画像は今どおり、ビルド時に取得した Noto Sans JP で描く

### 理由 (Reasons)
- 変更後の計測で Performance・Accessibility・Best Practices・SEO がすべて 100 になった
- Android の端末のフォントは Noto Sans CJK で、Noto Sans JP とほぼ同じ形になる。iOS・Mac のヒラギノも読みやすさは変わらない
- 英字の見た目（Inter・JetBrains Mono）は保てる

### 受け入れるトレードオフ (Accepted Trade-offs)
- 日本語の見た目が端末によって少し変わる
- 英字は最初に端末のフォントで描かれ、読み込み後に Inter に切り替わる。わずかに見た目が動く

## 検討した別の選択肢 (Alternatives Considered)
- **すべて端末のフォントにする**: 最も速く外部への通信もなくなるが、英字の見た目が変わる。デザインの見直しは段階②でアイデアソンを経て決めるため見送った
- **フォントを自分で配信する（セルフホスト）**: 外部への通信がなくなり、表示も安定するが、フォントのファイルか依存を足す必要がある。依存を変えない段階①では見送り、配信基盤を作り直す段階②-c で改めて検討する
- **今の読み込みを続ける**: 見た目は変わらないが、Performance 100 に届かない

## 参考 (References)
- [Lighthouse: Eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources)
- [トップページ段階①の実装仕様](../superpowers/specs/2026-10-14-top-page-phase1-design.md)

## 議論 (Discussion)
- 計測はローカルの preview に対して Lighthouse 12 のモバイル設定で行った。本番では Cloudflare を経由するため、公開後に改めて測る
