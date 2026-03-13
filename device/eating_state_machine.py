from collections import deque
from dataclasses import dataclass
from enum import Enum
from statistics import median

try:
    from enum import StrEnum
except ImportError:
    class StrEnum(str, Enum):
        """
        @description Python 3.10 以前向けの簡易 StrEnum 互換
        """


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
    idle_reference_up_update_threshold_g: float
    idle_reference_up_update_seconds: float
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
        # 待機中の重さの中心をゆっくり追う基準値
        self.tracking_baseline_grams: float | None = None
        # 安定判定で使う直前サンプル
        self.prev_avg_grams: float | None = None

        # セッション内で使う時刻情報
        self._session_started_at = 0.0
        self._stabilized_since = 0.0
        self._start_candidate_since = 0.0
        # IDLE中の上方向スパイク継続を判定する時刻
        self._up_spike_since = 0.0
        # 大きな接触スパイク直後の開始判定保留期限
        self._start_cooldown_until = 0.0
        # 開始候補に入った時点で固定する開始直前の基準値
        self._start_reference_grams: float | None = None
        # 開始直前の安定重量を算出するため、待機中の重量を短期保持する
        self._start_reference_samples: deque[float] = deque(maxlen=30)
        # 食事量算出で使う IDLE 最後の安定総重量
        self.idle_reference_gross_grams: float | None = None
        # IDLE 安定値を更新するための短期窓
        self._idle_stable_gross_samples: deque[float] = deque(maxlen=10)
        # 大きな上方向増加を idle_ref へ昇格させる前の保留窓
        self._idle_ref_up_candidate_since = 0.0
        self._idle_ref_up_samples: deque[float] = deque(maxlen=30)
        # 食事量算出で使う開始時の IDLE 安定総重量
        self._meal_idle_start_weight = 0.0
        # 終了時の安定総重量を作るための短期窓
        self._finish_stable_gross_samples: deque[float] = deque(maxlen=30)
        # 中断理由
        self._abort_reason = 'session_timeout'

    def reset_start_reference(self, *, clear_samples: bool = True) -> None:
        """
        @description 待機中の開始重量候補を捨てて作り直す
        """
        if clear_samples:
            self._start_reference_samples.clear()
        self._start_candidate_since = 0.0
        self._start_reference_grams = None
        self._up_spike_since = 0.0

    def clear_idle_reference(self) -> None:
        """
        @description 食事量算出用の IDLE 安定参照を破棄する
        """
        self.idle_reference_gross_grams = None
        self._idle_stable_gross_samples.clear()
        self._idle_ref_up_candidate_since = 0.0
        self._idle_ref_up_samples.clear()

    def seed_idle_reference(self, *, gross_grams: float) -> None:
        """
        @description 現在値を食事量算出用の IDLE 安定参照として初期化する
        """
        self.idle_reference_gross_grams = gross_grams
        self._idle_stable_gross_samples.clear()
        self._idle_stable_gross_samples.append(gross_grams)
        self._idle_ref_up_candidate_since = 0.0
        self._idle_ref_up_samples.clear()

    def start_detection_cooldown(
        self,
        *,
        now: float,
        seconds: float,
        clear_samples: bool = True,
    ) -> None:
        """
        @description 接触スパイク直後は開始判定を一時停止する
        """
        self.reset_start_reference(clear_samples=clear_samples)
        self._start_cooldown_until = now + seconds

    def _refresh_idle_reference(self, *, avg_grams: float, gross_avg_grams: float, now: float) -> None:
        """
        @description 安定している IDLE の総重量を食事量算出用参照へ反映する
        """
        # 開始判定中やクールダウン中は食事量基準を動かさない
        if now < self._start_cooldown_until or self._start_candidate_since != 0.0:
            self._idle_stable_gross_samples.clear()
            self._idle_ref_up_candidate_since = 0.0
            self._idle_ref_up_samples.clear()
            return

        # 直前との差が小さい時だけ IDLE 安定値として採用する
        if (
            self.prev_avg_grams is None
            or abs(avg_grams - self.prev_avg_grams) > self.config.stability_epsilon_g
        ):
            self._idle_stable_gross_samples.clear()
            self._idle_ref_up_candidate_since = 0.0
            self._idle_ref_up_samples.clear()
            return

        if self.idle_reference_gross_grams is None:
            self._idle_stable_gross_samples.append(gross_avg_grams)
            self.idle_reference_gross_grams = float(median(self._idle_stable_gross_samples))
            return

        increase_from_idle_reference = gross_avg_grams - self.idle_reference_gross_grams
        if increase_from_idle_reference >= self.config.idle_reference_up_update_threshold_g:
            # 大きな上方向増加は補充候補として保留し、短い接触荷重では採用しない
            if self._idle_ref_up_candidate_since == 0.0:
                self._idle_ref_up_candidate_since = now
                self._idle_ref_up_samples.clear()

            self._idle_ref_up_samples.append(gross_avg_grams)
            if (
                now - self._idle_ref_up_candidate_since
                >= self.config.idle_reference_up_update_seconds
            ):
                self.idle_reference_gross_grams = float(median(self._idle_ref_up_samples))
                self._idle_stable_gross_samples.clear()
                self._idle_stable_gross_samples.append(self.idle_reference_gross_grams)
                self._idle_ref_up_candidate_since = 0.0
                self._idle_ref_up_samples.clear()
            return

        self._idle_ref_up_candidate_since = 0.0
        self._idle_ref_up_samples.clear()
        self._idle_stable_gross_samples.append(gross_avg_grams)
        self.idle_reference_gross_grams = float(median(self._idle_stable_gross_samples))

    def _finalize_meal(self, *, avg_grams: float, gross_avg_grams: float) -> list[str]:
        """
        @description 終了後安定値から食事量を確定し、待機状態へ戻す
        """
        finish_weight = (
            float(median(self._finish_stable_gross_samples))
            if self._finish_stable_gross_samples
            else gross_avg_grams
        )
        idle_last_weight = self._meal_idle_start_weight
        eaten = idle_last_weight - finish_weight

        # 終了時の安定重量を次の IDLE 参照へ引き継ぐ
        self.seed_idle_reference(gross_grams=finish_weight)
        self._finish_stable_gross_samples.clear()
        self.tracking_baseline_grams = avg_grams
        self.reset_start_reference()
        self.state = EatingState.IDLE

        if eaten < 0:
            return [
                f'event=eat_discarded reason=finish_heavier_than_idle '
                f'idle_last={idle_last_weight:.2f} finish={finish_weight:.2f} '
                f'eaten={eaten:.2f}'
            ]

        if eaten < self.config.min_consumed_g:
            return [
                f'event=eat_discarded reason=below_min_consumed '
                f'idle_last={idle_last_weight:.2f} finish={finish_weight:.2f} '
                f'eaten={eaten:.2f}'
            ]

        return [
            f'event=eat_finished idle_last={idle_last_weight:.2f} '
            f'finish={finish_weight:.2f} eaten={eaten:.2f}'
        ]

    def abort_current_session(self, *, reason: str) -> list[str]:
        """
        @description 進行中セッションを理由付きで中断して待機状態へ戻す
        """
        if self.state == EatingState.IDLE:
            return []

        self._abort_reason = reason
        self.tracking_baseline_grams = None
        self.reset_start_reference()
        self.clear_idle_reference()
        self._finish_stable_gross_samples.clear()
        self.state = EatingState.IDLE
        return [f'event=eat_aborted reason={reason}']

    def step(self, *, avg_grams: float, gross_avg_grams: float, now: float) -> list[str]:
        """
        @description 1サンプルぶん状態を進めてイベントログを返す
        """
        events: list[str] = []

        # 初期化時は現在値を基準にして開始判定を誤作動させない
        if self.tracking_baseline_grams is None:
            self.tracking_baseline_grams = avg_grams

        if self.state == EatingState.IDLE:
            # IDLEは開始候補を探す状態
            # 待機中の急増は接触ノイズとして扱い待機追従基準の更新を抑制する
            increase_from_baseline = avg_grams - self.tracking_baseline_grams
            if increase_from_baseline <= self.config.idle_up_spike_ignore_g:
                # 基準が急変しないように緩く追従させる
                self.tracking_baseline_grams = (
                    self.tracking_baseline_grams * 0.95 + avg_grams * 0.05
                )
                # 開始前の安定区間として開始重量候補に蓄積する
                self._start_reference_samples.append(avg_grams)
                # 上方向スパイク判定は解除する
                self._up_spike_since = 0.0
            else:
                # 大きな上昇が一定時間続いたら補充とみなし待機追従基準を再設定する
                # 食後baselineを引き継いだまま補充すると次回開始判定が不安定になるため
                if self._up_spike_since == 0.0:
                    self._up_spike_since = now
                elif now - self._up_spike_since >= 2.0:
                    self.tracking_baseline_grams = avg_grams
                    self.reset_start_reference()
                    self._start_reference_samples.append(avg_grams)
                    self._up_spike_since = 0.0

            drop_from_baseline = self.tracking_baseline_grams - avg_grams

            # 接触スパイク直後は開始重量候補を作り直す時間を優先する
            if now < self._start_cooldown_until:
                self._start_candidate_since = 0.0
                self._start_reference_grams = None
                self._idle_stable_gross_samples.clear()
                self.prev_avg_grams = avg_grams
                return events

            if drop_from_baseline >= self.config.start_threshold_g:
                # 開始候補の時刻を記録し、一定時間継続した時だけ開始確定する
                if self._start_candidate_since == 0.0:
                    self._start_candidate_since = now
                    # 開始候補に入った時点で、開始直前の安定した重さを固定する
                    if self._start_reference_samples:
                        self._start_reference_grams = float(median(self._start_reference_samples))
                    else:
                        self._start_reference_grams = self.tracking_baseline_grams

                start_weight = self._start_reference_grams
                if start_weight is None:
                    start_weight = self.tracking_baseline_grams
                drop_from_start_reference = start_weight - avg_grams

                if (
                    now - self._start_candidate_since >= self.config.start_confirm_seconds
                    and drop_from_start_reference >= self.config.start_threshold_g
                ):
                    if self.idle_reference_gross_grams is None:
                        self.state = EatingState.ABORTED
                        self._abort_reason = 'missing_idle_reference'
                    else:
                        # 食事量計算の開始重量は IDLE 最後の安定総重量を使う
                        self._start_reference_samples.clear()
                        self._idle_stable_gross_samples.clear()
                        self._finish_stable_gross_samples.clear()
                        self.state = EatingState.MEASURING
                        self._session_started_at = now
                        self._stabilized_since = now
                        self._meal_idle_start_weight = self.idle_reference_gross_grams
                        events.append(
                            f'event=eat_started idle_last={self._meal_idle_start_weight:.2f} '
                            f'current={gross_avg_grams:.2f} '
                            f'drop={self._meal_idle_start_weight - gross_avg_grams:.2f}'
                        )
                        self._start_candidate_since = 0.0
                        self._start_reference_grams = None
            else:
                # 条件を外れたら開始候補をリセットする
                self._start_candidate_since = 0.0
                self._start_reference_grams = None
                self._refresh_idle_reference(
                    avg_grams=avg_grams,
                    gross_avg_grams=gross_avg_grams,
                    now=now,
                )

        elif self.state == EatingState.MEASURING:
            # 変動が小さい期間を数えて終了方向へ遷移する
            if (
                self.prev_avg_grams is not None
                and abs(avg_grams - self.prev_avg_grams) <= self.config.stability_epsilon_g
            ):
                if now - self._stabilized_since >= self.config.end_stable_seconds:
                    self.state = EatingState.STABILIZING
                    self._stabilized_since = now
                    self._finish_stable_gross_samples.clear()
                    self._finish_stable_gross_samples.append(gross_avg_grams)
                    events.append('event=eat_stabilizing')
            else:
                self._stabilized_since = now

            # 異常に長いセッションは打ち切る
            if now - self._session_started_at >= self.config.max_session_seconds:
                self.state = EatingState.ABORTED
                self._abort_reason = 'session_timeout'

        elif self.state == EatingState.STABILIZING:
            # STABILIZINGは終了候補の最終確認状態
            # 安定確認中に再び変動が大きくなれば計測に戻す
            if (
                self.prev_avg_grams is not None
                and abs(avg_grams - self.prev_avg_grams) > self.config.stability_epsilon_g
            ):
                self.state = EatingState.MEASURING
                self._stabilized_since = now
                self._finish_stable_gross_samples.clear()
            else:
                self._finish_stable_gross_samples.append(gross_avg_grams)
                if now - self._stabilized_since >= self.config.finalize_seconds:
                    events.extend(
                        self._finalize_meal(
                            avg_grams=avg_grams,
                            gross_avg_grams=gross_avg_grams,
                        )
                    )

        elif self.state == EatingState.ABORTED:
            events.append(f'event=eat_aborted reason={self._abort_reason}')
            self.tracking_baseline_grams = avg_grams
            self.reset_start_reference()
            self.clear_idle_reference()
            self._finish_stable_gross_samples.clear()
            self.state = EatingState.IDLE

        self.prev_avg_grams = avg_grams
        return events
