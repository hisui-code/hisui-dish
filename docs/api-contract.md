# Rails API Contract (v1)

Base path: `/api/v1`

## Authentication

- All endpoints require authentication **except** `POST /login` and `GET /health`.
- Header: `Authorization: Bearer <auth_token>`
  - The token is extracted as the last whitespace-separated segment, so `Bearer <token>` is the expected format.
- If missing/invalid: `401` with `{"error":"unauthorized"}`.
- **Production-only extra check**: when `API_TOKEN` is set, requests must include `X-Api-Token` with the exact value or the API returns `403` with an empty body.

## POST /api/v1/login

- Auth: none
- Content-Type: `application/json`

Request JSON:

```json
{
  "email": "string",
  "password": "string"
}
```

Success (200):

```json
{
  "auth_token": "string",
  "body": {
    "email": "string"
  }
}
```

Failure (401):

```json
{
  "error": "invalid_credentials"
}
```

Curl (success):

```bash
curl -s -X POST http://localhost:3000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hisui@mail.com","password":"password"}'
```

Curl (failure):

```bash
curl -s -X POST http://localhost:3000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hisui@mail.com","password":"wrong"}'
```

## GET /api/v1/health

- Auth: none

Success (200):

```json
{
  "status": "ok",
  "time": "2025-01-01T12:34:56.789+09:00"
}
```

Curl:

```bash
curl -s http://localhost:3000/api/v1/health
```

## GET /api/v1/device_settings/:device_id

- Auth: required
- Path params:
  - `device_id` (UUID)

Success (200):

```json
{
  "device_id": "uuid",
  "stable_duration_sec": 180,
  "max_session_sec": 600,
  "lock_version": 0,
  "tare_weight": 250,
  "stability_epsilon_g": 5,
  "sampling_hz": 10,
  "moving_avg_window": 5,
  "gross_weight_limit_g": 10000,
  "updated_at": "2025-01-01T12:34:56.789+09:00"
}
```

Failure (404) when device or device_setting is missing:

```json
{
  "error": "not_found"
}
```

Failure (401) when not authenticated:

```json
{
  "error": "unauthorized"
}
```

Curl (success):

```bash
curl -s http://localhost:3000/api/v1/device_settings/<device_id> \
  -H 'Authorization: Bearer <auth_token>'
```

Curl (failure - unauthorized):

```bash
curl -s http://localhost:3000/api/v1/device_settings/<device_id>
```

## PUT/PATCH /api/v1/device_settings/:device_id

- Auth: required
- Content-Type: `application/json`
- Path params:
  - `device_id` (UUID)

Request JSON (nested under `device_setting`):

```json
{
  "device_setting": {
    "stable_duration_sec": 180,
    "max_session_sec": 600,
    "lock_version": 0,
    "tare_weight": 250,
    "stability_epsilon_g": 5,
    "sampling_hz": 10,
    "moving_avg_window": 5,
    "gross_weight_limit_g": 10000
  }
}
```

Validation rules (model-level): all numeric fields are integers and must be `> 0`.

Success (200): same shape as GET, and `lock_version` is incremented by 1 on update.

Failure (404) when device or device_setting is missing:

```json
{
  "error": "not_found"
}
```

Failure (409) when `lock_version` is stale:

```json
{
  "error": "conflict",
  "current_version": 2
}
```

Failure (422) for validation errors:

```json
{
  "error": "unprocessable_entity",
  "messages": ["Stable duration sec must be greater than 0"]
}
```

Failure (401) when not authenticated:

```json
{
  "error": "unauthorized"
}
```

Curl (success):

```bash
curl -s -X PUT http://localhost:3000/api/v1/device_settings/<device_id> \
  -H 'Authorization: Bearer <auth_token>' \
  -H 'Content-Type: application/json' \
  -d '{"device_setting":{"stable_duration_sec":180,"max_session_sec":600,"lock_version":0,"tare_weight":250,"stability_epsilon_g":5,"sampling_hz":10,"moving_avg_window":5,"gross_weight_limit_g":10000}}'
```

Curl (failure - conflict):

```bash
curl -s -X PUT http://localhost:3000/api/v1/device_settings/<device_id> \
  -H 'Authorization: Bearer <auth_token>' \
  -H 'Content-Type: application/json' \
  -d '{"device_setting":{"stable_duration_sec":180,"max_session_sec":600,"lock_version":-1,"tare_weight":250,"stability_epsilon_g":5,"sampling_hz":10,"moving_avg_window":5,"gross_weight_limit_g":10000}}'
```

## GET /api/v1/dashboard

- Auth: required
- Query params:
  - `month` (optional, `YYYY-MM`, default current month)
  - `device_id` (optional, default `Device.first.id`)

Notes:
- `month` is not validated; invalid strings can raise an error (no explicit 400 handler).
- If no device exists and `device_id` is missing, response is 404.

Success (200):

```json
{
  "todayEvents": [
    {"time":"09:10","g":12.5}
  ],
  "dailySeries": [
    {"day":"1","total":0},
    {"day":"2","total":24}
  ],
  "todayTotal": 36.5,
  "bowlRemaining": 120.0,
  "averageDailyIntakeLast3Months": 45.2
}
```

Failure (404) when device is missing:

```json
{
  "error": "device not found"
}
```

Curl (success):

```bash
curl -s 'http://localhost:3000/api/v1/dashboard?month=2025-01&device_id=<device_id>' \
  -H 'Authorization: Bearer <auth_token>'
```

Curl (failure - device not found):

```bash
curl -s 'http://localhost:3000/api/v1/dashboard' \
  -H 'Authorization: Bearer <auth_token>'
```

## GET /api/v1/logs

- Auth: required
- Query params:
  - `month` (optional, `YYYY-MM`, default current month)
  - `device_id` (optional, default `Device.first.id`)

Success (200):

```json
{
  "logs": [
    {
      "id": "uuid",
      "recordedAtIso": "2025-01-01T12:34:56+09:00",
      "grams": 120
    }
  ]
}
```

- Sorting: `recorded_at DESC`, then `id DESC`.
- `recordedAtIso` is serialized in `Asia/Tokyo` timezone.

Failure (400) when month is invalid:

```json
{
  "error": "invalid month"
}
```

Failure (404) when device is missing:

```json
{
  "error": "device not found"
}
```

Curl (success):

```bash
curl -s 'http://localhost:3000/api/v1/logs?month=2025-01&device_id=<device_id>' \
  -H 'Authorization: Bearer <auth_token>'
```

Curl (failure - invalid month):

```bash
curl -s 'http://localhost:3000/api/v1/logs?month=invalid' \
  -H 'Authorization: Bearer <auth_token>'
```
