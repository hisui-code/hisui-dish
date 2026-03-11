import time
from collections import deque
from dataclasses import dataclass

from config import (
    APPLIED_SETTINGS_FILE,
    API_BASE_URL,
    API_TIMEOUT_SEC,
    API_TOKEN,
    BOWL_ABSENT_CONFIRM_SECONDS,
    BOWL_ABSENT_MARGIN_G,
    BOWL_PRESENT_CONFIRM_SECONDS,
    BOWL_PRESENT_MARGIN_G,
    BOWL_SNAPSHOTS_QUEUE_FILE,
    BOWL_SNAPSHOT_INTERVAL_SEC,
    BOWL_SNAPSHOT_MIN_DELTA_G,
    CALIBRATION_FILE,
    DEFAULT_TARE_WEIGHT_G,
    DEVICE_BOWL_SNAPSHOT_ENDPOINT,
    DEVICE_EVENT_ENDPOINT,
    DEVICE_SETTINGS_ENDPOINT,
    DEVICE_SETTINGS_VERSION_ENDPOINT,
    DEVICE_ID,
    DOUT_PIN,
    END_STABLE_SECONDS,
    FINALIZE_SECONDS,
    GROSS_WEIGHT_LIMIT_G,
    IDLE_UP_SPIKE_IGNORE_G,
    JUMP_ACCEPT_SECONDS,
    MAX_SESSION_SECONDS,
    MAX_VALID_GRAMS_MARGIN,
    MAX_VALID_NET_JUMP_G,
    MAX_RETRY_COUNT,
    MIN_CONSUMED_G,
    MIN_VALID_GRAMS,
    MOVING_AVG_WINDOW,
    PD_SCK_PIN,
    QUEUE_FLUSH_INTERVAL_SEC,
    READ_SLEEP_SEC,
    RETRY_INTERVAL_SEC,
    RUNTIME_ZERO_SECONDS,
    SETTINGS_SYNC_INTERVAL_SEC,
    START_COOLDOWN_AFTER_JUMP_SECONDS,
    SESSION_QUEUE_FILE,
    START_CONFIRM_SECONDS,
    STABILITY_EPSILON_G,
    START_THRESHOLD_G,
    SESSION_EVENTS_FILE,
)
from api_sender import post_bowl_snapshot, post_session_event
from calibration_store import load_calibration
from device_settings_client import fetch_settings, fetch_version
from device_settings_store import load_applied_lock_version, load_applied_state, save_applied_state
from eating_state_machine import EatingDetector, EatingDetectorConfig, EatingState
from hx711_reader import cleanup_gpio, convert_raw_to_grams, create_sensor, read_raw_once
from queue_store import enqueue_bowl_snapshot, enqueue_finished_event, flush_queue
from session_store import append_session_event


@dataclass
class RuntimeSettings:
    """
    @description DeviceSettings同期結果を実行時に使う形へ変換した設定
    """

    detector_config: EatingDetectorConfig
    moving_avg_window: int
    gross_weight_limit_g: float
    tare_weight_g: float
    lock_version: int


def measure_runtime_zero(sensor, offset: float, scale: float) -> float:
    """
    @description 起動時の空状態を計測してランタイムゼロ点を算出する
    """
    end_at = time.monotonic() + RUNTIME_ZERO_SECONDS
    samples: list[float] = []

    # 数秒だけ連続サンプリングして平均値をゼロ基準にする
    # 単発値を使うとノイズで基準がズレやすいため平均を使う
    while time.monotonic() < end_at:
        raw = read_raw_once(sensor)
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)
        samples.append(grams)
        time.sleep(READ_SLEEP_SEC)

    if not samples:
        raise RuntimeError('ランタイムゼロ点の計測に失敗')

    return sum(samples) / len(samples)


