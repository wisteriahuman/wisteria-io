# ADR-011: 変更は PR で入れ、検証は GitHub のマシン、デプロイは自宅で行う

- ステータス: 採用
- 日付: 2026-10-15

## 背景・課題 (Background/Problem)
- これまでは main に直接 push し、自宅の Mac mini の self-hosted runner でビルドとデプロイを行っていた。検証は push の後にしか走らず、失敗に気づくのは本番に出る直前だった
- 公開リポジトリで self-hosted runner を使っており、workflow の書き方を誤ると外部の PR のコードが自宅の機械で動く（issue #1 で指摘された種類の懸念）
- 面接官がリポジトリを見たとき、変更がどう検証されて本番に出るかを、PR の履歴として示したい

## 決定事項 (Decision)
- 変更はブランチを切り、PR を出し、検証が通ったら squash で merge する。AI エージェントもこの流れで作業する
- workflow は `.github/workflows/ci.yml` の1つにする
  - `verify` の job: GitHub のマシン（ubuntu-latest）で、PR と main への push の両方で `pnpm verify` を走らせる
  - `deploy` の job: main への push のときだけ、`verify` が通った後に self-hosted runner（Mac mini）で動く。`verify` が作った `dist/` を受け取って配置するだけで、自宅ではビルドしない
- 外部の人の PR で workflow を動かすときは、毎回承認を必須にする（Actions の設定 `approval_policy: all_external_contributors`）。PR の workflow はその PR の中のファイルで動くため、`if` の条件だけでは自宅の機械を守れない
- デプロイは別の場所に写してから入れ替え、同時に1つしか動かさない（`concurrency`）
- main を保護する: `verify` の通過を必須にし、承認は不要、管理者にも適用し、force push と削除を禁止する。merge は squash だけを許す

### 理由 (Reasons)
- 本番に出す前に、型検査からLighthouseまで必ず通る
- 自宅の機械で動くのは、main に入ったことが確定したコードの配置だけになる。外部の PR の workflow は承認するまで動かない。承認する前に、PR が `.github/workflows/` を変えていないかを確かめる
- 検証したビルド結果をそのまま配置するので、「検証したものと本番が違う」ことが起きない
- squash にすると main の履歴が「1 PR = 1つの変更」になり、細かい経緯は PR に残る

### 受け入れるトレードオフ (Accepted Trade-offs)
- 小さな修正でも PR を通すため、本番に出るまで数分長くかかる
- GitHub のマシンの利用時間を使う（公開リポジトリは無料の範囲）
- 承認を必須にしないため、PR は自分（と AI エージェント）だけで merge できる。品質は verify で担保する

## 検討した別の選択肢 (Alternatives Considered)
- **main に直接 push を続ける**: 手間は最小だが、検証が本番の直前にしか走らず、作り方の証拠も残らない
- **すべて self-hosted で動かす**: GitHub のマシンを使わずに済むが、PR の検証のために外部のコードを自宅で動かすことになる
- **`workflow_run` で deploy を別の workflow にする**: 分けられるが、成果物の受け渡しと条件が複雑になる。`needs` でつなぐ方が読みやすい

## 参考 (References)
- [Security hardening for GitHub Actions: self-hosted runners](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#hardening-for-self-hosted-runners)
- [開発の流れ](../guides/development-flow.md)

## 議論 (Discussion)
- 段階②-c で配信基盤を自宅の k8s に移すときも、「検証は GitHub のマシン、自宅は確定した成果物の配置だけ」という分け方は保つ
- 最初の PR（この判断を入れる PR）だけは、保護を有効にする前に merge した
