# ADR-006: 自宅の k8s を主に、AWS を予備にする

- ステータス: 提案中
- 日付: 2026-10-14

## 背景・課題 (Background/Problem)
- 現在は Mac mini 上の Node 製の配信サーバーを、Cloudflare Tunnel 経由で公開している
- Mac mini は普段使いのデスクトップと兼用で、CI の self-hosted runner も同じ機械で動いている
- 自宅が止まるとサイトも止まり、「誰でもいつでも見られる」を満たせない
- インフラにもこだわり、Terraform や k8s を実際に使って学びたい
- 費用は月1,000円まで（現状0円）

## 決定事項 (Decision)
- 平常時は自宅（surface）の k8s で配信する
- 自宅が止まったときだけ AWS（S3 + CloudFront）に切り替える
- インフラは Terraform とマニフェストで宣言的に管理する
- 公開の入口は Cloudflare Tunnel を維持し、複数コネクタで止めずに移行する

### 理由 (Reasons)
- 自宅の k8s なら費用はほぼ0円で、k8s を常時動かして学べる
- AWS は求人で求められることが多く、静的サイトの予備なら月数十円で収まる
- 優先度つきのフェイルオーバーにすれば、自宅で学びつつ「いつでも見られる」も満たせる
- Tunnel の複数コネクタを使えば、新旧を並べて動かし、止めずに切り替えて、戻すのも再起動だけで済む

### 受け入れるトレードオフ (Accepted Trade-offs)
- 静的サイトに k8s は過剰。採用の理由は「学習と実演」であり、性能や規模の必要からではない
- 構成が複雑になり、運用の手間が増える
- 自宅とクラウドの2系統で、コンテンツの同期が必要になる

## 検討した別の選択肢 (Alternatives Considered)
- **Cloudflare Pages に移す**: 最も楽で安定し0円だが、インフラを自分で組んだ実績が残らない
- **AWS だけで k8s（EKS）を動かす**: 管理部分だけで月1万円前後かかり、予算を超える
- **今の Mac mini の構成を続ける**: 手間はないが、デスクトップ兼用で落ちやすく、構成も説明しにくい
- **GCP を予備にする**: 選択肢として同等だが、求人での需要から AWS を選んだ

## 参考 (References)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Terraform](https://developer.hashicorp.com/terraform)

## 議論 (Discussion)
- 「なぜ静的サイトに k8s か」は面接で必ず問われる。答えは上の受け入れるトレードオフに書いたとおり
- k8s のディストリビューション、配信サーバー、フェイルオーバーの仕組み、CI の方式は、段階②-c でそれぞれ ADR を立てて決める
- 既存の `serve.cjs` は移設せず、コンテンツに依存しない配信基盤に置き換える
