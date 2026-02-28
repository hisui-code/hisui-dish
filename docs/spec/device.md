# Device Spec（Raspberry Pi + HX711）

## 1. 目的

- 猫の食事量を重量変化から計測する
- 1回の食事セッション終了時に結果をAPIへ送信する

## 2. 用語

- 待機モード: 食事開始を監視する状態
- 計測モード: 食事セッション中の状態
- 安定判定: 重量変動が許容範囲内に収まっている状態
- セッション: 食事開始から終了までの1区間

## 3. 設定値（device_settings）

- `stable_duration_sec`: 安定継続秒数
- `max_session_sec`: セッション強制終了秒数
- `sampling_hz`: サンプリング頻度
- `moving_avg_window`: 移動平均窓サイズ
- `gross_weight_limit_g`: 異常重量上限
- `tare_weight`: 器の重さ
- `stability_epsilon_g`: 安定判定の許容変動
- `lock_version`: 楽観ロック

## 4. 状態遷移

1. 待機モード
2. 食事開始判定で計測モードへ遷移
3. 食事終了判定で安定タイマー開始
4. `stable_duration_sec` 継続でセッション終了
5. 結果送信後、待機モードへ戻る

### 4.1 状態機械（明文化）

- `IDLE`（待機）
- `MEASURING`（計測中）
- `STABILIZING`（終了候補の安定待ち）
- `FINISHED`（正常終了）
- `ABORTED`（強制終了/異常終了）

### 4.2 遷移条件

- `IDLE -> MEASURING`
  - 重量が減少傾向になったとき
- `MEASURING -> STABILIZING`
  - 重量変動が `stability_epsilon_g` 以内に収まったとき
- `STABILIZING -> MEASURING`
  - 安定待ち中に再び変動が `stability_epsilon_g` を超えたとき
- `STABILIZING -> FINISHED`
  - 安定状態が `stable_duration_sec` 継続したとき
- `MEASURING -> ABORTED`
  - セッション開始から `max_session_sec` 到達時
- `FINISHED -> IDLE`
  - 送信処理完了後
- `ABORTED -> IDLE`
  - 中断処理完了後

## 5. 判定ロジック

### 5.1 食事開始判定

- ボウル重量が減少した場合に開始候補とする
- 判定は生値ではなく `moving_avg_window` で平均化した重量で行う
- 重量増加は食事開始としない（給餌/接触イベント扱い）

### 5.2 食事終了判定

- 重量変動が `stability_epsilon_g` 以内の状態が継続したら終了候補
- 判定は `moving_avg_window` で平均化した重量の変動で行う
- 終了候補から `stable_duration_sec` 継続で確定終了

### 5.3 送信条件

- 食事前後差分が `stability_epsilon_g` 未満なら送信しない
- 差分が `tare_weight` 以上なら異常扱いで送信しない（皿持ち上げ想定）

## 6. 強制終了

- セッション開始から `max_session_sec` 到達時は強制終了
- 強制終了セッションは食事結果を保存しない

## 7. データ保存方針（分離保存）

### 7.1 生データ（Raw）

- 目的
  - センサー入力のトレースを残す
  - 判定ロジックの後追い検証を可能にする
- 例
  - `recorded_at`
  - `weight_g`
  - `device_id`

### 7.2 判定イベント（Derived Event）

- 目的
  - いつ何の判定が起きたかを明確にする
  - デバッグと運用時の説明責任を担保する
- 例
  - `session_start`
  - `session_end`
  - `session_abort`
  - `abort_reason`
  - `consumed_grams`

## 8. ボウル重量の扱い

- ボウル重量 = `tare_weight` + 餌重量
- 微小揺れは許容する（1g未満はノイズ扱い）
- 食事判定に使わない変動でも、最新重量の同期方針は別途定義する

## 9. API送信失敗時の再送キュー

- 送信失敗時はローカルキューへ格納する
- キュー投入対象
  - `FINISHED` で確定した送信payload
