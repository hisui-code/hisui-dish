# Bowl Snapshots API

## 対象 API

- `POST /api/v1/device/bowl_snapshots`

## 目的

その時点の皿の残量を保存する。

## 用語

- `snapshot_id`
  - Device が 1 回の送信ごとに付ける識別子
- `weight_g`
  - その時点で皿に残っている量
- `recorded_at`
  - Device がその重さを記録した時刻

## 処理内容

### 残量を 1 件保存する

Device が送った残量を、`bowl_snapshots` に 1 レコードとして保存する。

- `snapshot_id` を `bowl_snapshots.id` として使う
- `weight_g` は四捨五入して整数で保存する
- `recorded_at` は Device が記録した時刻をそのまま保存する

### `snapshot_id` で重複保存を防ぐ

同じ snapshot が再送されても、同じ内容を何度も保存しないようにする。

- `snapshot_id` を冪等キーとして使う
- すでに同じ `snapshot_id` がある時は新規作成しない
- その場合は `200` と `already_processed` を返す
- 新しく保存できた時は `201` と `created` を返す

## 入力ルール

- `snapshot_id` は必須
- `device_id` は必須
- `weight_g` は必須の数値
- `weight_g` は 0 以上
- `recorded_at` は必須の日付

## 異常系

- `device_id` が存在しない時は `404`
- エラーコードは `device_not_found`

## 使い方

### 最新残量の表示

ダッシュボードの `bowlRemaining` は、最新 1 件の `bowl_snapshots.weight_g` を使う。

### 補充だけ起きた時の残量更新

食事イベントが無い時でも、皿の残量を UI に反映するために使う。
