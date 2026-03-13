from __future__ import annotations

import time
import urllib.error
from functools import wraps
from typing import Any, Callable, TypeVar

from config import MAX_RETRY_COUNT, RETRY_INTERVAL_SEC

try:
    from tenacity import retry, retry_if_exception, stop_after_attempt, wait_fixed

    TENACITY_AVAILABLE = True
except ImportError:
    TENACITY_AVAILABLE = False


FuncT = TypeVar('FuncT', bound=Callable[..., Any])


def _is_retryable_request_error(exc: BaseException) -> bool:
    """
    @description 一時的な通信失敗として再試行する例外かを判定する
    """
    # HTTPError は URLError の派生なので、先に HTTP ステータスを判定する
    # 4xx を先に除外しないと、すべて再試行対象になってしまう
    if isinstance(exc, urllib.error.HTTPError):
        return 500 <= exc.code < 600

    # 接続失敗やDNS失敗は短時間で回復することがあるため再試行する
    if isinstance(exc, urllib.error.URLError):
        return True

    return False


def retry_network_request() -> Callable[[FuncT], FuncT]:
    """
    @description HTTP 通信だけへ短い再試行を付ける decorator を返す
    """
    if TENACITY_AVAILABLE:
        # 通信層だけで短い再試行を閉じる
        # main や queue 側には成功 / 失敗だけ返したい
        return retry(
            retry=retry_if_exception(_is_retryable_request_error),
            stop=stop_after_attempt(MAX_RETRY_COUNT),
            wait=wait_fixed(RETRY_INTERVAL_SEC),
            reraise=True,
        )

    def decorator(func: FuncT) -> FuncT:
        @wraps(func)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            last_error: BaseException | None = None

            for attempt in range(MAX_RETRY_COUNT):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    if not _is_retryable_request_error(exc):
                        raise

                    last_error = exc
                    if attempt >= MAX_RETRY_COUNT - 1:
                        raise

                    # tenacity 未導入環境でも、同じ retry 方針でローカル確認できるようにする
                    time.sleep(RETRY_INTERVAL_SEC)

            if last_error is not None:
                raise last_error

            return func(*args, **kwargs)

        return wrapped  # type: ignore[return-value]

    return decorator
