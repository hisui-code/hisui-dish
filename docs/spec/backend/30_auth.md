# Backend Auth

## 目的

Web 利用者のログイン方法と、API を使う時の認証、認可のルールをまとめる。

## 用語

- `auth_token`
  - ログイン成功時に返すアクセストークン
- `Authorization: Bearer ...`
  - 認証が必要な API を使う時に付けるヘッダー
- `role`
  - ユーザーの権限
- `admin`
  - ユーザー管理 API を使える管理者権限

## 認証の考え方

- Web 利用者は `login` で `auth_token` を受け取る
- その後は `Authorization: Bearer {auth_token}` を付けて API を使う
- Backend は受け取ったトークンからユーザーを特定する
- トークンは `personal_access_tokens` に保存する

## ログイン

### 対象 API

- `POST /api/v1/login`

### 何をするか

メールアドレスとパスワードを確認し、利用者用のアクセストークンを発行する。

### 入力

- `email`
- `password`

### 出力

- `auth_token`
- `body`
  - `user_id`
  - `name`
  - `email`
  - `role`

### 処理内容

1. `email` と `password` を受け取る
2. ユーザー認証に成功したら Sanctum のトークンを発行する
3. 発行した `auth_token` とユーザー情報を返す

### 異常系

- 入力形式が不正な時は `422`
- メールアドレスまたはパスワードが違う時は `401`
- エラーコードは `invalid_credentials`

### 補足

- 同じユーザーが複数回ログインできる
- 新しくログインしても、前のトークンはそのまま残る

## ログアウト

### 対象 API

- `POST /api/v1/logout`

### 何をするか

今使っているトークンだけを無効にする。

### 入力

- `Authorization: Bearer {auth_token}`

### 処理内容

1. `Authorization` ヘッダーから現在のトークンを取り出す
2. そのトークンだけを削除する
3. `204` を返す

### 異常系

- 認証情報が無い時は `401`
- エラーコードは `unauthorized`

### 補足

- 他の端末や他のブラウザで使っているトークンには影響しない

## 現在の利用者情報

### 対象 API

- `GET /api/v1/me`

### 何をするか

今ログインしている利用者の情報を返す。

### 入力

- `Authorization: Bearer {auth_token}`

### 補足

- Frontend はログイン状態の確認に使う
- 返す内容の詳細は Users API の `me` に準ずる

## 認可

### 何をするか

ログイン済みユーザーの中でも、権限に応じて使える API を分ける。

### ルール

- `users.role` を使って権限を判定する
- `admin` のみ Users 一覧、追加、削除を行える
- `admin` 以外が管理者 API を呼んだ時は `403`
- エラーコードは `forbidden`

## DeviceSettings と集計 API

### 何をするか

ダッシュボード、ログ、DeviceSettings などの API は、ログイン済みユーザーだけが使える。

### 対象

- `GET /api/v1/dashboard`
- `GET /api/v1/daily_totals`
- `GET /api/v1/year_monthly_totals`
- `GET /api/v1/logs`
- `DELETE /api/v1/logs/{log_id}`
- `GET /api/v1/device_settings/{device_id}`
- `GET /api/v1/device_settings/{device_id}/version`
- `PATCH /api/v1/device_settings/{device_id}`
- `PUT /api/v1/device_settings/{device_id}`

## Device 系 API

### 何をするか

`/api/v1` 配下の API は、必要に応じて `X-Api-Token` でも保護する。

### ルール

- `api.token` ミドルウェアを通す
- 本番環境では `X-Api-Token` が必要
- 開発環境では `X-Api-Token` を省略できる
- Device は `X-Api-Token` を付けてアクセスする
- Device の送信 API では冪等キーで重複保存を防ぐ

### 対象

- `/api/v1` 配下の API 全体
- `POST /api/v1/device/session_events`
- `POST /api/v1/device/bowl_snapshots`