def _build_default_runtime_settings() -> RuntimeSettings:
    """
    @description ローカル定数から実行時設定を作る
    """
    # DeviceSettingsが取れないときでも動かすための安全な既定値
    return RuntimeSettings(
        detector_config=EatingDetectorConfig(
            start_threshold_g=START_THRESHOLD_G,
            start_confirm_seconds=START_CONFIRM_SECONDS,
            idle_up_spike_ignore_g=IDLE_UP_SPIKE_IGNORE_G,
            stability_epsilon_g=STABILITY_EPSILON_G,
            end_stable_seconds=END_STABLE_SECONDS,
            finalize_seconds=FINALIZE_SECONDS,
            max_session_seconds=MAX_SESSION_SECONDS,
            min_consumed_g=MIN_CONSUMED_G,
        ),
        moving_avg_window=max(1, MOVING_AVG_WINDOW),
        gross_weight_limit_g=GROSS_WEIGHT_LIMIT_G,
        tare_weight_g=DEFAULT_TARE_WEIGHT_G,
        lock_version=-1,
    )


def _build_runtime_settings_from_payload(payload: dict) -> RuntimeSettings:
    """
    @description DeviceSettings payloadを状態機械向け設定へ変換する
    """
    # start_threshold/start_confirmは今のAPIに無いのでローカル値を使う
    # それ以外はWeb設定値を優先して反映する
    return RuntimeSettings(
        detector_config=EatingDetectorConfig(
            start_threshold_g=START_THRESHOLD_G,
            start_confirm_seconds=START_CONFIRM_SECONDS,
            idle_up_spike_ignore_g=IDLE_UP_SPIKE_IGNORE_G,
            stability_epsilon_g=float(payload['stability_epsilon_g']),
            end_stable_seconds=float(payload['stable_duration_sec']),
            finalize_seconds=FINALIZE_SECONDS,
            max_session_seconds=float(payload['max_session_sec']),
            min_consumed_g=MIN_CONSUMED_G,
        ),
        moving_avg_window=max(1, int(payload['moving_avg_window'])),
        gross_weight_limit_g=float(payload['gross_weight_limit_g']),
        tare_weight_g=float(payload['tare_weight']),
        lock_version=int(payload['lock_version']),
    )


def _to_food_weight_g(*, gross_grams: float, tare_weight_g: float, gross_limit_g: float) -> float | None:
    """
    @description 総重量からfood重量を計算する
    異常値はNoneで返して送信しない
    """
    # 皿持ち上げなどで総重量が跳ねるケースは誤送信を避けるため除外
    if gross_grams > gross_limit_g:
        return None

    # food重量 = 総重量 - 皿重量
    # 例  総重量 430g  皿 400g なら food 30g
    food_weight = gross_grams - tare_weight_g
    if food_weight < 0:
        # マイナス値は0へ丸める
        return 0.0

    return food_weight


def _build_bowl_thresholds(*, tare_weight_g: float) -> tuple[float, float]:
    """
    @description tare_weight を基準に皿あり / 皿なし判定の実効閾値を作る
    """
    # 固定値ではなく tare_weight からの相対値で判定する
    # 空皿の個体差があっても present / absent を調整しやすくする
    bowl_present_threshold_g = tare_weight_g + BOWL_PRESENT_MARGIN_G
    bowl_absent_threshold_g = tare_weight_g + BOWL_ABSENT_MARGIN_G

    # absent の方が高いと present / absent が逆転するので補正する
    if bowl_absent_threshold_g >= bowl_present_threshold_g:
        bowl_absent_threshold_g = bowl_present_threshold_g - 1.0

    return bowl_present_threshold_g, bowl_absent_threshold_g


