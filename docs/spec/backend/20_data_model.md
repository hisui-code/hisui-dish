# Backend Data Model

## 概要

Backend が保存する主なデータをまとめる。

## 主要テーブル

- devices
- device_settings
- device_session_events
- bowl_snapshots
- photos
- users
- personal_access_tokens

## 保存方針

- DB の時刻は UTC で保存する
- UI 表示や日次集計は JST 基準で扱う
- 画像本体は DB に保存しない
- 画像の所有者、保存先、object key、MIME、byte 数などのメタデータだけを DB に保存する

## 集計元

### 食事量

食事量の集計に使う値を示す。

- `device_session_events.eaten_grams`

### 残量

皿に残っている量の表示に使う値を示す。

- `bowl_snapshots.weight_g`

## 画像メタデータ

画像保存で使う最小限のメタデータを示す。

- `photos.user_id`
- `photos.disk`
- `photos.object_key`
- `photos.original_name`
- `photos.mime_type`
- `photos.bytes`
- `photos.visibility`
