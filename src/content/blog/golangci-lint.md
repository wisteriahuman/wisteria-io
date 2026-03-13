---
title: "golangci-lintでGoのコードを静的解析する"
description: "golangci-lintの基本的な使い方と、Go Collegeで実際に使った設定を紹介します。"
pubDate: 2026-03-13
tags: ["Go", "lint", "CI"]
draft: false
---

Goのlinterをまとめて管理できる [golangci-lint](https://golangci-lint.run/) を
Go Collegeで触ってみたので、設定と使い方を紹介します。

## golangci-lintとは

Goには `govet` や `staticcheck` など様々なlinterが存在するが、それぞれを個別に管理するのは手間がかかる。golangci-lintはそれらを一つの設定ファイルにまとめて管理・実行できるツールで、CIへの組み込みにも対応している。

## インストール

[公式ドキュメント](https://golangci-lint.run/docs/welcome/install/local/)を参照。

Arch Linux:
```sh
paru -S golangci-lint
```

## 設定ファイル（.golangci.yml）

プロジェクトルートに `.golangci.yml` を置く。詳細は[公式ドキュメント](https://golangci-lint.run/docs/configuration/file/)を参照。
```yaml
# 例
version: "2"

linters:
  default: none
  enable:
    - errcheck    # errorの握りつぶし検出
    - govet       # 公式静的解析
    - staticcheck # バグになりうるパターン
    - errorlint   # errors.Isを使わずに==比較してないか
    - misspell    # スペルミス
    - gosec       # セキュリティ問題
    - unused      # 未使用変数・関数の検出
  settings:
    errcheck:
      exclude-functions:
        - fmt.Fprintf
        - fmt.Fprintln
        - fmt.Fprint
  exclusions:
    warn-unused: true
    presets:
      - std-error-handling
      - common-false-positives

formatters:
  enable:
    - gofmt     # コードフォーマット
    - goimports # importの整理
```

### linters

`default` には以下の4つが指定できる。

| 値 | 内容 |
|----|------|
| `none` | 全部オフ、`enable`で明示的に指定 |
| `standard` | 公式推奨のデフォルトセット（デフォルト値） |
| `all` | 全linterをオン |
| `fast` | 速いlinterだけオン |

`none` にして `enable` で明示管理するのがいいと個人的に思う。

### linters.settings

各linterの細かい設定。`errcheck` はデフォルトで `fmt.Fprintln` などの戻り値も検査するが、慣例的に無視することが多いらしいので除外している。

### linters.exclusions

誤検知を除外する設定。`presets` を使うとよくある誤検知パターンをまとめて除外できる。`std-error-handling` は `fmt.Println` のエラー戻り値無視を許可し、`common-false-positives` は gosec の誤検知をまとめて除外する。

`warn-unused: true` にしておくと、定義した除外ルールが実際に使われていない場合に警告が出る。

### formatters

linterとは別にフォーマッターを指定できる。`gofmt` でコードフォーマット、`goimports` でimportの整理を行う。

## lefthookと組み合わせる

[lefthook](https://github.com/evilmartians/lefthook) はGit hooksを管理するツール。コミット前にlintを自動実行するように設定しておくと、lintが通らないコードをコミットできなくなる。
```yaml
# lefthook.yml
pre-commit:
  commands:
    lint:
      glob: "**/*.go"
      run: golangci-lint run --new-from-rev=HEAD ./...
```

`glob: "**/*.go"` でGoファイルが変更されたときだけ実行される。`--new-from-rev=HEAD` を指定すると差分ファイルだけをチェックするため、プロジェクトが大きくなっても実行が速い。

## GitHub Actionsと組み合わせる

CIに組み込む場合の参考に。
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
      - uses: golangci/golangci-lint-action@v7
        with:
          version: latest

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
      - run: go test ./...
```

`golangci-lint-action` を使うとビルドキャッシュが自動で効くため、`run: golangci-lint run ./...` で素実行するより速い。

## まとめ

golangci-lintを使うことで、複数のlinterを設定ファイル一つで管理できる。lefthookでコミット前の自動チェック、GitHub ActionsでCIの保証という構成にしておくのがおすすめ。linterは増やしすぎると管理が大変なので、必要なものだけ有効にしたい。
