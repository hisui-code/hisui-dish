# 50 API Contract

## 認証

- `POST /api/v1/login` と `GET /api/v1/health` 以外は認証必須
- 認証ヘッダは `Authorization: Bearer <auth_token>`
- 認証失敗時は `401 {"error":"unauthorized"}`
- 本番環境で `API_TOKEN` を設定した場合は `X-Api-Token` も必須

## Endpoints

### GET /api/v1/health

- 認証：不要
- レスポンス（200）
  - `status`: `ok`
  - `time`: ISO8601文字列（JST）

### POST /api/v1/login

- 認証：必要
- リクエスト
  - `email`: string
  - `password`: string
- レスポンス（200）
  - `auth_token`: string
  - `body.email`: string
- エラー
  - 401: `{"error":"invalid_credentials"}`

### GET /api/v1/users

- 認証：必要（admin のみ）
- レスポンス（200）
  - `users`: 配列
    - `id`: number
    - `name`: string|null
    - `email`: string
    - `role`: `admin` | `user`
    - `updated_at`: ISO8601文字列
- エラー
  - 401: 未認証
  - 403: admin以外（`{"error":"forbidden"}`）

### PATCH /api/v1/users/{user_id}/role

- 認証：必要（admin のみ）
- リクエスト
  - `role`: `admin` | `user`
- レスポンス（200）
  - `user`
    - `id`, `name`, `email`, `role`, `updated_at`
- エラー
  - 401: 未認証
  - 403: admin以外
  - 404: 対象ユーザーなし
  - 422: バリデーションエラー

### DELETE /api/v1/users/{user_id}

- 認証：必要（admin のみ）
- レスポンス（204）
  - ボディなし
- エラー
  - 401: 未認証
  - 403: admin以外
  - 404: 対象ユーザーなし
  - 409: 自己削除禁止（`{"error":"self_delete_forbidden"}`）

## エラー

- 401：認証不備
- 403：権限不足
- 404：対象なし
- 409：競合/許可されない状態遷移
- 422：バリデーション
