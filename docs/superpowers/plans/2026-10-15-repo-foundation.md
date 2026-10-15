# 段階②-b リポジトリの整備 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `pnpm verify` 1つで検証でき、PR → GitHub のマシンで検証 → 自宅でデプロイ、の流れで本番に出せるリポジトリにする。

**Architecture:** 検証は package.json の scripts を `verify` に束ね、CI も同じコマンドを呼ぶ。workflow は1つにし、verify の job（ubuntu-latest）が作った dist を deploy の job（self-hosted、push のときだけ）が受け取る。

**Tech Stack:** pnpm 10、Node 24、Astro 5、Biome 2.3+、@astrojs/check、@lhci/cli、GitHub Actions

**Spec:** [docs/superpowers/specs/2026-10-15-repo-foundation-design.md](../specs/2026-10-15-repo-foundation-design.md)

## Global Constraints

- 依存は devDependencies に `@astrojs/check`・`typescript`・`@biomejs/biome`・`@lhci/cli` だけを足す
- Lighthouse の合格ライン: accessibility・best-practices・seo は 1.0、performance は 0.95 以上（3回の中央値）
- self-hosted の job は `push` かつ `main` のときだけ動く
- 既存の `pnpm build`・`pnpm check` の挙動を変えない。ブログ記事と OGP の URL を変えない
- git・gh は単純な1コマンドで打つ（パイプ・リダイレクト・`$` を付けない）。署名行なし
- 作業はブランチ `chore/repo-foundation`。main への push はしない（PR を merge する）

## Review Focus

- 外部の PR で self-hosted の job が動かない（`if` の条件）。PR の実行結果で deploy の job が skipped になっていることを確かめる
- deploy の job が verify の作った dist を使い、Mac mini でビルドしない
- `pnpm verify` が途中の失敗で止まる（`&&` でつなぐ）。わざと壊して確かめる
- Biome の整形が `.astro` のテンプレートを壊さない。整形後に `pnpm build`・`pnpm check`・スクリーンショットで確かめる
- branch protection を merge の後に有効にし、直接 push が拒否される

---

### Task 1: Node のバージョンと手順書
**Files:** Create `.node-version`, `docs/guides/setup.md`, `docs/adr/adr-012-tool-versions.md` / Modify `package.json`, `docs/adr/README.md`
- [ ] `.node-version` に `24`、`engines.node` に `>=24`
- [ ] setup.md: mise の設定 → `pnpm install` → `pnpm dev` → `pnpm verify`
- [ ] ADR-012 と一覧
- [ ] `pnpm install --frozen-lockfile`・`pnpm build`・`pnpm check` が通る
- [ ] Commit `chore: Nodeのバージョンを.node-versionで固定し、手順書を追加`

### Task 2: 型検査
**Files:** Modify `package.json`, `pnpm-lock.yaml`、型エラーの出たファイル
- [ ] `pnpm add -D @astrojs/check typescript`、scripts に `typecheck: astro check`
- [ ] `pnpm typecheck` を実行し、出たエラーを直す。Expected: 0 errors
- [ ] Commit `chore: astro checkで型検査する`

### Task 3: Biome
**Files:** Create `biome.json`, `docs/adr/adr-010-biome.md` / Modify `package.json`、整形される全ファイル
- [ ] `pnpm add -D @biomejs/biome`、`biome.json`（`html.experimentalFullSupportEnabled` など .astro 対応の設定は、入れた版の docs に合わせる。`dist`・`.astro`・`node_modules`・`pnpm-lock.yaml`・`.superpowers` を除外）
- [ ] `pnpm biome check .` を実行し、.astro のテンプレート・frontmatter・script が対象になっているか確かめる
- [ ] リントの指摘を直す（コミット1）→ `pnpm format` で整形（コミット2、整形だけ）
- [ ] 整形の後に `pnpm build`・`pnpm check` が通り、375px のスクリーンショットが変わらない
- [ ] scripts に `lint: biome ci .`・`format: biome check --write .`、ADR-010
- [ ] Commits `chore: Biomeでリントする` / `style: Biomeで整形する`

### Task 4: Lighthouse と verify
**Files:** Create `lighthouserc.json` / Modify `package.json`
- [ ] `pnpm add -D @lhci/cli`、lighthouserc.json（staticDistDir、3 URL、numberOfRuns 3、assertions、upload は `temporary-public-storage` にせず `filesystem`、出力先 `.lighthouseci/` を .gitignore に）
- [ ] scripts に `lighthouse: lhci autorun`、`verify: pnpm typecheck && pnpm lint && pnpm build && pnpm check && pnpm lighthouse`
- [ ] `pnpm verify` が通る
- [ ] わざと Hero のチップの文字色を薄くして `pnpm verify` が accessibility で失敗することを確かめ、戻す
- [ ] Commit `chore: pnpm verifyで型検査からLighthouseまで確かめる`

### Task 5: CI と PR の流れ
**Files:** Create `.github/workflows/ci.yml`, `docs/adr/adr-011-pr-and-ci.md` / Delete `.github/workflows/deploy.yml` / Modify `docs/guides/development-flow.md`, `docs/rules/commit-pr.md`, `CLAUDE.md`
- [ ] ci.yml: on pull_request / push(main)。job `verify`（ubuntu-latest、pnpm/action-setup、setup-node node-version-file .node-version cache pnpm、install、verify、push のとき dist を upload-artifact）。job `deploy`（needs verify、if push && main、self-hosted、download-artifact で dist、今の配置手順）
- [ ] development-flow と commit-pr にブランチ・PR・squash の流れ、CLAUDE.md に「main へ直接 push しない」
- [ ] ADR-011
- [ ] Commit `ci: 検証をGitHubのマシンで走らせ、デプロイは検証の後に自宅で行う`

### Task 6: 置き場所の規則と docs の構成
**Files:** Create `docs/rules/code-structure.md` / Modify `docs/README.md`, `docs/adr/adr-004-documentation-structure.md`
- [ ] 仕様の規則を書く。docs/README の構成表に superpowers/、ADR-004 の議論に追記
- [ ] Commit `docs: コードの置き場所の規則を追加し、docsの構成にsuperpowersを加える`

### Task 7: ライセンスとリポジトリの情報
**Files:** Create `LICENSE`, `docs/adr/adr-013-license.md` / Modify `README.md`
- [ ] LICENSE（MIT、2026、藤井 優気 (wisteria)）、README にライセンスの範囲・`pnpm verify`・PR の流れ・Tech Stack の更新
- [ ] ADR-013
- [ ] `gh repo edit` で description・homepage・topics（1コマンドずつ）
- [ ] Commit `docs: コードをMITにし、文章と画像を対象外と明記する`

### Task 8: PR・merge・保護
- [ ] `git push -u origin chore/repo-foundation`、`gh pr create`（本文はファイル）
- [ ] PR の CI で verify が通り、deploy が skipped
- [ ] `gh pr merge --squash`、main の push で verify → deploy、本番を確かめる
- [ ] `gh api` で branch protection（必須 check: verify、管理者にも適用、force push・削除禁止）、squash だけを許す設定
- [ ] main への直接 push が拒否されることを確かめる（空コミットで試し、ローカルの main を戻す）
