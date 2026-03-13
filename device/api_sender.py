from __future__ import annotations

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
    本番環境では api.token ミドルウェア通過のため X-Api-Token を送る
    @returns 成功可否とメッセージ
    """
    # APIベースURLとエンドポイントを結合して送信先URLを作る
    url = f"{api_base_url.rstrip('/')}{endpoint_path}"

    # 両APIで同じ認証ヘッダを使うので、この関数を送信の共通入口にする
    headers = {'Content-Type': 'application/json'}
    if token:
        # 本番のAPIトークン検証で使うヘッダ
        headers['X-Api-Token'] = token
        # 既存の認証方式と互換を保つためBearerも付与する
        headers['Authorization'] = f'Bearer {token}'

    # payloadをJSON文字列へ変換してHTTP POSTリクエストを作る
    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers=headers,
        method='POST',
    )

    try:
        # タイムアウト付きで送信し、HTTPステータスで成功判定する
        with urllib.request.urlopen(req, timeout=timeout_sec) as res:
            status = res.getcode()
            if 200 <= status < 300:
                return True, f'HTTP {status}'
            return False, f'HTTP {status}'
    # サーバーが4xx/5xxを返した場合はHTTPErrorになる
    except urllib.error.HTTPError as exc:
        return False, f'HTTP {exc.code}'
    # DNS失敗や接続拒否など通信エラーはURLErrorになる
    except urllib.error.URLError as exc:
        return False, f'NETWORK {exc.reason}'


def post_bowl_snapshot(
    *,
    api_base_url: str,
    endpoint_path: str,
    token: str,
    timeout_sec: int,
    payload: dict,
) -> tuple[bool, str]:
    """
    @description bowl_snapshotをAPIへ送信する
    @returns 成功可否とメッセージ
    """
    # endpoint 以外の送信仕様は共通なので分岐させず委譲する
    return post_session_event(
        api_base_url=api_base_url,
        endpoint_path=endpoint_path,
        token=token,
        timeout_sec=timeout_sec,
        payload=payload,
    )
