# Device Overview

## 役割

Device は、重量センサーから得た値をもとに食事イベントを判定し、API へ送信する役割を持つ。

## 主な責務

- 重量読み取り
- キャリブレーション
- 皿あり / 皿なし判定
- 食事開始 / 終了判定
- 送信キュー管理
- DeviceSettings 同期

## 環境切り替え

- Device の送信先や認証情報は環境変数で切り替える
- 開発では `device/.env` と `device/.env.development` を使う
- 本番では Raspberry Pi 側の環境変数、または `device/.env.production` を使う

## 環境変数の読み込み順

1. OS の環境変数
2. `device/.env`
3. `device/.env.<env>`
4. 既定値

`<env>` は次の順で決まる

1. `HISUIDISH_ENV`
2. `APP_ENV`
3. 未指定なら `development`

## 本番で最低限必要な値

- `HISUIDISH_ENV=production`
- `HISUIDISH_API_BASE`
- `HISUIDISH_API_TOKEN`
- `HISUIDISH_DEVICE_ID`
- `HISUIDISH_EVENT_ENDPOINT`
- `HISUIDISH_BOWL_SNAPSHOT_ENDPOINT`
- `HISUIDISH_DEVICE_SETTINGS_ENDPOINT`
- `HISUIDISH_DEVICE_SETTINGS_VERSION_ENDPOINT`
