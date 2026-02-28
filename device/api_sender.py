import json
import urllib.error
import urllib.request


def post_session_event(
    *,
    api_base_url: str,
    endpoint_path: str,
    token: str,
    timeout_sec: int,
    payload: dict,
) -> tuple[bool, str]:
    """
    @description セッションイベントをAPIへ送信する
    @returns 成功可否とメッセージ
    """
    url = f"{api_base_url.rstrip('/')}{endpoint_path}"

    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers=headers,
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as res:
            status = res.getcode()
            if 200 <= status < 300:
                return True, f'HTTP {status}'
            return False, f'HTTP {status}'
    except urllib.error.HTTPError as exc:
        return False, f'HTTP {exc.code}'
    except urllib.error.URLError as exc:
        return False, f'NETWORK {exc.reason}'
