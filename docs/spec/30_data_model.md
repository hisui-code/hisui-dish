# 30 Data Model

## タイムゾーン方針

- DB は UTC で保存（timestamptz）
- 集計や「今日」は JST 境界で期間を作り、UTC に変換してクエリ

## Tables

### bowl_snapshots

- 主キー
  - id (uuid)
- カラム
  - id (uuid, NOT NULL)
  - device_id (uuid, NOT NULL)
  - recorded_at (timestamptz, NOT NULL, UTC)
  - weight_g (integer, NOT NULL)
  - created_at / updated_at (timestamptz, UTC)
- 制約
  - device_id は devices.id を参照（ON DELETE CASCADE）
- インデックス
  - (device_id, recorded_at)

### device_settings

- 主キー
  - device_id (uuid)
- カラム
  - device_id (uuid, NOT NULL)
  - stable_duration_sec (integer)
  - max_session_sec (integer)
  - sampling_hz (integer)
  - moving_avg_window (integer)
  - gross_weight_limit_g (integer)
  - tare_weight (integer)
  - stability_epsilon_g (integer)
  - lock_version (integer, NOT NULL, default: 0)
  - created_at / updated_at (timestamptz, UTC)
- 制約
  - device_id は devices.id を参照（ON DELETE CASCADE）
- 補足
  - API 更新時は各数値を必須として扱う

### devices

- 主キー
  - id (uuid)
- カラム
  - id (uuid, NOT NULL)
  - code (string, NOT NULL)
  - name (string, nullable)
  - last_seen_at (timestamptz, nullable, UTC)
  - created_at / updated_at (timestamptz, UTC)
- 制約
  - code は UNIQUE

### users

- 主キー
  - id (bigint)
- カラム
  - id (bigint, NOT NULL)
  - name (string)
  - email (string, NOT NULL)
  - password (string, NOT NULL)
  - role (string, NOT NULL, default: user)
  - created_at / updated_at (timestamptz, UTC)
- 制約
  - email は UNIQUE
  - role の許可値は admin / user / guest
- 補足
  - email_verified_at は廃止
  - remember_token は廃止
  - 権限制御は role を参照して判定する

### personal_access_tokens

- 主キー
  - id (bigint)
- カラム
  - id (bigint, NOT NULL)
  - tokenable_type (string, NOT NULL)
  - tokenable_id (bigint, NOT NULL)
  - name (string, NOT NULL)
  - token (string(64), NOT NULL)
  - abilities (text, nullable)
  - last_used_at (timestamp, nullable)
  - expires_at (timestamp, nullable)
  - created_at / updated_at (timestamp)
- 制約
  - token は UNIQUE
- 補足
  - API 認証トークン（Sanctum）を保持する
