from pathlib import Path

# GPIOピン
DOUT_PIN = 5
PD_SCK_PIN = 6

# 計測周期
READ_SLEEP_SEC = 0.1
# 移動平均のサンプル数
MOVING_AVG_WINDOW = 10
# 起動時ゼロ補正の計測秒
RUNTIME_ZERO_SECONDS = 3.0
# 生値の絶対値ガード
RAW_ABS_MAX = 1_000_000.0
# 生値ジャンプ幅ガード
RAW_JUMP_MAX = 50_000.0

# 食事開始判定 閾値以上減ったら開始
START_THRESHOLD_G = 0.5
# 開始判定の継続秒 この秒数dropが続いたら開始する
START_CONFIRM_SECONDS = 1.0
# 安定判定 隣接サンプル差がこの値以下なら安定寄りとみなす
STABILITY_EPSILON_G = 0.2
# 安定継続秒 この秒数安定したら終了方向へ進める
END_STABLE_SECONDS = 5.0
# STABILIZINGで最終確認する秒数
FINALIZE_SECONDS = 2.0
# 異常長時間セッションの中断秒
MAX_SESSION_SECONDS = 30 * 60

# 校正値保存先
CALIBRATION_FILE = Path(__file__).resolve().parent / 'calibration.json'

# キャリブレーション設定
KNOWN_WEIGHT_G = 100.0
SAMPLE_COUNT = 30
SAMPLE_SLEEP_SEC = 0.05
