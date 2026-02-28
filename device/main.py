import time
from collections import deque

from config import (
    CALIBRATION_FILE,
    DOUT_PIN,
    END_STABLE_SECONDS,
    FINALIZE_SECONDS,
    MAX_SESSION_SECONDS,
    MOVING_AVG_WINDOW,
    PD_SCK_PIN,
    RAW_ABS_MAX,
    RAW_JUMP_MAX,
    READ_SLEEP_SEC,
    RUNTIME_ZERO_SECONDS,
    START_CONFIRM_SECONDS,
    STABILITY_EPSILON_G,
    START_THRESHOLD_G,
)
from calibration_store import load_calibration
from eating_state_machine import EatingDetector, EatingDetectorConfig
from hx711_reader import cleanup_gpio, convert_raw_to_grams, create_sensor, read_raw_once


def measure_runtime_zero(sensor, offset: float, scale: float) -> float:
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
    offset, scale = load_calibration(CALIBRATION_FILE)
    sensor = create_sensor(dout_pin=DOUT_PIN, pd_sck_pin=PD_SCK_PIN)
    runtime_zero = measure_runtime_zero(sensor=sensor, offset=offset, scale=scale)

    # 短期ノイズを抑えるために移動平均を使う
    history: deque[float] = deque(maxlen=MOVING_AVG_WINDOW)

    detector = EatingDetector(
        EatingDetectorConfig(
            start_threshold_g=START_THRESHOLD_G,
            start_confirm_seconds=START_CONFIRM_SECONDS,
            stability_epsilon_g=STABILITY_EPSILON_G,
            end_stable_seconds=END_STABLE_SECONDS,
            finalize_seconds=FINALIZE_SECONDS,
            max_session_seconds=MAX_SESSION_SECONDS,
        )
    )

    print('HisuiDish device start')
    print(
        f'offset={offset}, scale={scale}, moving_avg_window={MOVING_AVG_WINDOW}, '
        f'start_threshold={START_THRESHOLD_G}, start_confirm={START_CONFIRM_SECONDS}, '
        f'stability_epsilon={STABILITY_EPSILON_G}, '
        f'runtime_zero={runtime_zero:.2f}, raw_abs_max={RAW_ABS_MAX}, raw_jump_max={RAW_JUMP_MAX}'
    )

    prev_raw: float | None = None

    while True:
        now = time.monotonic()
        raw = read_raw_once(sensor)

        # 物理的にありえない生値はノイズとして破棄する
        if abs(raw) > RAW_ABS_MAX:
            print(f'warn=outlier_raw raw={raw:.2f} reason=abs_limit')
            time.sleep(READ_SLEEP_SEC)
            continue

        # 直前サンプルからの急激なジャンプは一時ノイズとして破棄する
        if prev_raw is not None and abs(raw - prev_raw) > RAW_JUMP_MAX:
            print(f'warn=outlier_raw raw={raw:.2f} prev_raw={prev_raw:.2f} reason=jump_limit')
            time.sleep(READ_SLEEP_SEC)
            continue

        prev_raw = raw
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)

        # 起動時に測ったゼロ点を差し引いて判定用の重さを作る
        net_grams = grams - runtime_zero
        history.append(net_grams)
        avg_grams = sum(history) / len(history)

        # 状態機械を1ステップ進める
        events = detector.step(avg_grams=avg_grams, now=now)
        for event in events:
            print(event)

        baseline = detector.baseline_grams if detector.baseline_grams is not None else 0.0

        # 常時ログ 生値と判定状態を同時に確認できるようにする
        print(
            f'state={detector.state} raw={raw:.2f} grams={grams:.2f} '
            f'net_grams={net_grams:.2f} avg_grams={avg_grams:.2f} baseline={baseline:.2f}'
        )

        time.sleep(READ_SLEEP_SEC)


if __name__ == '__main__':
    try:
        main()
    finally:
        # 終了時にGPIOを開放する
        cleanup_gpio()
