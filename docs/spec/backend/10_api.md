# Backend API

## 概要

Backend が提供する API をまとめている。

## Device 系

- Device から送られたデータを保存する API
- `POST /api/v1/device/session_events`
- `POST /api/v1/device/bowl_snapshots`
- `GET /api/v1/device/device_settings/{device_id}`
- `GET /api/v1/device/device_settings/{device_id}/version`

詳細:

- `15_device_session_events.md`
- `16_bowl_snapshots.md`

## 集計系

- Web UI に表示する集計結果を返す API
- `GET /api/v1/dashboard`
- `GET /api/v1/daily_totals`
- `GET /api/v1/year_monthly_totals`

詳細:

- `11_dashboard.md`
- `12_daily_totals.md`
- `13_year_monthly_totals.md`

## DeviceSettings 系

- Web 管理画面が DeviceSettings を取得、更新する API
- `GET /api/v1/device_settings/{device_id}`
- `PUT /api/v1/device_settings/{device_id}`
- `PATCH /api/v1/device_settings/{device_id}`

詳細:

- `17_device_settings.md`

## ログ系

- 食事ログの一覧取得と削除を行う API
- `GET /api/v1/logs`
- `DELETE /api/v1/logs/{log_id}`

詳細:

- `14_logs.md`

## 認証、ユーザー系

- Web 画面のログインやユーザー管理を行う API
- `POST /api/v1/login`
- `POST /api/v1/logout`
- `GET /api/v1/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/{user_id}`
- `PATCH /api/v1/users/{user_id}`
- `DELETE /api/v1/users/{user_id}`
