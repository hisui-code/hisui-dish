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

本プロジェクトのデバイス送信先は環境変数で切り替える  
コード側で開発/本番の分岐は持たず、実行環境が値を上書きする

### Variables

- `HISUIDISH_API_BASE`
- `HISUIDISH_EVENT_ENDPOINT`
- `HISUIDISH_API_TOKEN`
- `HISUIDISH_DEVICE_ID`

### Development Example

```bash
export HISUIDISH_API_BASE=http://localhost:8000
export HISUIDISH_EVENT_ENDPOINT=/api/v1/device/session_events
python3 main.py
```

### Production Example (systemd)

`/etc/systemd/system/hisuidish-device.service` に環境変数を設定する

```ini
Environment=HISUIDISH_API_BASE=https://api.example.com
Environment=HISUIDISH_EVENT_ENDPOINT=/api/v1/device/session_events
Environment=HISUIDISH_API_TOKEN=replace_me
Environment=HISUIDISH_DEVICE_ID=replace_me
```

この方式で、開発から本番への切替時もコード変更は不要
