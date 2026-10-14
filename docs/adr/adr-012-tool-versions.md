# ADR-012: ツールのバージョンを .node-version と packageManager で固定する

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- 手元（Mac・Surface）と CI で、使う Node のバージョンが決まっていなかった。CI は runner の Mac mini に Homebrew で入っている Node をそのまま使っていた
- どの機械でも同じ手順で開発環境を再現したい（→ [DS-05](../requirements/developer-stories.md#ds-05-どの機械でも開発環境を再現できる)）
- 自分は普段 Nix（home-manager）と mise を使っているが、リポジトリを読む面接官や他の開発者が同じ道具を使うとは限らない

## 決定事項 (Decision)
- Node のバージョンは `.node-version`（24）に書く
- pnpm のバージョンは `package.json` の `packageManager` で固定する（→ [ADR-002](./adr-002-package-manager.md)）
- `package.json` の `engines.node` を `>=24` にする
- CI は `actions/setup-node` の `node-version-file: .node-version` で同じ版を使う
- 手元の手順は [guides/setup.md](../guides/setup.md) に書く

### 理由 (Reasons)
- `.node-version` は mise・fnm・Volta・`setup-node` など多くの道具がそのまま読む。特定の道具に縛られない
- 手元と CI が同じファイルを読むので、片方だけ上げる食い違いが起きない
- 24 は 2026年10月時点の LTS で、Astro 5 の対応範囲に入っている

### 受け入れるトレードオフ (Accepted Trade-offs)
- `.node-version` を読まない道具では、自分で版を合わせる必要がある。mise も既定では読まないため、設定を1つ入れる
- メジャーバージョンだけを書くため、パッチの版は機械によって違いうる

## 検討した別の選択肢 (Alternatives Considered)
- **Nix の devShell（flake）**: Node と pnpm を厳密に固定できるが、Nix を使わない人には読めず、CI に入れると重くなる。必要になったら、`.node-version` に合わせた devShell を後から足せる
- **mise の設定ファイル（mise.toml）**: 手元は自動で切り替わるが、mise を使わない人には効かない
- **Docker の開発コンテナ**: 環境ごと揃うが、静的サイトの開発には重い。Docker は段階②-c の配信用のイメージで使う

## 参考 (References)
- [actions/setup-node: node-version-file](https://github.com/actions/setup-node)
- [mise: Idiomatic version files](https://mise.jdx.dev/configuration.html#idiomatic-version-files)

## 議論 (Discussion)
- Nix は個人の環境の話で、リポジトリの再現性とは分けて考えた
- 自分の mise は `nix-config/mise/common.toml` に `idiomatic_version_file_enable_tools` を入れて、`.node-version` を読むようにした
