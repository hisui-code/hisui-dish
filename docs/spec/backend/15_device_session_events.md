# Device Session Events API

## 対象 API

- `POST /api/v1/device/session_events`

## 目的

Device が判定した食事セッションの結果を保存する。

## 用語

- `session_id`
  - Device が 1 回の食事セッションごとに付ける識別子
- `event`
  - そのセッション結果の種類
- `eat_finished`
  - 食事が正常に終わったセッション
- `eat_discarded`
  - 食事量として採用しないセッション
- `eaten`
  - Device が計算した食事量

## 処理内容

### セッション結果を 1 件保存する

Device が送った 1 セッション分の結果を、`device_session_events` に 1 レコードとして保存する。

- `eaten` は `eaten_grams` として保存する
- `recorded_at` は Device が記録した時刻をそのまま保存する
- 受け取った payload 全体を `raw_payload` に保存する

### `session_id` で重複保存を防ぐ

同じセッションが再送されても、同じ内容を何度も保存しないようにする。

- `session_id` を冪等キーとして使う
- すでに同じ `session_id` がある時は新規作成しない
- その場合は `200` と `already_processed` を返す
- 新しく保存できた時は `201` と `created` を返す

## 入力ルール

- `session_id` は必須
- `device_id` は必須
- `event` は必須
- `event` は `eat_finished` または `eat_discarded`
- `eaten` は必須の数値
- `recorded_at` は必須の日付

## 集計での扱い

### `eat_finished`

集計対象として使う。

- Dashboard で使う
- 日別集計で使う
- 月別集計で使う
- Logs 一覧で使う

### `eat_discarded`

保存はするが、食事量の集計には使わない。

## 補足

- Backend は食事量を再計算しない
- Device が送った食事量を保存し、集計に使う
