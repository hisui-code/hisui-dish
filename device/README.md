# Device

Raspberry Pi device-side application for HisuiDish.

## Run

```bash
python3 main.py
```

## Calibration

`main.py` は `calibration.json` を前提に動作するため、初回はキャリブレーションが必要

### First-time Setup

```bash
python3 calibrate_hx711.py
```

手順:

1. 空の状態で Enter を押してゼロ点を取得
2. 既知重量を載せて Enter を押してスケールを取得
3. `calibration.json` が生成されることを確認

確認:

```bash
ls -l calibration.json
cat calibration.json
```

### When Re-calibration Is Needed

- センサーや配線を触った
- ボウルや設置位置を変更した
- 空状態で `net_grams` のズレが継続する

通常運用では毎回キャリブレーション不要

## Environment Switching

本プロジェクトのデバイス送信先は `device/.env` 系ファイルと環境変数で切り替える  
`config.py` の解決順は次のとおり

1. OS環境変数
2. `device/.env` + `device/.env.<env>`
3. 既定値

`<env>` は次の優先順で決まる

1. `HISUIDISH_ENV`
2. `APP_ENV`
3. `development`（未指定時）

### Variables

- `HISUIDISH_API_BASE`
- `HISUIDISH_EVENT_ENDPOINT`
- `HISUIDISH_API_TOKEN`
- `HISUIDISH_DEVICE_ID`

### Development Example

```bash
# .env の HISUIDISH_ENV を development にして起動する
python3 main.py
```

`.env.development` 例:

```env
HISUIDISH_API_BASE=http://localhost:8000
HISUIDISH_EVENT_ENDPOINT=/api/v1/device/session_events
HISUIDISH_API_TOKEN=dev_token
HISUIDISH_DEVICE_ID=dev_device_uuid
```

### Production Example (file switch)

`.env` の `HISUIDISH_ENV=production` で本番へ切り替える  
起動コマンドは開発/本番で同じ

```bash
python3 main.py
```

`.env` 例:

```env
HISUIDISH_API_BASE=https://api.example.com
HISUIDISH_EVENT_ENDPOINT=/api/v1/device/session_events
HISUIDISH_API_TOKEN=prod_token
HISUIDISH_DEVICE_ID=prod_device_uuid
```

### Production Example (systemd recommended)

本番は systemd で環境変数を注入するのを推奨する  
`/etc/hisuidish/device.env` を作成し、サービス側で読み込む

```ini
EnvironmentFile=/etc/hisuidish/device.env
Environment=APP_ENV=production
```

`/etc/hisuidish/device.env` 例:

```env
HISUIDISH_API_BASE=https://api.example.com
HISUIDISH_EVENT_ENDPOINT=/api/v1/device/session_events
HISUIDISH_API_TOKEN=prod_token
HISUIDISH_DEVICE_ID=prod_device_uuid
```

この方式なら、開発/本番切替時もコード変更は不要

### Environment Toggle by `.env`

`.env` の `HISUIDISH_ENV` を変更すると、読み込む環境別ファイルが切り替わる

- `HISUIDISH_ENV=development` -> `.env.development`
- `HISUIDISH_ENV=production` -> `.env.production`

例:

```env
# device/.env
HISUIDISH_ENV=development
```

```env
# device/.env
HISUIDISH_ENV=production
```
