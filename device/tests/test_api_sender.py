import sys
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch


sys.path.append(str(Path(__file__).resolve().parents[1]))

from api_sender import post_bowl_snapshot, post_session_event  # noqa: E402


class _FakeResponse:
    def __init__(self, status: int) -> None:
        self._status = status

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None

    def getcode(self) -> int:
        return self._status


class ApiSenderTest(unittest.TestCase):
    def test_post_session_event_returns_true_on_2xx(self) -> None:
        # HTTP成功時は詳細本文に依存せず 2xx だけで成功判定する
        with patch('urllib.request.urlopen', return_value=_FakeResponse(201)):
            ok, message = post_session_event(
                api_base_url='https://example.com',
                endpoint_path='/api/v1/device/session_events',
                token='token',
                timeout_sec=3,
                payload={'event': 'eat_finished'},
            )

        self.assertTrue(ok)
        self.assertEqual('HTTP 201', message)

    def test_post_session_event_returns_false_on_http_error(self) -> None:
        with patch(
            'urllib.request.urlopen',
            side_effect=urllib.error.HTTPError(
                url='https://example.com',
                code=500,
                msg='error',
                hdrs=None,
                fp=None,
            ),
        ), patch('retry_policy.time.sleep', return_value=None):
            ok, message = post_session_event(
                api_base_url='https://example.com',
                endpoint_path='/api/v1/device/session_events',
                token='token',
                timeout_sec=3,
                payload={'event': 'eat_finished'},
            )

        self.assertFalse(ok)
        self.assertEqual('HTTP 500', message)

    def test_post_session_event_retries_transient_network_error(self) -> None:
        with patch(
            'urllib.request.urlopen',
            side_effect=[urllib.error.URLError('temporary'), _FakeResponse(200)],
        ), patch('retry_policy.time.sleep', return_value=None):
            ok, message = post_session_event(
                api_base_url='https://example.com',
                endpoint_path='/api/v1/device/session_events',
                token='token',
                timeout_sec=3,
                payload={'event': 'eat_finished'},
            )

        self.assertTrue(ok)
        self.assertEqual('HTTP 200', message)

    def test_post_bowl_snapshot_reuses_session_sender_logic(self) -> None:
        # snapshot だけ別実装に分岐して送信仕様がズレないように固定する
        with patch('api_sender.post_session_event', return_value=(True, 'HTTP 200')) as mocked:
            ok, message = post_bowl_snapshot(
                api_base_url='https://example.com',
                endpoint_path='/api/v1/device/bowl_snapshots',
                token='token',
                timeout_sec=3,
                payload={'weight_g': 10.0},
            )

        self.assertTrue(ok)
        self.assertEqual('HTTP 200', message)
        mocked.assert_called_once()
