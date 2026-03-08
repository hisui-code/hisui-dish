# Dashboard API

## 対象 API

- `GET /api/v1/dashboard`

## 目的

ダッシュボード表示に必要な値をまとめて返す。

## 用語

- `todayEvents`
  - 今日の食事イベント一覧
- `todayTotal`
  - 今日食べた量の合計
- `bowlRemaining`
  - 今、皿に残っているごはんの量
- `averageDailyIntakeLast3Months`
  - 直近3ヶ月で、食事があった日の1日平均
- `eat_finished`
  - 食事が終わったと確定したイベント

## 計算方法

### `todayEvents`

今日の食事イベント一覧を返す。

- 今日の `eat_finished` を時系列で返す

### `todayTotal`

当日の 1 日の食事量を集計して返す。

- 今日の `eat_finished` の `eaten_grams` 合計を返す
- 小数部が 0 の時は整数で返す

### `bowlRemaining`

今、皿に残っているごはん量を返す。

- `bowl_snapshots` の最新 1 件の `weight_g` を返す
- データが無い時は `0`

### `averageDailyIntakeLast3Months`

直近 3 ヶ月の 1 日平均の食事量を返す。

- 対象月の前々月から前月までを見る
- `eat_finished` の `eaten_grams` を、JST の日ごとに合計する
- 食事があった日だけを平均対象にする
- 小数部が 0 の時は整数で返す

## 日付の扱い

- DB は UTC 保存
- 日付境界は JST で決める
- 検索時は JST の範囲を UTC に変換する

## 0件の時の返し方

- `todayEvents` は空配列
- `todayTotal` は `0`
- `bowlRemaining` は `0`
- `averageDailyIntakeLast3Months` は `0`
