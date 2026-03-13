from __future__ import annotations

import json
import urllib.error
import urllib.request


REQUIRED_SETTING_KEYS = {
    'device_id',
    'stable_duration_sec',
    'max_session_sec',
    'lock_version',
    'tare_weight',
    'stability_epsilon_g',
    'sampling_hz',
    'moving_avg_window',
    'gross_weight_limit_g',
}
# このキーが足りない設定は使わない


def _build_url(*, api_base_url: str, endpoint_template: str, device_id: str) -> str:
    """
    @description APIベースURLとエンドポイントテンプレートからURLを組み立てる
    """
    endpoint = endpoint_template.format(device_id=device_id)
    return f"{api_base_url.rstrip('/')}{endpoint}"


def _request_json(*, url: str, token: str, timeout_sec: int) -> dict:
    """
    @description JSONレスポンスを返すGETリクエストを実行する
    """
    headers: dict[str, str] = {}
    if token:
        # APIトークンミドルウェア通過用
        headers['X-Api-Token'] = token

    req = urllib.request.Request(url=url, headers=headers, method='GET')
    # 失敗時は例外になるので呼び出し側で捕まえる
    with urllib.request.urlopen(req, timeout=timeout_sec) as res:
        body = res.read().decode('utf-8')
        return json.loads(body)


def fetch_version(
    *,
    api_base_url: str,
    endpoint_template: str,
    device_id: str,
    token: str,
    timeout_sec: int,
) -> tuple[bool, dict | None, str]:
    """
    @description DeviceSettingsのlock_versionだけ取得する
    @returns 成功可否, payload, メッセージ
    """
    # まず軽いversion APIだけ呼んで更新有無を見る
    url = _build_url(
        api_base_url=api_base_url,
        endpoint_template=endpoint_template,
        device_id=device_id,
    )

    try:
        payload = _request_json(url=url, token=token, timeout_sec=timeout_sec)
    except urllib.error.HTTPError as exc:
        return False, None, f'HTTP {exc.code}'
    except urllib.error.URLError as exc:
        return False, None, f'NETWORK {exc.reason}'
    except json.JSONDecodeError:
        return False, None, 'INVALID_JSON'

    if not isinstance(payload, dict):
        return False, None, 'INVALID_PAYLOAD'

    lock_version = payload.get('lock_version')
    # version API は lock_version だけが契約なので、ここが壊れていたら即不採用にする
    if not isinstance(lock_version, int):
        return False, None, 'INVALID_LOCK_VERSION'

    return True, payload, 'OK'


def fetch_settings(
    *,
    api_base_url: str,
    endpoint_template: str,
    device_id: str,
    token: str,
    timeout_sec: int,
) -> tuple[bool, dict | None, str]:
    """
    @description DeviceSettings本体を取得して型チェック済み辞書で返す
    @returns 成功可否, payload, メッセージ
    """
    # 設定本体は更新が必要なときだけ取得する
    url = _build_url(
        api_base_url=api_base_url,
        endpoint_template=endpoint_template,
        device_id=device_id,
    )

    try:
        payload = _request_json(url=url, token=token, timeout_sec=timeout_sec)
    except urllib.error.HTTPError as exc:
        return False, None, f'HTTP {exc.code}'
    except urllib.error.URLError as exc:
        return False, None, f'NETWORK {exc.reason}'
    except json.JSONDecodeError:
        return False, None, 'INVALID_JSON'

    if not isinstance(payload, dict):
        return False, None, 'INVALID_PAYLOAD'

    # 欠落キーを先に弾くと、後段の int/float 変換失敗と原因を分けて追える
    missing = REQUIRED_SETTING_KEYS - set(payload.keys())
    if missing:
        return False, None, f'MISSING_KEYS {sorted(missing)}'

    # 取得時点で数値型を正規化して後続の適用処理を単純化する
    try:
        normalized = {
            'device_id': str(payload['device_id']),
            'stable_duration_sec': int(payload['stable_duration_sec']),
            'max_session_sec': int(payload['max_session_sec']),
            'lock_version': int(payload['lock_version']),
            'tare_weight': float(payload['tare_weight']),
            'stability_epsilon_g': float(payload['stability_epsilon_g']),
            'sampling_hz': int(payload['sampling_hz']),
            'moving_avg_window': int(payload['moving_avg_window']),
            'gross_weight_limit_g': float(payload['gross_weight_limit_g']),
            'updated_at': payload.get('updated_at'),
        }
    except (TypeError, ValueError):
        return False, None, 'INVALID_VALUE_TYPE'

    return True, normalized, 'OK'
