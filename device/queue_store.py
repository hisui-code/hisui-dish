import json
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def _load_queue(path: Path) -> list[dict]:
    """
    @description JSONLキューをメモリへ読み込む
    """
    if not path.exists():
        return []

    records: list[dict] = []
    with path.open('r', encoding='utf-8') as fp:
        for line in fp:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
    return records


def _save_queue(path: Path, records: list[dict]) -> None:
    """
    @description キュー全体をJSONLとして保存する
    """
    with path.open('w', encoding='utf-8') as fp:
        for record in records:
            fp.write(json.dumps(record, ensure_ascii=False) + '\n')


def enqueue_finished_event(path: Path, record: dict[str, str | float], device_id: str) -> bool:
    """
    @description eat_finishedイベントを送信キューへ投入する
    @returns キュー投入した場合はTrue
    """
    if record.get('event') != 'eat_finished':
        return False

    now_epoch = int(time.time())
    now_iso = datetime.now(timezone.utc).isoformat()
    session_id = str(uuid4())

    payload: dict[str, str | float] = {
        'session_id': session_id,
        'event': record.get('event', 'eat_finished'),
        'start': record.get('start', 0.0),
        'min': record.get('min', 0.0),
        'eaten': record.get('eaten', 0.0),
        'recorded_at': record.get('recorded_at', now_iso),
    }
    if device_id:
        payload['device_id'] = device_id

    queue_item = {
        'session_id': session_id,
        'status': 'pending',
        'attempt_count': 0,
        'next_retry_at': now_epoch,
        'last_error': '',
        'created_at': now_iso,
        'payload': payload,
    }

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
    now_epoch = int(time.time())
    now_iso = datetime.now(timezone.utc).isoformat()

    records = _load_queue(path)
    sent = 0
    retried = 0
    failed = 0

    for item in records:
        if item.get('status') != 'pending':
            continue

        if int(item.get('next_retry_at', 0)) > now_epoch:
            continue

        ok, message = sender(item['payload'])
        if ok:
            item['status'] = 'sent'
            item['sent_at'] = now_iso
            item['last_error'] = ''
            sent += 1
            continue

        # 失敗時は再送回数を増やす
        attempt_count = int(item.get('attempt_count', 0)) + 1
        item['attempt_count'] = attempt_count
        item['last_error'] = message

        if attempt_count >= max_retry_count:
            item['status'] = 'failed'
            item['failed_at'] = now_iso
            failed += 1
        else:
            item['next_retry_at'] = now_epoch + retry_interval_sec
            retried += 1

    _save_queue(path, records)
    return {'sent': sent, 'retried': retried, 'failed': failed}
