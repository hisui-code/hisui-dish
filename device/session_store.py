import json
from datetime import datetime, timezone
from pathlib import Path


def _parse_event_line(event_line: str) -> dict[str, str | float]:
    """
    @description key=value形式のイベント文字列を辞書へ変換する
    """
    parsed: dict[str, str | float] = {}
    # "key=value" が空白区切りで並ぶログ文字列を分解する
    for token in event_line.split():
        # key=value 形式でない断片は無視する
        if '=' not in token:
            continue

        key, value = token.split('=', 1)
        # 数値として扱いたい項目だけfloatへ変換する
        if key in {'eaten'}:
            try:
                parsed[key] = float(value)
            except ValueError:
                # 変換できない値は文字列のまま保持する
                parsed[key] = value
            continue

        # それ以外は文字列として保存する
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

    # ログ行をAPI送信用の基本レコードに変換する
    record = _parse_event_line(event_line)
    # UTCで保存して後段処理のタイムゾーン解釈を統一する
    record['recorded_at'] = datetime.now(timezone.utc).isoformat()
    return record


def append_session_event(path: Path, event_line: str) -> dict[str, str | float] | None:
    """
    @description 完了イベントをJSONLでローカル保存する
    @returns 保存したレコード それ以外はNone
    """
    record = build_session_record(event_line)
    if record is None:
        return None

    # JSONL形式で1レコードを1行に追記する
    with path.open('a', encoding='utf-8') as fp:
        fp.write(json.dumps(record, ensure_ascii=False) + '\n')

    return record
