import sys
import urllib.error
import unittest
from pathlib import Path
from unittest.mock import patch


sys.path.append(str(Path(__file__).resolve().parents[1]))

from retry_policy import _is_retryable_request_error, retry_network_request  # noqa: E402


class RetryPolicyTest(unittest.TestCase):
    def test_retryable_request_error_accepts_url_error(self) -> None:
        self.assertTrue(_is_retryable_request_error(urllib.error.URLError('timeout')))

    def test_retryable_request_error_accepts_http_5xx(self) -> None:
        self.assertTrue(
            _is_retryable_request_error(
                urllib.error.HTTPError(
                    url='https://example.com',
                    code=503,
                    msg='error',
                    hdrs=None,
                    fp=None,
                )
            )
        )

    def test_retryable_request_error_rejects_http_4xx(self) -> None:
        self.assertFalse(
            _is_retryable_request_error(
                urllib.error.HTTPError(
                    url='https://example.com',
                    code=404,
                    msg='error',
                    hdrs=None,
                    fp=None,
                )
            )
        )

    def test_retry_network_request_retries_transient_error_then_succeeds(self) -> None:
        calls = {'count': 0}

        @retry_network_request()
        def flaky() -> str:
            calls['count'] += 1
            if calls['count'] == 1:
                raise urllib.error.URLError('temporary')
            return 'ok'

        with patch('retry_policy.time.sleep', return_value=None):
            result = flaky()

        self.assertEqual('ok', result)
        self.assertEqual(2, calls['count'])
