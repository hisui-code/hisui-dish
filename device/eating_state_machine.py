from dataclasses import dataclass
from enum import StrEnum


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
    stability_epsilon_g: float
    end_stable_seconds: float
    finalize_seconds: float
    max_session_seconds: float


class EatingDetector:
    """
    @description 重さの時系列から食事イベントを判定する
    """

    def __init__(self, config: EatingDetectorConfig) -> None:
        self.config = config
        self.state = EatingState.IDLE
        self.baseline_grams: float | None = None
        self.prev_avg_grams: float | None = None

        self._session_started_at = 0.0
        self._stabilized_since = 0.0
        self._start_candidate_since = 0.0
        self._meal_start_weight = 0.0
        self._meal_min_weight = 0.0

    def step(self, avg_grams: float, now: float) -> list[str]:
        """
        @description 1サンプルぶん状態を進めてイベントログを返す
        """
        events: list[str] = []

        # 初期化時は現在値を基準にして開始判定を誤作動させない
        if self.baseline_grams is None:
            self.baseline_grams = avg_grams

        if self.state == EatingState.IDLE:
            # 基準が急変しないように緩く追従させる
            self.baseline_grams = self.baseline_grams * 0.95 + avg_grams * 0.05
            drop_from_baseline = self.baseline_grams - avg_grams

            if drop_from_baseline >= self.config.start_threshold_g:
                # 開始候補の時刻を記録し、一定時間継続した時だけ開始確定する
                if self._start_candidate_since == 0.0:
                    self._start_candidate_since = now

                if now - self._start_candidate_since >= self.config.start_confirm_seconds:
                    self.state = EatingState.MEASURING
                    self._session_started_at = now
                    self._stabilized_since = now
                    self._meal_start_weight = self.baseline_grams
                    self._meal_min_weight = avg_grams
                    events.append(
                        f'event=eat_started baseline={self._meal_start_weight:.2f} '
                        f'current={avg_grams:.2f} drop={drop_from_baseline:.2f}'
                    )
                    self._start_candidate_since = 0.0
            else:
                # 条件を外れたら開始候補をリセットする
                self._start_candidate_since = 0.0

        elif self.state == EatingState.MEASURING:
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
            eaten = self._meal_start_weight - self._meal_min_weight
            events.append(
                f'event=eat_finished start={self._meal_start_weight:.2f} '
                f'min={self._meal_min_weight:.2f} eaten={eaten:.2f}'
            )
            self.baseline_grams = avg_grams
            self.state = EatingState.IDLE

        elif self.state == EatingState.ABORTED:
            events.append('event=eat_aborted reason=session_timeout')
            self.baseline_grams = avg_grams
            self.state = EatingState.IDLE

        self.prev_avg_grams = avg_grams
        return events
