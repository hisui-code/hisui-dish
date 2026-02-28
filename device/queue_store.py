import json
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def _load_queue(path: Path) -> list[dict]:
    """
    @description JSONLキューをメモリへ読み込む
    """
    # まだキューファイルが無い場合は空配列で開始する
    # 初回起動時はファイル未作成であるため、例外にせず「キュー0件」として扱う
    if not path.exists():
        return []

    records: list[dict] = []
    # with文を使うと、読み終わったあとファイルを自動でcloseしてくれる
    with path.open('r', encoding='utf-8') as fp:
        # ファイルを1行ずつ取り出して処理する
        for line in fp:
            # 行末の改行や余分な空白を取り除く
            line = line.strip()
            # 空行は読み飛ばす
            if not line:
                continue
            # 1行1JSONのため1行ずつ辞書に戻す
            records.append(json.loads(line))
    return records


def _save_queue(path: Path, records: list[dict]) -> None:
    """
    @description キュー全体をJSONLとして保存する
    """
    with path.open('w', encoding='utf-8') as fp:
        for record in records:
            # JSONL形式で1レコードを1行に保存する
            fp.write(json.dumps(record, ensure_ascii=False) + '\n')


def enqueue_finished_event(path: Path, record: dict[str, str | float], device_id: str) -> bool:
    """
    @description eat_finishedイベントを送信キューへ投入する
    @returns キュー投入した場合はTrue
    """
    # 送信キューに積むのは食事完了イベントのみ
    if record.get('event') != 'eat_finished':
        return False

    # API仕様で必須なのでdevice_id未設定は弾く
    if not device_id:
        return False

    eaten = record.get('eaten')
    # eatenが数値でないレコードは不正扱いにする
    if not isinstance(eaten, (int, float)):
        return False

    # 再送管理に使う現在時刻
    now_epoch = int(time.time())
    now_iso = datetime.now(timezone.utc).isoformat()
    # 冪等送信に使うセッションID
    session_id = str(uuid4())

    # API送信用payloadを組み立てる
    payload: dict[str, str | float] = {
        'session_id': session_id,
        'device_id': device_id,
        'event': record.get('event', 'eat_finished'),
        'eaten': record.get('eaten', 0.0),
        'recorded_at': record.get('recorded_at', now_iso),
    }

    # キュー1件の管理情報
    queue_item = {
        'session_id': session_id,
        'status': 'pending',
        'attempt_count': 0,
        'next_retry_at': now_epoch,
        'last_error': '',
        'created_at': now_iso,
        'payload': payload,
    }

    # ファイルキューを読み込んで末尾に追加して保存
    records = _load_queue(path)
    records.append(queue_item)
    _save_queue(path, records)
    return True


def flush_queue(
    *,
    path: Path,
    retry_interval_sec: int,
    max_retry_count: int,
    sender,
) -> dict[str, int]:
    """
    @description 送信可能なキューを処理し、再送状態を更新する
    """
    # 送信判定に使う現在時刻
    now_epoch = int(time.time())
    now_iso = datetime.now(timezone.utc).isoformat()

    # 既存キューを読み込んで順番に処理する
    records = _load_queue(path)
    sent = 0
    retried = 0
    failed = 0

    for item in records:
        # pending以外は処理済みなのでスキップ
        if item.get('status') != 'pending':
            continue

        # 再送待ち時間中のレコードはまだ送らない
        if int(item.get('next_retry_at', 0)) > now_epoch:
            continue

        # senderにはHTTP送信処理を渡している
        ok, message = sender(item['payload'])
        if ok:
            # 成功したらsentに確定する
            item['status'] = 'sent'
            item['sent_at'] = now_iso
            item['last_error'] = ''
            sent += 1
            continue

        # 失敗時は試行回数を増やして再送スケジュールを更新する
        attempt_count = int(item.get('attempt_count', 0)) + 1
        item['attempt_count'] = attempt_count
        item['last_error'] = message

        if attempt_count >= max_retry_count:
            # 規定回数を超えたら失敗確定にする
            item['status'] = 'failed'
            item['failed_at'] = now_iso
            failed += 1
        else:
            # 次回の送信可能時刻を設定する
            item['next_retry_at'] = now_epoch + retry_interval_sec
            retried += 1

    # 全件更新後にキューファイルを書き戻す
    _save_queue(path, records)
    return {'sent': sent, 'retried': retried, 'failed': failed}
