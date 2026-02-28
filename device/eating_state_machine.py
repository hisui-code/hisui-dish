from collections import deque
from dataclasses import dataclass
from enum import StrEnum
from statistics import median


class EatingState(StrEnum):
    """
    @description 食事判定の状態
    """

    IDLE = 'IDLE'
    MEASURING = 'MEASURING'
    STABILIZING = 'STABILIZING'
    FINISHED = 'FINISHED'
    ABORTED = 'ABORTED'


@dataclass
class EatingDetectorConfig:
    """
    @description 食事判定の閾値設定
    """

    start_threshold_g: float
    start_confirm_seconds: float
    idle_up_spike_ignore_g: float
    stability_epsilon_g: float
    end_stable_seconds: float
    finalize_seconds: float
    max_session_seconds: float
    min_consumed_g: float


class EatingDetector:
    """
    @description 重さの時系列から食事イベントを判定する
    """

    def __init__(self, config: EatingDetectorConfig) -> None:
        self.config = config
        # 現在の判定状態
        self.state = EatingState.IDLE
        # 食事開始判定で使う待機時の基準値
        self.baseline_grams: float | None = None
        # 安定判定で使う直前サンプル
        self.prev_avg_grams: float | None = None

        # セッション内で使う時刻情報
        self._session_started_at = 0.0
        self._stabilized_since = 0.0
        self._start_candidate_since = 0.0
        # 食事量算出で使う開始重量と最小重量
        self._meal_start_weight = 0.0
        self._meal_min_weight = 0.0
        # 開始直前の安定重量を算出するため、待機中の重量を短期保持する
        self._idle_reference_samples: deque[float] = deque(maxlen=30)

    def step(self, avg_grams: float, now: float) -> list[str]:
        """
        @description 1サンプルぶん状態を進めてイベントログを返す
        """
        events: list[str] = []

        # 初期化時は現在値を基準にして開始判定を誤作動させない
        if self.baseline_grams is None:
            self.baseline_grams = avg_grams

        if self.state == EatingState.IDLE:
            # IDLEは開始候補を探す状態
            # 待機中の急増は接触ノイズとして扱いbaseline更新を抑制する
            increase_from_baseline = avg_grams - self.baseline_grams
            if increase_from_baseline <= self.config.idle_up_spike_ignore_g:
                # 基準が急変しないように緩く追従させる
                self.baseline_grams = self.baseline_grams * 0.95 + avg_grams * 0.05
                # 開始前の安定区間として開始重量候補に蓄積する
                self._idle_reference_samples.append(avg_grams)

            drop_from_baseline = self.baseline_grams - avg_grams

            if drop_from_baseline >= self.config.start_threshold_g:
                # 開始候補の時刻を記録し、一定時間継続した時だけ開始確定する
                if self._start_candidate_since == 0.0:
                    self._start_candidate_since = now

                if now - self._start_candidate_since >= self.config.start_confirm_seconds:
                    # 食事量計算の開始重量は開始直前サンプルの中央値を使う
                    if self._idle_reference_samples:
                        start_weight = float(median(self._idle_reference_samples))
                    else:
                        start_weight = self.baseline_grams

                    self.state = EatingState.MEASURING
                    self._session_started_at = now
                    self._stabilized_since = now
                    self._meal_start_weight = start_weight
                    self._meal_min_weight = avg_grams
                    events.append(
                        f'event=eat_started start={self._meal_start_weight:.2f} '
                        f'current={avg_grams:.2f} drop={drop_from_baseline:.2f}'
                    )
                    self._start_candidate_since = 0.0
            else:
                # 条件を外れたら開始候補をリセットする
                self._start_candidate_since = 0.0

        elif self.state == EatingState.MEASURING:
            # MEASURINGは最小重量を追跡して食事量算出に備える状態
            self._meal_min_weight = min(self._meal_min_weight, avg_grams)

            # 変動が小さい期間を数えて終了方向へ遷移する
            if (
                self.prev_avg_grams is not None
                and abs(avg_grams - self.prev_avg_grams) <= self.config.stability_epsilon_g
            ):
                if now - self._stabilized_since >= self.config.end_stable_seconds:
                    self.state = EatingState.STABILIZING
                    self._stabilized_since = now
                    events.append('event=eat_stabilizing')
            else:
                self._stabilized_since = now

            # 異常に長いセッションは打ち切る
            if now - self._session_started_at >= self.config.max_session_seconds:
                self.state = EatingState.ABORTED

        elif self.state == EatingState.STABILIZING:
            # STABILIZINGは終了候補の最終確認状態
            # 安定確認中に再び変動が大きくなれば計測に戻す
            if (
                self.prev_avg_grams is not None
                and abs(avg_grams - self.prev_avg_grams) > self.config.stability_epsilon_g
            ):
                self.state = EatingState.MEASURING
                self._stabilized_since = now
            elif now - self._stabilized_since >= self.config.finalize_seconds:
                self.state = EatingState.FINISHED

        if self.state == EatingState.FINISHED:
            # 食事量は開始重量と最小重量の差分で算出する
            eaten = self._meal_start_weight - self._meal_min_weight
            # 微小差分はノイズとして破棄する
            if eaten < self.config.min_consumed_g:
                events.append(
                    f'event=eat_discarded reason=below_min_consumed '
                    f'start={self._meal_start_weight:.2f} '
                    f'min={self._meal_min_weight:.2f} eaten={eaten:.2f}'
                )
            else:
                events.append(
                    f'event=eat_finished start={self._meal_start_weight:.2f} '
                    f'min={self._meal_min_weight:.2f} eaten={eaten:.2f}'
                )
            self.baseline_grams = avg_grams
            self._idle_reference_samples.clear()
            self.state = EatingState.IDLE

        elif self.state == EatingState.ABORTED:
            events.append('event=eat_aborted reason=session_timeout')
            self.baseline_grams = avg_grams
            self._idle_reference_samples.clear()
            self.state = EatingState.IDLE

        self.prev_avg_grams = avg_grams
        return events
