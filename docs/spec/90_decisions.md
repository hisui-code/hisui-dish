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