def _resolve_initial_runtime_settings() -> RuntimeSettings:
    """
    @description 起動時にDeviceSettingsを取得し未取得時はローカル既定値へフォールバックする
    """
    default_settings = _build_default_runtime_settings()
    if not DEVICE_ID:
        print('event=settings_update_failed reason=missing_device_id')
        return default_settings

    # 前回適用済み設定を読み込む
    # APIに届かないときのフォールバックとして使う
    applied_state = load_applied_state(APPLIED_SETTINGS_FILE)
    applied_lock_version = load_applied_lock_version(APPLIED_SETTINGS_FILE)
    cached_settings = applied_state.get('settings') if isinstance(applied_state, dict) else None

    # まず軽いversion APIで更新有無を確認
    ok, version_payload, reason = fetch_version(
        api_base_url=API_BASE_URL,
        endpoint_template=DEVICE_SETTINGS_VERSION_ENDPOINT,
        device_id=DEVICE_ID,
        token=API_TOKEN,
        timeout_sec=API_TIMEOUT_SEC,
    )
    if not ok:
        print(f'event=settings_update_failed reason=version_fetch_{reason}')
        if isinstance(cached_settings, dict):
            try:
                return _build_runtime_settings_from_payload(cached_settings)
            except (KeyError, TypeError, ValueError):
                print('event=settings_update_failed reason=invalid_cached_settings')
        return default_settings

    remote_lock_version = int(version_payload['lock_version'])
    print(f'event=settings_version_checked remote={remote_lock_version} applied={applied_lock_version}')

    # 前回設定が最新ならAPI本体を取りに行かずそのまま使う
    if isinstance(cached_settings, dict) and remote_lock_version == applied_lock_version:
        try:
            return _build_runtime_settings_from_payload(cached_settings)
        except (KeyError, TypeError, ValueError):
            print('event=settings_update_failed reason=invalid_cached_settings')

    # 更新があるときだけ設定本体を取得して通信量を抑える
    ok, settings_payload, reason = fetch_settings(
        api_base_url=API_BASE_URL,
        endpoint_template=DEVICE_SETTINGS_ENDPOINT,
        device_id=DEVICE_ID,
        token=API_TOKEN,
        timeout_sec=API_TIMEOUT_SEC,
    )
    if not ok:
        print(f'event=settings_update_failed reason=settings_fetch_{reason}')
        if isinstance(cached_settings, dict):
            try:
                return _build_runtime_settings_from_payload(cached_settings)
            except (KeyError, TypeError, ValueError):
                print('event=settings_update_failed reason=invalid_cached_settings')
        return default_settings

    runtime_settings = _build_runtime_settings_from_payload(settings_payload)
    save_applied_state(
        path=APPLIED_SETTINGS_FILE,
        lock_version=runtime_settings.lock_version,
        settings=settings_payload,
    )
    print(f'event=settings_updated lock_version={runtime_settings.lock_version}')
    return runtime_settings


