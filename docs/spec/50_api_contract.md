# 50 API Contract

## 認証

- 固定トークン方式（ヘッダ名、形式をここに書く）

## Endpoints（例）

### GET /api/v1/health

- 認証：不要
- レスポンス：{"ok": true} など

### POST /api/v1/bowl_snapshots

- 認証：必要
- リクエスト（例）
  - device_id: string
  - recorded_at: ISO8601（UTC で送る/またはサーバで変換…方針を明記）
  - weight_g: integer
  - ...（必要項目）
- レスポンス（例）
  - id
  - recorded_at
  - weight_g

## エラー

- 401：認証不備
- 422：バリデーション
