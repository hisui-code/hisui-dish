# Backend Overview

## 役割

Backend は、Device から送られたデータを保存し、Web UI に必要な集計結果を返す。

## 主な責務

- API を提供する
- ログイン状態や権限を確認する
- Device から届いたデータを保存する
- 画像本体の保存先を管理し、DB には画像メタデータを保存する
- UI 用の集計結果を返す
- DeviceSettings を保持し、更新する

## 主な境界

- 食事判定そのものは Device 側で行う
- Backend は保存と集計に集中する
- 画像本体は DB に保存せず、Filesystem disk 経由で保存先を切り替える