def _sync_runtime_settings(current_lock_version: int) -> RuntimeSettings | None:
    """
    @description ループ中にDeviceSettingsの更新有無を確認して差分があれば返す
    """
    if not DEVICE_ID:
        return None

    # 常時起動中もまずversionだけ確認
    ok, version_payload, reason = fetch_version(
        api_base_url=API_BASE_URL,
        endpoint_template=DEVICE_SETTINGS_VERSION_ENDPOINT,
        device_id=DEVICE_ID,
        token=API_TOKEN,
        timeout_sec=API_TIMEOUT_SEC,
    )
    if not ok:
        print(f'event=settings_update_failed reason=version_fetch_{reason}')
        return None

    remote_lock_version = int(version_payload['lock_version'])
    print(f'event=settings_version_checked remote={remote_lock_version} applied={current_lock_version}')
    if remote_lock_version <= current_lock_version:
        # 変更なしなら何もしない
        return None

    # versionが増えたときだけ設定本体を取得して反映
    # 常時起動中でも再起動なしで設定を切り替える
    ok, settings_payload, reason = fetch_settings(
        api_base_url=API_BASE_URL,
        endpoint_template=DEVICE_SETTINGS_ENDPOINT,
        device_id=DEVICE_ID,
        token=API_TOKEN,
        timeout_sec=API_TIMEOUT_SEC,
    )
    if not ok:
        print(f'event=settings_update_failed reason=settings_fetch_{reason}')
        return None

    runtime_settings = _build_runtime_settings_from_payload(settings_payload)
    save_applied_state(
        path=APPLIED_SETTINGS_FILE,
        lock_version=runtime_settings.lock_version,
        settings=settings_payload,
    )
    print(f'event=settings_updated lock_version={runtime_settings.lock_version}')
    return runtime_settings


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

    # 起動時に使う設定を確定
    # Web設定が取れればそれを使い、取れなければ既定値を使う
    runtime_settings = _resolve_initial_runtime_settings()

    # 短期ノイズを抑えるために移動平均を使う
    # 直近N点の平均で判定すると誤検知が減る
    history: deque[float] = deque(maxlen=runtime_settings.moving_avg_window)

    # 状態機械を設定値で初期化
    detector = EatingDetector(runtime_settings.detector_config)

    print('HisuiDish device start')
    print(
        f'offset={offset}, scale={scale}, moving_avg_window={runtime_settings.moving_avg_window}, '
        f'start_threshold={runtime_settings.detector_config.start_threshold_g}, '
        f'start_confirm={runtime_settings.detector_config.start_confirm_seconds}, '
        f'idle_up_spike_ignore={IDLE_UP_SPIKE_IGNORE_G}, '
        f'stability_epsilon={runtime_settings.detector_config.stability_epsilon_g}, '
        f'min_consumed={runtime_settings.detector_config.min_consumed_g}, '
        f'end_stable={runtime_settings.detector_config.end_stable_seconds}, '
        f'max_session={runtime_settings.detector_config.max_session_seconds}, '
        f'gross_weight_limit={runtime_settings.gross_weight_limit_g}, '
        f'tare_weight={runtime_settings.tare_weight_g}, '
        f'bowl_present_margin={BOWL_PRESENT_MARGIN_G}, '
        f'bowl_absent_margin={BOWL_ABSENT_MARGIN_G}, '
        f'lock_version={runtime_settings.lock_version}, '
        f'runtime_zero={runtime_zero:.2f}, retry_interval={RETRY_INTERVAL_SEC}, '
        f'max_retry_count={MAX_RETRY_COUNT}'
    )

    # 再送キューは一定間隔で処理する
    next_queue_flush_at = 0.0
    # 常時起動中も設定更新を確認
    next_settings_sync_at = 0.0
    # bowl_snapshotの定期送信タイミング
    next_bowl_snapshot_at = 0.0
    # 直近送信したfood重量
    last_snapshot_weight_g: float | None = None
    # 直前の有効サンプル（異常値除外後）を保持する
    last_valid_net_grams: float | None = None
    # 皿の有無を前段で判定し、食事状態機械は皿あり時だけ動かす
    # 皿なし状態では食事開始や終了を判定しない
    bowl_present = False
    # 皿あり候補が始まった時刻
    bowl_present_since = 0.0
    # 皿なし候補が始まった時刻
    bowl_absent_since = 0.0
    # 大きな変化をすぐ異常値と決めつけず、一時保留して様子を見る
    # 猫の顔や手が一瞬乗ったあと元へ戻ることがあるため、継続した変化だけ採用する
    pending_jump_started_at = 0.0
    # jump 保留開始時の直前有効値
    pending_jump_origin_net_grams: float | None = None
    # 保留中 jump の方向 1 は上方向、-1 は下方向
    pending_jump_direction = 0

    while True:
        now = time.monotonic()

        # 設定更新を確認し、変化があればすぐ反映
        # ロジックを止めずに次ループから新設定で動かす
        if now >= next_settings_sync_at:
            updated_settings = _sync_runtime_settings(runtime_settings.lock_version)
            if updated_settings is not None:
                # 実行中でも再起動せず設定を反映
                runtime_settings = updated_settings
                detector.config = runtime_settings.detector_config
                # moving_avg_window変更時は履歴バッファを作り直す
                # 古い窓サイズのままだと平均値が意図通りにならない
                history = deque(history, maxlen=runtime_settings.moving_avg_window)
            next_settings_sync_at = now + SETTINGS_SYNC_INTERVAL_SEC

        # 1サンプル読み取り
        # rawはセンサー生値
        raw = read_raw_once(sensor)
        # 校正値を使って g に変換
        grams = convert_raw_to_grams(raw=raw, offset=offset, scale=scale)

        # 起動時に測ったゼロ点を差し引いて判定用の重さを作る
        # 器の個体差や設置ズレの影響をここで吸収する
        net_grams = grams - runtime_zero
        bowl_present_threshold_g, bowl_absent_threshold_g = _build_bowl_thresholds(
            tare_weight_g=runtime_settings.tare_weight_g
        )

        # 異常に小さい重量はグリッチとして捨てる
        if grams < MIN_VALID_GRAMS:
            print(
                f'event=sample_ignored reason=below_min raw={raw:.2f} '
                f'grams={grams:.2f} min_valid={MIN_VALID_GRAMS:.2f}'
            )
            time.sleep(READ_SLEEP_SEC)
            continue

        # 異常に大きい重量はグリッチとして捨てる
        max_valid_grams = runtime_settings.gross_weight_limit_g + MAX_VALID_GRAMS_MARGIN
        if grams > max_valid_grams:
            print(
                f'event=sample_ignored reason=above_max raw={raw:.2f} '
                f'grams={grams:.2f} max_valid={max_valid_grams:.2f}'
            )
            time.sleep(READ_SLEEP_SEC)
            continue

        # 皿なし状態では食事判定を動かさない
        # 皿を置いたことが一定時間続いた時だけIDLEへ入る
        if not bowl_present:
            # 皿の有無はランタイムゼロ補正後ではなく総重量で判定する
            # 皿を載せたまま起動すると net_grams は 0 付近になるため
            if grams >= bowl_present_threshold_g:
                if bowl_present_since == 0.0:
                    # しきい値を超えた瞬間を記録して継続判定を始める
                    bowl_present_since = now
                elif now - bowl_present_since >= BOWL_PRESENT_CONFIRM_SECONDS:
                    # 一定時間皿あり重量が続いたので、ここから食事判定を有効化する
                    bowl_present = True
                    bowl_present_since = 0.0
                    bowl_absent_since = 0.0
                    # 皿ありへ切り替わるときは古い履歴を捨てて、その時点の値を新しい基準にする
                    history.clear()
                    history.append(net_grams)
                    last_valid_net_grams = net_grams
                    pending_jump_started_at = 0.0
                    pending_jump_origin_net_grams = None
                    pending_jump_direction = 0
                    detector.state = EatingState.IDLE
                    detector.tracking_baseline_grams = net_grams
                    detector.prev_avg_grams = net_grams
                    last_snapshot_weight_g = None
                    print(
                        f'event=bowl_present grams={grams:.2f} net_grams={net_grams:.2f} '
                        f'threshold={bowl_present_threshold_g:.2f} '
                        f'confirm_seconds={BOWL_PRESENT_CONFIRM_SECONDS:.2f}'
                    )
            else:
                # 途中でしきい値を下回ったら present 候補をやり直す
                bowl_present_since = 0.0

            # 皿なし中は食事状態機械を進めず、総重量の監視だけを行う
            print(
                f'state=NO_BOWL raw={raw:.2f} grams={grams:.2f} '
                f'net_grams={net_grams:.2f} baseline=NA'
            )
            time.sleep(READ_SLEEP_SEC)
            continue

        # 皿あり状態でも、取り外されたことが一定時間続けば皿なしへ戻す
        if grams <= bowl_absent_threshold_g:
            if bowl_absent_since == 0.0:
                # 皿なし候補が始まった時刻を記録する
                bowl_absent_since = now
            elif now - bowl_absent_since >= BOWL_ABSENT_CONFIRM_SECONDS:
                # 一定時間皿なし重量が続いたので、食事判定を停止して基準を捨てる
                bowl_present = False
                bowl_present_since = 0.0
                bowl_absent_since = 0.0
                history.clear()
                last_valid_net_grams = None
                last_snapshot_weight_g = None
                pending_jump_started_at = 0.0
                pending_jump_origin_net_grams = None
                pending_jump_direction = 0
                # 次回の皿あり遷移まで待機追従基準を持たない
                detector.state = EatingState.IDLE
                detector.tracking_baseline_grams = None
                detector.prev_avg_grams = None
                print(
                    f'event=bowl_absent grams={grams:.2f} net_grams={net_grams:.2f} '
                    f'threshold={bowl_absent_threshold_g:.2f} '
                    f'confirm_seconds={BOWL_ABSENT_CONFIRM_SECONDS:.2f}'
                )
                print(
                    f'state=NO_BOWL raw={raw:.2f} grams={grams:.2f} '
                    f'net_grams={net_grams:.2f} baseline=NA'
                )
                time.sleep(READ_SLEEP_SEC)
                continue
        else:
            # 皿あり重量へ戻ったら absent 候補を解除する
            bowl_absent_since = 0.0

        # 直前有効値から急変しすぎるサンプルは捨てる
        if (
            last_valid_net_grams is not None
            and abs(net_grams - last_valid_net_grams) > MAX_VALID_NET_JUMP_G
        ):
            jump_delta = net_grams - last_valid_net_grams
            jump_direction = 1 if jump_delta > 0 else -1

            # 一瞬の接触ノイズか、本当に新しい重量帯へ移ったのかを見分ける
            # 同じ方向の変化が続いた時だけ新しい値として採用する
            if (
                pending_jump_origin_net_grams is None
                or pending_jump_direction != jump_direction
            ):
                pending_jump_started_at = now
                pending_jump_origin_net_grams = last_valid_net_grams
                pending_jump_direction = jump_direction
            elif now - pending_jump_started_at >= JUMP_ACCEPT_SECONDS:
                prev_net_grams = last_valid_net_grams
                last_valid_net_grams = net_grams
                # 古い平均窓を捨てて、新しい重量帯に履歴を合わせる
                history.clear()
                history.append(net_grams)
                # IDLEでは待機追従基準も更新する
                if detector.state == EatingState.IDLE:
                    detector.tracking_baseline_grams = net_grams
                    # 上方向jump直後は開始判定だけを止め、直前の安定参照は残す
                    # 接触スパイクが戻った時に高い帯を開始重量として固定しないため
                    detector.start_detection_cooldown(
                        now=now,
                        seconds=START_COOLDOWN_AFTER_JUMP_SECONDS,
                        clear_samples=jump_direction < 0,
                    )
                # 直後の平均との差分が暴れないように前回平均は揃える
                detector.prev_avg_grams = net_grams
                pending_jump_started_at = 0.0
                pending_jump_origin_net_grams = None
                pending_jump_direction = 0
                print(
                    f'event=sample_jump_accepted net_grams={net_grams:.2f} '
                    f'prev={prev_net_grams:.2f} direction={"up" if jump_direction > 0 else "down"} '
                    f'accept_seconds={JUMP_ACCEPT_SECONDS:.2f}'
                )
                time.sleep(READ_SLEEP_SEC)
                continue

            print(
                f'event=sample_ignored reason=jump raw={raw:.2f} '
                f'net_grams={net_grams:.2f} prev={last_valid_net_grams:.2f} '
                f'max_jump={MAX_VALID_NET_JUMP_G:.2f}'
            )
            time.sleep(READ_SLEEP_SEC)
            continue

        # ここまで通過した値だけ有効サンプルとして保持する
        # 有効サンプルが来たので jump 保留は解除する
        recovered_from_pending_jump = pending_jump_origin_net_grams is not None
        pending_jump_started_at = 0.0
        pending_jump_origin_net_grams = None
        pending_jump_direction = 0
        last_valid_net_grams = net_grams

        # ノイズ低減のため移動平均で平滑化する
        history.append(net_grams)
        avg_grams = sum(history) / len(history)

        # 状態機械を1ステップ進める
        # 返ってくるeventsには eat_started/eat_finished などが入る
        if recovered_from_pending_jump and detector.state == EatingState.IDLE:
            # 接触スパイク後に元の重量帯へ戻った場合は、直前の安定参照を残したまま再開する
            # 元の帯に戻った差分まで食事量に含めないため
            detector.start_detection_cooldown(
                now=now,
                seconds=START_COOLDOWN_AFTER_JUMP_SECONDS,
                clear_samples=False,
            )
        events = detector.step(avg_grams=avg_grams, now=now)
        for event in events:
            print(event)
            # 完了イベントはローカルに追記保存する
            saved_record = append_session_event(path=SESSION_EVENTS_FILE, event_line=event)
            if saved_record:
                print(f'event=local_saved path={SESSION_EVENTS_FILE.name}')
                # eat_finishedのみセッションイベント送信キューへ投入する
                # eat_startedなど途中イベントは送らない
                if enqueue_finished_event(
                    path=SESSION_QUEUE_FILE,
                    record=saved_record,
                    device_id=DEVICE_ID,
                ):
                    print(f'event=queue_enqueued path={SESSION_QUEUE_FILE.name}')

                # 食事終了時は現在のfood重量を即時でキューに積む
                # 終了直後の残量を確実に残すため
                if saved_record.get('event') == 'eat_finished':
                    gross_for_snapshot = avg_grams + runtime_zero
                    food_weight = _to_food_weight_g(
                        gross_grams=gross_for_snapshot,
                        tare_weight_g=runtime_settings.tare_weight_g,
                        gross_limit_g=runtime_settings.gross_weight_limit_g,
                    )
                    if food_weight is not None:
                        # 直近値との差が小さい場合は同じ値の連投を避ける
                        should_send = (
                            last_snapshot_weight_g is None
                            or abs(food_weight - last_snapshot_weight_g) >= BOWL_SNAPSHOT_MIN_DELTA_G
                        )
                        if should_send and enqueue_bowl_snapshot(
                            path=BOWL_SNAPSHOTS_QUEUE_FILE,
                            device_id=DEVICE_ID,
                            weight_g=food_weight,
                            recorded_at=saved_record.get('recorded_at'),
                        ):
                            last_snapshot_weight_g = food_weight
                            print(f'event=bowl_snapshot_enqueued path={BOWL_SNAPSHOTS_QUEUE_FILE.name}')

        # IDLE中のみ5分ごとに現在のfood重量を送信キューへ積む
        # ごはん追加だけが起きた場合も残量を更新できる
        if detector.state == 'IDLE' and now >= next_bowl_snapshot_at:
            gross_for_snapshot = avg_grams + runtime_zero
            food_weight = _to_food_weight_g(
                gross_grams=gross_for_snapshot,
                tare_weight_g=runtime_settings.tare_weight_g,
                gross_limit_g=runtime_settings.gross_weight_limit_g,
            )
            if food_weight is not None:
                # 変化が小さい場合は送信を省略してノイズ投稿を抑える
                should_send = (
                    last_snapshot_weight_g is None
                    or abs(food_weight - last_snapshot_weight_g) >= BOWL_SNAPSHOT_MIN_DELTA_G
                )
                if should_send and enqueue_bowl_snapshot(
                    path=BOWL_SNAPSHOTS_QUEUE_FILE,
                    device_id=DEVICE_ID,
                    weight_g=food_weight,
                ):
                    last_snapshot_weight_g = food_weight
                    print(f'event=bowl_snapshot_enqueued path={BOWL_SNAPSHOTS_QUEUE_FILE.name}')
            next_bowl_snapshot_at = now + BOWL_SNAPSHOT_INTERVAL_SEC

        # 送信キューを定期的にフラッシュする
        # session_eventsとbowl_snapshotsを別キューで処理する
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
            bowl_queue_stats = flush_queue(
                path=BOWL_SNAPSHOTS_QUEUE_FILE,
                retry_interval_sec=RETRY_INTERVAL_SEC,
                max_retry_count=MAX_RETRY_COUNT,
                sender=lambda payload: post_bowl_snapshot(
                    api_base_url=API_BASE_URL,
                    endpoint_path=DEVICE_BOWL_SNAPSHOT_ENDPOINT,
                    token=API_TOKEN,
                    timeout_sec=API_TIMEOUT_SEC,
                    payload=payload,
                ),
            )
            if bowl_queue_stats['sent'] or bowl_queue_stats['retried'] or bowl_queue_stats['failed']:
                print(
                    f"event=bowl_queue_flushed sent={bowl_queue_stats['sent']} "
                    f"retried={bowl_queue_stats['retried']} failed={bowl_queue_stats['failed']}"
                )
            next_queue_flush_at = now + QUEUE_FLUSH_INTERVAL_SEC

        baseline = (
            detector.tracking_baseline_grams
            if detector.tracking_baseline_grams is not None
            else 0.0
        )

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
