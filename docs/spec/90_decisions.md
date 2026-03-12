# 90 Decisions

## 2026-03-07: docs/spec を現状実装に合わせて再構成する

理由:

- 既存 spec が粒度と責務の切り方で揺れていた
- 実装と spec の対応関係が追いにくくなっていた
- 仕様変更時に、どこを先に直すべきか分かりにくかった

影響:

- `00_overview` から `90_decisions` まで順に読める構成へ変更する
- Device、API、UI を横断する内容は overview / architecture に寄せる
- 詳細仕様は data model / measurement / api / ui に分ける

## 2026-03-07: DB は UTC 保存、表示と日次集計は JST 基準とする

理由:

- サーバ時刻や実行環境差異によるズレを避けたい
- 日次集計の境界を利用者視点で統一したい

影響:

- JST の期間を決めてから UTC に変換して検索する
- UI の「今日」も JST 基準で考える

## 2026-03-07: Device は食事判定をローカルで行う

理由:

- 生の重量変化を毎回サーバへ送るより、責務が明確で実装も単純
- 一時的な通信断でも判定自体は継続できる

影響:

- Device 側に状態機械と再送キューを持つ
- API は保存と集計に集中する

## 2026-03-07: 皿あり時だけ食事判定を行う

理由:

- 皿の着脱と食事量の減少は意味が異なる
- 皿なし状態まで同じ重量系列として扱うと判定が不安定になる

影響:

- Device は `grams` ベースで皿有無を前段判定する
- `baseline` は皿あり時だけ意味を持つ
- 皿を外したら判定用の履歴をクリアする

## 2026-03-07: DeviceSettings は version API で差分同期する

理由:

- 常時起動の Device で通信量を抑えたい
- 設定変更時だけ本体取得すればよい

影響:

- Device は `lock_version` を保持する
- Web 更新時は楽観ロックを使う

## 2026-03-09: Device API と Web API は認証方式を分ける

理由:

- Device と Web 利用者では認証の前提が異なる
- Web API 全体に `X-Api-Token` を要求すると、frontend まで device 用の秘密情報を持つことになる
- DeviceSettings の取得は device の同期用途、更新は Web 管理画面の用途で責務が異なる

影響:

- `health` と `login` は公開 API とする
- Device の送信 API と DeviceSettings 取得 API は `X-Api-Token` で保護する
- Dashboard、Logs、Users、DeviceSettings 更新 API は `Authorization: Bearer ...` で保護する
- DeviceSettings 取得 API は `/api/v1/device/device_settings/...` に分離する

## 2026-03-10: Device の baseline は待機追従用と開始判定用に分ける

理由:

- 待機中の重さの中心を追う値と、食べ始め直前の基準を 1 つで兼務すると誤判定しやすい
- 接触スパイクや補充のあとに基準が中途半端な位置に残ると、実際には食べていないのに開始判定しやすい

影響:

- 待機中は `tracking_baseline` をゆっくり追従させる
- 食事開始候補に入った時は `start_reference_weight` を固定する
- 開始候補への遷移と開始確定で使う基準を分ける

## 2026-03-10: 皿あり判定は固定重量ではなく `tare_weight` 基準で行う

理由:

- 空皿の重さは器や設置状態でずれる
- 固定の present threshold だと、実機の空皿が `NO_BOWL` のままになることがある
- DeviceSettings から来る `tare_weight` を基準にした方が、実機差を吸収しやすい

影響:

- Device の皿あり / 皿なし判定は `tare_weight + margin` で行う
- present / absent の差は margin の差で持つ
- 固定 threshold ではなく margin を調整値として扱う

## 2026-03-11: IDLE中の上方向 jump 後も直前の安定参照を保持する

理由:

- 接触スパイクを一度受け入れた直後に安定サンプルまで捨てると、高い帯を開始重量として固定しやすい
- 実際には食べていない上振れから元の帯へ戻った分まで `eat_finished` に含めたくない

影響:

- 上方向 jump 後のクールダウンでは開始判定だけを止める
- 直前の安定サンプルは残し、開始重量の基準は元の安定帯を優先して使う
- 本当に高い帯へ補充された場合は、その後の待機サンプルで徐々に新しい基準へ置き換わる

## 2026-03-12: 食事量は `IDLE` 最後の安定重量と終了後安定重量の差で求める

理由:

- 一時的な底値を使うと、皿を押した戻りや接触ノイズまで食事量に含めやすい
- 今回ほしいのは食事中の最大減少量ではなく、最終的にどれだけ減ったかである
- 開始判定用の baseline と食事量算出の基準を分けた方が、ログ原因を追いやすい

影響:

- 食事量は `start_weight - min_weight` ではなく `idle_last_weight - finish_weight` で求める
- `tracking_baseline` は開始判定用に残し、食事量算出には使わない
- `eat_finished` と `eat_discarded` のログは `idle_last` と `finish` を出して根拠を追えるようにする

## 2026-03-12: `idle_last_weight` の上方向更新は長め安定でのみ採用する

理由:

- 食事前に猫が皿へ口や体を乗せると、総重量が一時的に大きく増えることがある
- その値を `idle_last_weight` にそのまま採用すると、実際には食べていない増分まで `eaten` に含まれる
- 減少方向の追従と、増加方向の採用条件は分けた方が原因を説明しやすい

影響:

- `idle_last_weight` は方向別に更新条件を分ける
- 大きな上方向増加は、通常より長い安定継続を満たしたときだけ新しい基準として採用する
- 一時的な接触荷重は `idle_last_weight` に昇格しにくくなる
