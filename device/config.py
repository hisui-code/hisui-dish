import os
from pathlib import Path

# ここはデバイス側の挙動を決める定数定義
# 実機テストで調整する値はこのファイルに集約する


def _load_env_file(path: Path) -> dict[str, str]:
    """
    @description .env形式ファイルを辞書として読み込む
    """
    if not path.exists():
        return {}

    loaded: dict[str, str] = {}
    with path.open('r', encoding='utf-8') as fp:
        for line in fp:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue

            key, value = line.split('=', 1)
            loaded[key.strip()] = value.strip()

    return loaded


def _build_file_env() -> dict[str, str]:
    """
    @description device配下の.envを読み込み、環境別ファイルを重ねる
    """
    base_dir = Path(__file__).resolve().parent

    # 共通設定を .env から読み込む
    merged = _load_env_file(base_dir / '.env')

    # 対象環境の決定順
    # 1. HISUIDISH_ENV（デバイス専用の明示指定）
    # 2. APP_ENV（一般的な環境名）
    # 3. development（未指定時の既定値）
    target_env = (
        os.getenv('HISUIDISH_ENV', '').strip()
        or os.getenv('APP_ENV', '').strip()
        or 'development'
    )
    # .env.<env> が存在すれば共通設定に上書きする
    merged.update(_load_env_file(base_dir / f'.env.{target_env}'))

    return merged


FILE_ENV = _build_file_env()


def _env(key: str, default: str = '') -> str:
    """
    @description 環境変数を OS -> .envファイル -> 既定値 の優先順で解決する
    """
    return os.getenv(key, FILE_ENV.get(key, default))

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
API_BASE_URL = _env('HISUIDISH_API_BASE', 'http://localhost:8000')
DEVICE_EVENT_ENDPOINT = _env('HISUIDISH_EVENT_ENDPOINT', '/api/v1/device/session_events')
API_TOKEN = _env('HISUIDISH_API_TOKEN', '')
DEVICE_ID = _env('HISUIDISH_DEVICE_ID', '')
API_TIMEOUT_SEC = 5

# 再送キュー設定
# 仕様どおり 1分ごとに再送する
RETRY_INTERVAL_SEC = 60
# 仕様どおり 最大10回でfailed扱い
MAX_RETRY_COUNT = 10
# ループ中の再送チェック間隔
QUEUE_FLUSH_INTERVAL_SEC = 1.0
