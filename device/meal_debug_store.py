from __future__ import annotations

import json
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _build_event_summary(*, event_line: str, recorded_at: str | None) -> dict[str, str | float]:
    """
    @description debug capture 保存用にイベント文字列を要約する
    """
    summary: dict[str, str | float] = {}
    for token in event_line.split():
        if '=' not in token:
            continue

        key, value = token.split('=', 1)
        if key in {'idle_last', 'finish', 'eaten', 'current', 'drop'}:
            try:
                summary[key] = float(value)
            except ValueError:
                summary[key] = value
            continue

        summary[key] = value

    if recorded_at is None:
        recorded_at = datetime.now(timezone.utc).isoformat()
    summary['event_recorded_at'] = recorded_at
    return summary


def _build_debug_filename(*, recorded_at: str, event_name: str) -> str:
    """
    @description イベント時刻を含む debug 保存ファイル名を作る
    """
    event_at = datetime.fromisoformat(recorded_at).astimezone(timezone.utc)
    timestamp = event_at.strftime('%Y-%m-%dT%H-%M-%S.%fZ')
    return f'{timestamp}_{event_name}.json'


@dataclass
class _ActiveCapture:
    """
    @description 食事中の debug capture を保持する
    """

    pre_samples: list[dict[str, str | float]]
    session_samples: list[dict[str, str | float]]


@dataclass
class _PendingCapture:
    """
    @description 終了後の post_samples を待っている debug capture
    """

    event_summary: dict[str, str | float]
    pre_samples: list[dict[str, str | float]]
    session_samples: list[dict[str, str | float]]
    post_samples: list[dict[str, str | float]]
    save_at: float


class MealDebugStore:
    """
    @description 食事イベント前後3分の debug capture をローカル保存する
    """

    def __init__(
        self,
        *,
        directory: Path,
        window_seconds: float,
        retention_days: int,
    ) -> None:
        self.directory = directory
        self.window_seconds = window_seconds
        self.retention_days = retention_days
        self._recent_samples: deque[dict[str, str | float]] = deque()
        self._active_capture: _ActiveCapture | None = None
        self._pending_capture: _PendingCapture | None = None

    def append_sample(
        self,
        *,
        now: float,
        recorded_at: str,
        state: str,
        grams: float,
        avg_grams: float | None,
        start_baseline: float | str,
        idle_ref: float | str,
    ) -> None:
        """
        @description 食事前後確認に必要な最小限サンプルを保持する
        """
        sample = {
            'recorded_at': recorded_at,
            'state': state,
            'grams': grams,
            'avg_grams': avg_grams,
            'start_baseline': start_baseline,
            'idle_ref': idle_ref,
            '_monotonic': now,
        }
        self._recent_samples.append(sample)
        self._trim_recent_samples(now=now)

        public_sample = self._public_sample(sample)
        if self._active_capture is not None:
            self._active_capture.session_samples.append(public_sample)
        elif self._pending_capture is not None:
            self._pending_capture.post_samples.append(public_sample)

    def begin_capture(self, *, now: float) -> None:
        """
        @description eat_started 時点の pre_samples を固定して session 記録を始める
        """
        pre_samples = [
            self._public_sample(sample)
            for sample in self._recent_samples
            if now - float(sample['_monotonic']) <= self.window_seconds
        ]
        self._active_capture = _ActiveCapture(
            pre_samples=pre_samples,
            session_samples=[],
        )

    def finish_capture(
        self,
        *,
        now: float,
        event_line: str,
        recorded_at: str | None = None,
    ) -> None:
        """
        @description 終了イベントを受けて post_samples 収集待ちへ切り替える
        """
        event_summary = _build_event_summary(event_line=event_line, recorded_at=recorded_at)
        pre_samples = (
            self._active_capture.pre_samples
            if self._active_capture is not None
            else [
                self._public_sample(sample)
                for sample in self._recent_samples
                if now - float(sample['_monotonic']) <= self.window_seconds
            ]
        )
        session_samples = (
            self._active_capture.session_samples if self._active_capture is not None else []
        )
        self._active_capture = None
        self._pending_capture = _PendingCapture(
            event_summary=event_summary,
            pre_samples=pre_samples,
            session_samples=session_samples,
            post_samples=[],
            save_at=now + self.window_seconds,
        )

    def flush_ready_capture(self, *, now: float) -> Path | None:
        """
        @description post_samples が揃った debug capture をファイル保存する
        """
        if self._pending_capture is None or now < self._pending_capture.save_at:
            return None

        pending_capture = self._pending_capture
        self._pending_capture = None
        return self._write_capture(pending_capture)

    def cleanup_expired(self, *, now_utc: datetime | None = None) -> int:
        """
        @description 保持期間を超えた debug capture ファイルを削除する
        """
        if now_utc is None:
            now_utc = datetime.now(timezone.utc)

        cutoff = now_utc - timedelta(days=self.retention_days)
        deleted_count = 0
        if not self.directory.exists():
            return 0

        for path in self.directory.glob('*.json'):
            event_at = self._extract_event_at_from_path(path)
            if event_at is None or event_at >= cutoff:
                continue

            path.unlink()
            deleted_count += 1

        return deleted_count

    def _trim_recent_samples(self, *, now: float) -> None:
        """
        @description 直近 window の外へ出たサンプルをリングバッファから落とす
        """
        while self._recent_samples:
            oldest = self._recent_samples[0]
            if now - float(oldest['_monotonic']) <= self.window_seconds:
                break
            self._recent_samples.popleft()

    def _write_capture(self, pending_capture: _PendingCapture) -> Path:
        """
        @description 1イベント1ファイルで debug capture を保存する
        """
        self.directory.mkdir(parents=True, exist_ok=True)
        recorded_at = str(pending_capture.event_summary['event_recorded_at'])
        event_name = str(pending_capture.event_summary.get('event', 'unknown'))
        path = self.directory / _build_debug_filename(
            recorded_at=recorded_at,
            event_name=event_name,
        )
        payload = {
            'event_summary': pending_capture.event_summary,
            'pre_samples': pending_capture.pre_samples,
            'session_samples': pending_capture.session_samples,
            'post_samples': pending_capture.post_samples,
        }
        with path.open('w', encoding='utf-8') as fp:
            json.dump(payload, fp, ensure_ascii=False, indent=2)
        return path

    def _extract_event_at_from_path(self, path: Path) -> datetime | None:
        """
        @description ファイル名からイベント時刻を取り出して保持期間判定に使う
        """
        try:
            timestamp = path.stem.split('_', 1)[0]
            return datetime.strptime(timestamp, '%Y-%m-%dT%H-%M-%S.%fZ').replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            return None

    def _public_sample(self, sample: dict[str, str | float]) -> dict[str, str | float]:
        """
        @description 内部用 monotonic を除いた保存向けサンプルへ変換する
        """
        return {
            key: value
            for key, value in sample.items()
            if key != '_monotonic'
        }