- 再送ポリシー
  - 1分おきに再送する
  - 最大10回まで試行する
  - 10回失敗したレコードは `failed` 扱いで保持し、手動調査対象にする
- 冪等性
  - 同一セッションIDで重複送信されても重複登録されない設計にする

### 9.1 セッション送信API payload（確定）

- エンドポイント
  - `POST /api/v1/device/session_events`
- 送信項目
  - `session_id`（必須）
    - デバイス側で生成するセッション識別子
    - 冪等キーとして扱う
  - `device_id`（必須）
    - 送信元デバイス識別子
  - `event`（必須）
    - イベント種別
    - 現在は `eat_finished` / `eat_discarded`
    - 将来の給餌イベント追加を想定して維持する
  - `eaten`（必須）
    - 算出した摂取量（g）
  - `recorded_at`（必須）
    - デバイス側で記録したイベント時刻（ISO8601）
- 送信しない項目
  - `start` は送信しない
  - `min` は送信しない

### 9.2 集計元データの方針（確定）

- `bowl_snapshots`
  - 現在重量の時系列データを保持する
  - 残量表示や重量推移確認に使う
- `device_session_events`
  - 食事イベント集計の一次データとする
  - 日次/月次/年次の摂取量集計は `eaten`（保存時は `eaten_grams`）を使う

## 10. DeviceSettings同期

- フロントで DeviceSettings を更新したときは、バックエンド経由でデバイスへ反映する
- 反映フロー
  1. フロントが `device_settings` 更新APIを呼ぶ
  2. バックエンドが設定を保存する
  3. デバイスは起動時に設定取得APIで最新設定を同期する
- 同期保証
  - 設定反映時は `lock_version` を比較し、更新がある場合のみ適用する
  - 適用後は「適用済みversion」をバックエンドへack送信する（可能な場合）

## 11. 異常系

- 皿持ち上げ/落下
- 給餌による急増
- センサー読み取りエラー
- API送信失敗（ローカルキュー再送対象）

## 12. 未決事項

- 「減少傾向」の厳密条件（連続サンプル数、閾値）
- ノイズ除去方式（移動平均のみか、追加フィルタ併用か）
- 失敗キューの運用監視方法（アラート・回収手順）

## 13. 起動コマンド

### 13.1 手動起動（開発）

- Raspberry Pi での標準起動コマンドは以下とする

```bash
python3 /opt/hisuidish/device/main.py
```

### 13.2 常駐起動（本番）

- systemd から同じエントリポイントを起動する
- `ExecStart` は手動起動コマンドと同一にする

```ini
ExecStart=/usr/bin/python3 /opt/hisuidish/device/main.py
```

### 13.3 前提環境変数

- `HISUIDISH_API_BASE`（APIベースURL）
- `HISUIDISH_DEVICE_ID`（対象デバイスID）
- `HISUIDISH_API_TOKEN`（必要な場合のみ）

## 14. 開発環境（Docker）

### 14.1 方針

- フロント用 `web` コンテナとは分離し、`device` 専用コンテナで開発する
- Python 実行環境を固定し、ラズパイ実装へ移行しやすくする

### 14.2 Dockerfile

- `infra/docker/device.Dockerfile` を作成する

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    bash curl git \
 && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
```

### 14.3 docker-compose 追加設定

- `infra/docker/docker-compose.dev.yml` に `device` サービスを追加する

```yml
  device:
    build:
      context: ../..
      dockerfile: infra/docker/device.Dockerfile
    working_dir: /app
    volumes:
      - ../../device:/app
    env_file:
      - ../../.env
    depends_on:
      - api-laravel
```

### 14.4 起動と確認

- ビルドと起動

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d --build device
```

- Python バージョン確認

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec device python --version
```

- コンテナ内シェル

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec device bash
```

### 14.5 最低ディレクトリ構成

- ローカルリポジトリに `device/` を作成し、以下を配置する
  - `device/main.py`
  - `device/requirements.txt`
  - `device/README.md`
