import time
from collections import deque

from config import (
    API_BASE_URL,
    API_TIMEOUT_SEC,
    API_TOKEN,
    CALIBRATION_FILE,
    DEVICE_EVENT_ENDPOINT,
    DEVICE_ID,
    DOUT_PIN,
    END_STABLE_SECONDS,
    FINALIZE_SECONDS,
    IDLE_UP_SPIKE_IGNORE_G,
    MAX_SESSION_SECONDS,
    MAX_RETRY_COUNT,
    MIN_CONSUMED_G,
    MOVING_AVG_WINDOW,
    PD_SCK_PIN,
    QUEUE_FLUSH_INTERVAL_SEC,
    READ_SLEEP_SEC,
    RETRY_INTERVAL_SEC,
    RUNTIME_ZERO_SECONDS,
    SESSION_QUEUE_FILE,
    START_CONFIRM_SECONDS,
    STABILITY_EPSILON_G,
    START_THRESHOLD_G,
    SESSION_EVENTS_FILE,
)
from api_sender import post_session_event
from calibration_store import load_calibration
from eating_state_machine import EatingDetector, EatingDetectorConfig
from hx711_reader import cleanup_gpio, convert_raw_to_grams, create_sensor, read_raw_once
from queue_store import enqueue_finished_event, flush_queue
from session_store import append_session_event


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
    # 校正値を読み込んで raw -> g 変換に使う
    offset, scale = load_calibration(CALIBRATION_FILE)
    # センサー初期化
    sensor = create_sensor(dout_pin=DOUT_PIN, pd_sck_pin=PD_SCK_PIN)
    # 起動時の空状態を基準にしてゼロ点ずれを吸収する
    runtime_zero = measure_runtime_zero(sensor=sensor, offset=offset, scale=scale)

    # 短期ノイズを抑えるために移動平均を使う
    history: deque[float] = deque(maxlen=MOVING_AVG_WINDOW)

    detector = EatingDetector(
        EatingDetectorConfig(
            start_threshold_g=START_THRESHOLD_G,
            start_confirm_seconds=START_CONFIRM_SECONDS,
            idle_up_spike_ignore_g=IDLE_UP_SPIKE_IGNORE_G,
            stability_epsilon_g=STABILITY_EPSILON_G,
            end_stable_seconds=END_STABLE_SECONDS,
            finalize_seconds=FINALIZE_SECONDS,
            max_session_seconds=MAX_SESSION_SECONDS,
            min_consumed_g=MIN_CONSUMED_G,
        )
    )

    print('HisuiDish device start')
    print(
        f'offset={offset}, scale={scale}, moving_avg_window={MOVING_AVG_WINDOW}, '
        f'start_threshold={START_THRESHOLD_G}, start_confirm={START_CONFIRM_SECONDS}, '
        f'idle_up_spike_ignore={IDLE_UP_SPIKE_IGNORE_G}, '
        f'stability_epsilon={STABILITY_EPSILON_G}, '
        f'min_consumed={MIN_CONSUMED_G}, '
        f'runtime_zero={runtime_zero:.2f}, retry_interval={RETRY_INTERVAL_SEC}, '
        f'max_retry_count={MAX_RETRY_COUNT}'
    )

    # 再送キューは一定間隔で処理する
    next_queue_flush_at = 0.0

    while True:
        now = time.monotonic()
        # 1サンプル読み取り
        raw = read_raw_once(sensor)
        # 校正値を使って g に変換
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)

        # 起動時に測ったゼロ点を差し引いて判定用の重さを作る
        net_grams = grams - runtime_zero
        # ノイズ低減のため移動平均で平滑化する
        history.append(net_grams)
        avg_grams = sum(history) / len(history)

        # 状態機械を1ステップ進める
        events = detector.step(avg_grams=avg_grams, now=now)
        for event in events:
            print(event)
            # 完了イベントはローカルに追記保存する
            saved_record = append_session_event(path=SESSION_EVENTS_FILE, event_line=event)
            if saved_record:
                print(f'event=local_saved path={SESSION_EVENTS_FILE.name}')
                # eat_finishedのみ送信キューへ投入する
                if enqueue_finished_event(
                    path=SESSION_QUEUE_FILE,
                    record=saved_record,
                    device_id=DEVICE_ID,
                ):
                    print(f'event=queue_enqueued path={SESSION_QUEUE_FILE.name}')

        # 送信キューを定期的にフラッシュする
        if now >= next_queue_flush_at:
            queue_stats = flush_queue(
                path=SESSION_QUEUE_FILE,
                retry_interval_sec=RETRY_INTERVAL_SEC,
                max_retry_count=MAX_RETRY_COUNT,
                sender=lambda payload: post_session_event(
                    api_base_url=API_BASE_URL,
                    endpoint_path=DEVICE_EVENT_ENDPOINT,
                    token=API_TOKEN,
                    timeout_sec=API_TIMEOUT_SEC,
                    payload=payload,
                ),
            )
            if queue_stats['sent'] or queue_stats['retried'] or queue_stats['failed']:
                print(
                    f"event=queue_flushed sent={queue_stats['sent']} "
                    f"retried={queue_stats['retried']} failed={queue_stats['failed']}"
                )
            next_queue_flush_at = now + QUEUE_FLUSH_INTERVAL_SEC

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
