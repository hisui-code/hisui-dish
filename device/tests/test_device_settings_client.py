import json
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch


sys.path.append(str(Path(__file__).resolve().parents[1]))

from device_settings_client import fetch_settings, fetch_version  # noqa: E402


class DeviceSettingsClientTest(unittest.TestCase):
    def test_fetch_version_rejects_invalid_lock_version(self) -> None:
        # version API が壊れても main 側で継続判断できるよう False を返す
        with patch(
            'device_settings_client._request_json',
            return_value={'lock_version': None},
        ):
            ok, payload, reason = fetch_version(
                api_base_url='https://example.com',
                endpoint_template='/api/v1/device/device_settings/{device_id}/version',
                device_id='device-1',
                token='token',
                timeout_sec=3,
            )

        self.assertFalse(ok)
        self.assertIsNone(payload)
        self.assertEqual('INVALID_LOCK_VERSION', reason)

    def test_fetch_settings_rejects_missing_required_keys(self) -> None:
        with patch(
            'device_settings_client._request_json',
            return_value={'device_id': 'device-1'},
        ):
            ok, payload, reason = fetch_settings(
                api_base_url='https://example.com',
                endpoint_template='/api/v1/device/device_settings/{device_id}',
                device_id='device-1',
                token='token',
                timeout_sec=3,
            )

        self.assertFalse(ok)
        self.assertIsNone(payload)
        self.assertTrue(reason.startswith('MISSING_KEYS'))

    def test_fetch_settings_normalizes_value_types(self) -> None:
        # APIの文字列数値を client 層で正規化して、適用側の分岐を減らす
        with patch(
            'device_settings_client._request_json',
            return_value={
                'device_id': 'device-1',
                'stable_duration_sec': '3',
                'max_session_sec': '120',
                'lock_version': '2',
                'tare_weight': '179.5',
                'stability_epsilon_g': '0.8',
                'sampling_hz': '10',
                'moving_avg_window': '5',
                'gross_weight_limit_g': '500',
                'updated_at': '2026-03-13T00:00:00+00:00',
            },
        ):
            ok, payload, reason = fetch_settings(
                api_base_url='https://example.com',
                endpoint_template='/api/v1/device/device_settings/{device_id}',
                device_id='device-1',
                token='token',
                timeout_sec=3,
            )

        self.assertTrue(ok)
        self.assertEqual('OK', reason)
        assert payload is not None
        self.assertEqual(2, payload['lock_version'])
        self.assertEqual(179.5, payload['tare_weight'])
        self.assertEqual(5, payload['moving_avg_window'])

    def test_fetch_version_rejects_non_dict_payload(self) -> None:
        with patch(
            'device_settings_client._request_json',
            return_value=['unexpected'],
        ):
            ok, payload, reason = fetch_version(
                api_base_url='https://example.com',
                endpoint_template='/api/v1/device/device_settings/{device_id}/version',
                device_id='device-1',
                token='token',
                timeout_sec=3,
            )

        self.assertFalse(ok)
        self.assertIsNone(payload)
        self.assertEqual('INVALID_PAYLOAD', reason)

    def test_fetch_version_retries_transient_network_error(self) -> None:
        class _FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb) -> None:
                return None

            def read(self) -> bytes:
                return b'{"lock_version": 2}'

        with patch(
            'urllib.request.urlopen',
            side_effect=[urllib.error.URLError('temporary'), _FakeResponse()],
        ), patch('retry_policy.time.sleep', return_value=None):
            ok, payload, reason = fetch_version(
                api_base_url='https://example.com',
                endpoint_template='/api/v1/device/device_settings/{device_id}/version',
                device_id='device-1',
                token='token',
                timeout_sec=3,
            )

        self.assertTrue(ok)
        assert payload is not None
        self.assertEqual(2, payload['lock_version'])
        self.assertEqual('OK', reason)
