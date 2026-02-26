import json
import time
from collections import deque
from enum import StrEnum
from pathlib import Path

import RPi.GPIO as GPIO
from hx711 import HX711

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
START_THRESHOLD_G = 0.5
# 安定判定 隣接サンプル差がこの値以下なら安定寄りとみなす
STABILITY_EPSILON_G = 0.2
# 安定継続秒 この秒数安定したら終了方向に進める
END_STABLE_SECONDS = 5.0
# STABILIZINGで最終確認する秒数
FINALIZE_SECONDS = 2.0
# 異常長時間セッションの中断秒
MAX_SESSION_SECONDS = 30 * 60

# 校正値保存先
CALIBRATION_FILE = Path(__file__).resolve().parent / 'calibration.json'


class EatingState(StrEnum):
    """
    @description 食事判定の状態
    """

    IDLE = 'IDLE'
    MEASURING = 'MEASURING'
    STABILIZING = 'STABILIZING'
    FINISHED = 'FINISHED'
    ABORTED = 'ABORTED'


def load_calibration() -> tuple[float, float]:
    """
    @description calibration.jsonからoffsetとscaleを読み込む
    """
    if not CALIBRATION_FILE.exists():
        raise RuntimeError(f'校正値ファイルが見つからない: {CALIBRATION_FILE}')

    data = json.loads(CALIBRATION_FILE.read_text(encoding='utf-8'))
    offset = float(data['offset'])
    scale = float(data['scale'])

    if scale == 0:
        raise RuntimeError('scaleが0のためg変換できない')

    return offset, scale


def create_sensor() -> HX711:
    """
    @description HX711を初期化して返す
    """
    # DOUT/PD_SCKはBCM番号で扱う
    GPIO.setmode(GPIO.BCM)
    return HX711(dout_pin=DOUT_PIN, pd_sck_pin=PD_SCK_PIN)


def read_raw_once(sensor: HX711) -> float:
    """
    @description HX711から生データを1回取得する
    """
    # ライブラリ差分を吸収して1サンプルを取得する
    if hasattr(sensor, 'get_raw_data_mean'):
        value = sensor.get_raw_data_mean(readings=1)
    elif hasattr(sensor, 'get_raw_data'):
        data = sensor.get_raw_data(1)
        value = data[0] if data else None
    elif hasattr(sensor, 'read'):
        value = sensor.read()
    else:
        raise RuntimeError('HX711の読み取りAPIが見つからない')

    if value is None:
        raise RuntimeError('HX711の読み取りに失敗')

    return float(value)


def convert_raw_to_grams(raw: float, offset: float, scale: float) -> float:
    """
    @description 生データをgに変換する
    """
    return (raw - offset) / scale


def measure_runtime_zero(sensor: HX711, offset: float, scale: float) -> float:
    """
    @description 起動時の空状態を計測してランタイムゼロ点を算出する
    """
    end_at = time.monotonic() + RUNTIME_ZERO_SECONDS
    samples: list[float] = []

    while time.monotonic() < end_at:
        raw = read_raw_once(sensor)
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)
        samples.append(grams)
        time.sleep(READ_SLEEP_SEC)

    if not samples:
        raise RuntimeError('ランタイムゼロ点の計測に失敗')

    return sum(samples) / len(samples)


def main() -> None:
    """
    @description 校正値を適用して重さを監視し食事状態を判定する
    """
    offset, scale = load_calibration()
    sensor = create_sensor()
    runtime_zero = measure_runtime_zero(sensor=sensor, offset=offset, scale=scale)

    # 短期ノイズを抑えるために移動平均を使う
    history: deque[float] = deque(maxlen=MOVING_AVG_WINDOW)

    # 直近の安定重量基準 ここからの減少量で食事開始を判定する
    baseline_grams: float | None = None
    prev_avg_grams: float | None = None

    state = EatingState.IDLE
    session_started_at = 0.0
    stabilized_since = 0.0
    meal_start_weight = 0.0
    meal_min_weight = 0.0

    print('HisuiDish device start')
    print(
        f'offset={offset}, scale={scale}, moving_avg_window={MOVING_AVG_WINDOW}, '
        f'start_threshold={START_THRESHOLD_G}, stability_epsilon={STABILITY_EPSILON_G}, '
        f'runtime_zero={runtime_zero:.2f}'
    )

    while True:
        now = time.monotonic()
        raw = read_raw_once(sensor)
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)
        # 起動時に測ったゼロ点を差し引いて判定用の重さを作る
        net_grams = grams - runtime_zero

        history.append(net_grams)
        avg_grams = sum(history) / len(history)

        # 初期化時は現在値を基準にして開始判定を誤作動させない
        if baseline_grams is None:
            baseline_grams = avg_grams

        # 判定ロジック
        if state == EatingState.IDLE:
            # 基準が急変しないように緩く追従させる
            baseline_grams = baseline_grams * 0.95 + avg_grams * 0.05
            drop_from_baseline = baseline_grams - avg_grams

            if drop_from_baseline >= START_THRESHOLD_G:
                state = EatingState.MEASURING
                session_started_at = now
                stabilized_since = now
                meal_start_weight = baseline_grams
                meal_min_weight = avg_grams
                print(
                    f'event=eat_started baseline={meal_start_weight:.2f} '
                    f'current={avg_grams:.2f} drop={drop_from_baseline:.2f}'
                )

        elif state == EatingState.MEASURING:
            meal_min_weight = min(meal_min_weight, avg_grams)

            # 変動が小さい期間を数えて終了方向へ遷移する
            if prev_avg_grams is not None and abs(avg_grams - prev_avg_grams) <= STABILITY_EPSILON_G:
                if now - stabilized_since >= END_STABLE_SECONDS:
                    state = EatingState.STABILIZING
                    stabilized_since = now
                    print('event=eat_stabilizing')
            else:
                stabilized_since = now

            # 異常に長いセッションは打ち切る
            if now - session_started_at >= MAX_SESSION_SECONDS:
                state = EatingState.ABORTED

        elif state == EatingState.STABILIZING:
            # 安定確認中に再び変動が大きくなれば計測に戻す
            if prev_avg_grams is not None and abs(avg_grams - prev_avg_grams) > STABILITY_EPSILON_G:
                state = EatingState.MEASURING
                stabilized_since = now
            elif now - stabilized_since >= FINALIZE_SECONDS:
                state = EatingState.FINISHED

        if state == EatingState.FINISHED:
            eaten = meal_start_weight - meal_min_weight
            print(
                f'event=eat_finished start={meal_start_weight:.2f} '
                f'min={meal_min_weight:.2f} eaten={eaten:.2f}'
            )
            baseline_grams = avg_grams
            state = EatingState.IDLE

        elif state == EatingState.ABORTED:
            print('event=eat_aborted reason=session_timeout')
            baseline_grams = avg_grams
            state = EatingState.IDLE

        # 常時ログ 生値と判定状態を同時に確認できるようにする
        print(
            f'state={state} raw={raw:.2f} grams={grams:.2f} '
            f'net_grams={net_grams:.2f} avg_grams={avg_grams:.2f} baseline={baseline_grams:.2f}'
        )

        prev_avg_grams = avg_grams
        time.sleep(READ_SLEEP_SEC)


if __name__ == '__main__':
    try:
        main()
    finally:
        # 終了時にGPIOを開放する
        GPIO.cleanup()
