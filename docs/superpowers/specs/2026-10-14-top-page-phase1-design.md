# トップページ段階① 実装仕様

- 日付: 2026-10-14
- 入力: [design/top-page.md](../../design/top-page.md)（合意済みの画面）、[US-01・US-02](../../requirements/user-stories.md)、[DS-02](../../requirements/developer-stories.md#ds-02-実績を1か所直せば全体に反映される)
- 期限: 2026-10-17

画面と文言は design/top-page.md で合意済み。この文書は、それをどのファイルにどう作るかだけを決める。

## 範囲

やる:
- 最初の画面（Hero）の作り直し
- 実績のデータを1ファイルにまとめ、最初の画面・経歴・トップの OGP をそこから作る
- セクションとナビの並べ替え
- 作品をハッカソン4件と FUN Developers Hub に絞る
- About の記述の修正
- トップの OGP 画像の新設と、ブログの OGP のデザイン統一
- 絵文字アイコンの SVG 化
- Lighthouse（モバイル）4項目100に向けた修正

やらない（段階②）:
- pnpm 移行・CI・配信の変更、依存の追加
- デザインの刷新（色・レイアウトの方向は今のまま）
- ブログ記事の URL の変更

## データ

### `src/data/projects.ts`
作品（ハッカソン4件と FUN Developers Hub）を置く。`Projects.astro` の配列をここへ移し、`event`（大会名）を足す。

```ts
export type Project = {
  id: string;
  title: string;
  event: string;          // 'FISH' | 'P2HACKS 2025' など。受賞の表記に使う
  desc: string;
  tech: string[];
  award: string | null;
  period: string;
  github?: string;
  link?: string;
};
```

並びは受賞の強い順: FISH（優勝）→ P2HACKS 2025（Directorz賞）→ P2HACKS 2024（サイバーエージェント賞）→ JPHACKS 2025 → FUN Developers Hub（演習。`event` は `高度ICT演習`）。

### `src/data/career.ts`
経歴（インターン・アルバイト・受賞・大会・学歴）と、最初の画面に出す実績3つを置く。

```ts
export type CareerItem = {
  id: string;             // アンカー（#career-<id>）に使う
  period: string;
  title: string;
  subtitle: string;
  desc: string;
};
export const career: CareerItem[];
export type Highlight = { id: string; label: string }; // id は career の id
export const highlights: Highlight[];
```

- ハッカソンの項目は `projects` の受賞から作る。件数（「受賞3回」）と内訳（「FISH 優勝・P2HACKS 2025 Directorz賞・P2HACKS 2024 サイバーエージェント賞」）を手で書かない。受賞が増えたら projects.ts を直すだけで、経歴・チップ・OGP が変わる
- `highlights` は表示順で持つ: Go College ベストエンジニアリング賞 → ハッカソン受賞3回 → ICPC 2025 横浜
- 経歴の時系列の並びと、チップの並びは別に持つ（時系列では ICPC がハッカソンより上に来るため）

### `src/data/profile.ts`
名前・所属・競技プログラミングの評価と、description の文を置く。Hero・`<title>`・description・OGP がここを読む。

- name: `藤井 優気`、handle: `wisteria`
- ratings: `AtCoder 水色`・`paiza Sランク`（チップの下に小さく出す）
- summary: 所属と `highlights` のラベルから作る description の文
- 姿勢の一行は置かない（2026-10-15 に外した。理由は design/top-page.md）
- affiliation: `28卒・公立はこだて未来大学`

## 画面

### Hero（`Hero.astro`）
design/top-page.md の最初の画面どおり。上から、小さいアバター（64px）・名前（h1）・所属・実績チップ3つ・評価・GitHub / X / AtCoder。

- チップは `<a href="#career-<id>">`。トロフィーの SVG を前に置く。高さ 36px 以上、間隔 8px
- 固定ナビに隠れないよう、経歴の各項目に `scroll-margin-top` を付ける
- アバターは `src/assets/avatar.jpg` に移し、`astro:assets` の `<Image />` で出す。`public/avatar.jpg` は外部から直接参照されている可能性があるため残す
- 縦は今の `min-h-screen` の中央寄せをやめ、上から詰める。スマホで次のセクションの頭が見えてよい

### セクションとナビ
`index.astro` を 経歴 → 作品 → スキル → About → リンク の順にする。ナビも同じ順（Experience / Projects / Skills / About / Links / Blog）。見出しとナビの英語表記は今のまま。

### 作品（`Projects.astro`）
`projects.ts` を読む。🏆 と 🔗 を SVG に置き換える。

### スキル（`Skills.astro`）
カテゴリの絵文字を SVG に置き換える。

### About（`About.astro`）
- 「3年」を削除する
- 環境の文を、マシンごとの OS の遍歴に書き直す。日付は入れず並び順だけ書く
  - エディタは Neovim。開発環境は Nix で管理している
  - Surface（入学時の推奨機）: Windows → Ubuntu → CachyOS → Garuda → 今は Ubuntu Server
  - DAIV（マウスコンピューター）: Pop!_OS → コーヒーをこぼして故障
  - MacBook Air・Mac mini: 今の普段使い。Mac mini はこのサイトの配信も担当

### 経歴の修正
- アルゴ式のインターンは終了済み。期間を `2026/2 〜 2026/7` にする。説明は空のまま（空のときは説明の行を出さない）

### アイコン
`src/components/Icon.astro` に、使う SVG（Lucide の形、ISC License）だけを名前で引けるようにまとめる。依存は足さない。

## OGP

### 共通（`src/lib/og.ts`）
- satori + sharp で 1200×630 の PNG を作る関数と、フォントの取得をまとめる。フォントはビルド中に1回だけ取得する
- デザインは今のブログ OGP を土台にする: 背景 `#0f172a`、上にインディゴの短い線、下に「藤井 優気 (wisteria)」と `wisteria-io.com`

### トップ（`src/pages/og.png.ts` → `/og.png`）
名前・所属・実績チップ3つ（`highlights` から）・評価を載せる。

### ブログ（`src/pages/og/[...slug].png.ts`）
同じデザインで、記事タイトル＋サイト名にする（タグは載せない）。画像の URL は今と同じ `/og/<slug>.png`。

### メタ（`Layout.astro`）
- 既定の title: `藤井 優気 (wisteria) | ポートフォリオ`、description: summary
- 既定の og:image を `/og.png` にする（トップとブログ一覧が使う）。`og:image:width`・`height` を足す
- ブログ記事は今どおり記事ごとの画像とタイトル

## 速さとアクセシビリティ

着手前の計測（Lighthouse 12、モバイル、ローカルの preview）: Performance 64・Accessibility 90・Best Practices 100・SEO 100。

原因と対処:
- **Google Fonts の CSS が描画を止めている（約3.7秒）**: Noto Sans JP のページ用 Web フォントをやめ、日本語は端末のフォント（iOS・Mac はヒラギノ、Android は Noto Sans CJK）にする。Inter と JetBrains Mono は描画を止めない読み込み（`rel="preload" as="style"` で取得し、読み込み後に stylesheet に切り替える。JS が無い環境向けに `<noscript>` で通常の読み込みを残す）にする。OGP 画像の Noto Sans JP はそのまま。判断は ADR-009 に残す
- **コントラスト不足**: 受賞バッジ（`text-primary-light` on `bg-primary/20`）と作品の期間（`text-text-muted/60`）の色を、WCAG AA（4.5:1）を満たす値に上げる
- **文中のリンクが色だけで区別されている**: フッターのリンクに下線を付ける
- それでも 100 に届かなければ、Astro の CSS をインライン化する（`build.inlineStylesheets`）

## 確かめ方

テストの仕組みはまだない（依存の追加は段階②-b）。次の手順で確かめ、結果を報告する。

1. `npx astro build` が通る（CI と同じコマンド）
2. ビルド結果の検査（使い捨てのスクリプト）:
   - `dist/index.html` の title・description・og:image が上の値
   - Hero に名前・28卒・チップ3つ・評価があり、一行が無く、各チップの `#career-<id>` に対応する要素がある
   - 作品が5件（ハッカソン4件と FUN Developers Hub）で、yajiuma.nvim がない
   - ページ内に絵文字が残っていない
   - About に「3年」がなく、「Ubuntu Server」がある
   - ブログ記事7件の URL と OGP 画像が今と同じパスで出ている
3. 375×667 でスクリーンショットを撮り、最初の画面に名前〜リンクが収まっていることを目で確かめる。PC 幅（1280）も撮る
4. `/og.png` とブログの OGP 1枚を画像で確かめる
5. Lighthouse（モバイル）4項目が 100

## 公開
- 確かめた後に main へ push する（本番へのデプロイ）。push 前に 1 のビルドを通す
- デプロイ後、本番の URL で `/` と `/og.png` が返ることを確かめる
