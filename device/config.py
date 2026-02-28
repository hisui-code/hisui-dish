import os
from pathlib import Path

# ここはデバイス側の挙動を決める定数定義
# 実機テストで調整する値はこのファイルに集約する

# GPIOピン
DOUT_PIN = 5
PD_SCK_PIN = 6

# 計測周期
READ_SLEEP_SEC = 0.1
# 移動平均のサンプル数
MOVING_AVG_WINDOW = 10
# 起動時ゼロ補正の計測秒
RUNTIME_ZERO_SECONDS = 3.0

# 食事開始判定 閾値以上減ったら開始
# 小さくしすぎると接触ノイズで誤開始しやすい
START_THRESHOLD_G = 1.0
# 開始判定の継続秒 この秒数dropが続いたら開始する
START_CONFIRM_SECONDS = 0.5
# 待機中の上方向スパイク許容幅 これを超える増加はbaseline更新しない
IDLE_UP_SPIKE_IGNORE_G = 5.0
# 安定判定 隣接サンプル差がこの値以下なら安定寄りとみなす
STABILITY_EPSILON_G = 0.2
# 安定継続秒 この秒数安定したら終了方向へ進める
END_STABLE_SECONDS = 5.0
# STABILIZINGで最終確認する秒数
FINALIZE_SECONDS = 2.0
# 異常長時間セッションの中断秒
MAX_SESSION_SECONDS = 30 * 60
# 食事量として扱う最小差分
# これ未満はノイズとして破棄する
MIN_CONSUMED_G = 2.0

# 校正値保存先
CALIBRATION_FILE = Path(__file__).resolve().parent / 'calibration.json'
# セッション結果のローカル保存先
SESSION_EVENTS_FILE = Path(__file__).resolve().parent / 'session_events.jsonl'
# 送信キュー保存先
SESSION_QUEUE_FILE = Path(__file__).resolve().parent / 'session_queue.jsonl'

# キャリブレーション設定
KNOWN_WEIGHT_G = 100.0
SAMPLE_COUNT = 30
SAMPLE_SLEEP_SEC = 0.05

# 送信設定
API_BASE_URL = os.getenv('HISUIDISH_API_BASE', 'http://localhost:8000')
DEVICE_EVENT_ENDPOINT = os.getenv('HISUIDISH_EVENT_ENDPOINT', '/api/v1/device/session_events')
API_TOKEN = os.getenv('HISUIDISH_API_TOKEN', '')
DEVICE_ID = os.getenv('HISUIDISH_DEVICE_ID', '')
API_TIMEOUT_SEC = 5

# 再送キュー設定
# 仕様どおり 1分ごとに再送する
RETRY_INTERVAL_SEC = 60
# 仕様どおり 最大10回でfailed扱い
MAX_RETRY_COUNT = 10
# ループ中の再送チェック間隔
QUEUE_FLUSH_INTERVAL_SEC = 1.0
