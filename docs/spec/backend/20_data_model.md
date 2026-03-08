# Backend Data Model

## 概要

Backend が保存する主なデータをまとめる。

## 主要テーブル

- devices
- device_settings
- device_session_events
- bowl_snapshots
- users
- personal_access_tokens

## 保存方針

- DB の時刻は UTC で保存する
- UI 表示や日次集計は JST 基準で扱う

## 集計元

### 食事量

食事量の集計に使う値を示す。

- `device_session_events.eaten_grams`

### 残量

皿に残っている量の表示に使う値を示す。

- `bowl_snapshots.weight_g`
