import json
from datetime import datetime, timezone
from pathlib import Path


def _parse_event_line(event_line: str) -> dict[str, str | float]:
    """
    @description key=value形式のイベント文字列を辞書へ変換する
    """
    parsed: dict[str, str | float] = {}
    for token in event_line.split():
        if '=' not in token:
            continue

        key, value = token.split('=', 1)
        if key in {'start', 'min', 'eaten'}:
            try:
                parsed[key] = float(value)
            except ValueError:
                parsed[key] = value
            continue

        parsed[key] = value

    return parsed


def build_session_record(event_line: str) -> dict[str, str | float] | None:
    """
    @description 保存対象イベントを正規化してレコード化する
    @returns 保存対象なら辞書 それ以外はNone
    """
    # 保存対象はセッション結果のみ
    if not (
        event_line.startswith('event=eat_finished')
        or event_line.startswith('event=eat_discarded')
    ):
        return None

    record = _parse_event_line(event_line)
    # UTCで保存して後段処理のタイムゾーン解釈を統一する
    record['recorded_at'] = datetime.now(timezone.utc).isoformat()
    return record


def append_session_event(path: Path, event_line: str) -> dict[str, str | float] | None:
    """
    @description 完了イベントをJSONLでローカル保存する
    @returns 保存した場合はTrue それ以外はFalse
    """
    record = build_session_record(event_line)
    if record is None:
        return None

    with path.open('a', encoding='utf-8') as fp:
        fp.write(json.dumps(record, ensure_ascii=False) + '\n')

    return record
