# 30 Data Model

## タイムゾーン方針

- DB は UTC で保存（timestamptz）
- 集計や「今日」は JST 境界で期間を作り、UTC に変換してクエリ

## Tables

### bowl_snapshots

- id
- device_id
- recorded_at (timestamptz, UTC)
- weight_g
- created_at / updated_at (timestamptz, UTC)

### device_settings（ある場合）

- device_id
- sampling_hz
- moving_avg_window
- gross_weight_limit_g
- stable_duration_sec
- max_session_sec
- lock_version
