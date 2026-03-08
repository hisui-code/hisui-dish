# Device Settings API

## 対象 API

- `GET /api/v1/device_settings/{device_id}`
- `GET /api/v1/device_settings/{device_id}/version`
- `PUT /api/v1/device_settings/{device_id}`
- `PATCH /api/v1/device_settings/{device_id}`

## 目的

Device 側の判定設定を取得、更新する。

## 用語

- `lock_version`
  - 同時更新の競合を見つけるための番号
- `version API`
  - 設定本体ではなく、更新番号だけを見る API
- `conflict`
  - 他の更新が先に入って、今の更新をそのまま適用できない状態
- `device_setting`
  - 更新時に送る設定のまとまり

## show

### 動作

Device が今使う設定の本体を返す。

- `device_id` が存在しない時は `404`
- 設定が無い時は `404`

## version

### 目的

設定本体を取り直す必要があるか確認するための情報を返す。

- Device 側が軽い差分確認をするために使う

## update

### 動作

DeviceSettings を更新し、更新後の設定を返す。

- 必須項目が不足している時は `422`
- 数値でない時は `422`
- 0 以下の値は `422`
- `device_id` が存在しない時は `404`
- `lock_version` が古い時は `409`
- 更新成功時は `lock_version` を 1 増やして返す

## 時刻の扱い

- `updated_at` は UTC のミリ秒付き ISO 形式で返す
